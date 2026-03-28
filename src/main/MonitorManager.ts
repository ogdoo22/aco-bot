import { ACODatabase } from '../database/Database';
import { TaskManager } from './TaskManager';
import { ProxyManager } from '../services/proxy/ProxyManager';
import { DiscordService } from '../services/discord/DiscordService';
import { ShopifyStockChecker } from '../automation/shopify/ShopifyStockChecker';
import { WalmartStockChecker } from '../automation/walmart/WalmartStockChecker';
import { Monitor, Task, StockCheckResult } from '../shared/types';
import { sendMonitorUpdate } from './main';
import { v4 as uuidv4 } from 'uuid';

export class MonitorManager {
  private database: ACODatabase;
  private taskManager: TaskManager;
  private proxyManager: ProxyManager;
  private discordService: DiscordService;
  private activeMonitors: Map<string, NodeJS.Timeout> = new Map();
  private shopifyChecker: ShopifyStockChecker;
  private walmartChecker: WalmartStockChecker;

  constructor(
    database: ACODatabase,
    taskManager: TaskManager,
    proxyManager: ProxyManager,
    discordService: DiscordService
  ) {
    this.database = database;
    this.taskManager = taskManager;
    this.proxyManager = proxyManager;
    this.discordService = discordService;
    this.shopifyChecker = new ShopifyStockChecker();
    this.walmartChecker = new WalmartStockChecker();
  }

  async startMonitor(monitorId: string): Promise<{ success: boolean; error?: string }> {
    const monitor = this.database.getMonitor(monitorId);
    if (!monitor) {
      return { success: false, error: 'Monitor not found' };
    }

    if (this.activeMonitors.has(monitorId)) {
      return { success: false, error: 'Monitor already running' };
    }

    this.database.updateMonitorStatus(monitorId, 'monitoring');
    sendMonitorUpdate(monitorId, 'monitoring');

    // Poll immediately, then schedule
    this.pollOnce(monitorId);

    return { success: true };
  }

  async stopMonitor(monitorId: string): Promise<{ success: boolean }> {
    const timeout = this.activeMonitors.get(monitorId);
    if (timeout) {
      clearTimeout(timeout);
      this.activeMonitors.delete(monitorId);
    }

    this.database.updateMonitorStatus(monitorId, 'paused');
    sendMonitorUpdate(monitorId, 'paused');

    return { success: true };
  }

  stopAllMonitors(): void {
    this.activeMonitors.forEach((timeout) => clearTimeout(timeout));
    this.activeMonitors.clear();
  }

  private async pollOnce(monitorId: string): Promise<void> {
    const monitor = this.database.getMonitor(monitorId);
    if (!monitor || monitor.status === 'paused' || monitor.status === 'stock_found') {
      return;
    }

    try {
      // Rotate proxy each poll
      const proxy = await this.proxyManager.getProxyForProfile(monitor.profileId);

      let result: StockCheckResult;
      if (monitor.site === 'shopify') {
        result = await this.shopifyChecker.checkStock(monitor.productUrl, monitor.sizes, proxy);
      } else if (monitor.site === 'walmart') {
        result = await this.walmartChecker.checkStock(monitor.productUrl, monitor.sizes, proxy);
      } else {
        throw new Error(`Unsupported site: ${monitor.site}`);
      }

      // Update last checked
      this.database.updateMonitorLastChecked(
        monitorId,
        result.timestamp,
        JSON.stringify(result.availableVariants.map((v) => v.title))
      );
      sendMonitorUpdate(monitorId, 'monitoring', {
        lastChecked: result.timestamp,
        inStock: result.inStock,
      });

      if (result.inStock) {
        await this.onStockFound(monitor, result);
        return; // Don't schedule next poll — monitor is paused
      }

      // Schedule next poll with jitter
      this.scheduleNextPoll(monitorId, monitor.pollInterval);
    } catch (error: any) {
      console.error(`Monitor ${monitorId} poll error:`, error.message);
      this.database.updateMonitorStatus(monitorId, 'error', error.message);
      sendMonitorUpdate(monitorId, 'error', { error: error.message });

      // Continue polling even on error, with a longer backoff
      this.scheduleNextPoll(monitorId, monitor.pollInterval * 2);
    }
  }

  private async onStockFound(monitor: Monitor, result: StockCheckResult): Promise<void> {
    // Update monitor status
    this.database.updateMonitorStatus(monitor.id, 'stock_found');
    sendMonitorUpdate(monitor.id, 'stock_found', {
      availableSizes: result.availableVariants.map((v) => v.title),
    });

    // Stop polling
    const timeout = this.activeMonitors.get(monitor.id);
    if (timeout) {
      clearTimeout(timeout);
      this.activeMonitors.delete(monitor.id);
    }

    // Auto-create and start tasks for each available size
    let tasksStarted = 0;
    for (const variant of result.availableVariants) {
      const task: Task = {
        id: `task_${Date.now()}_${uuidv4().substring(0, 8)}`,
        site: monitor.site,
        productUrl: monitor.productUrl,
        productName: `${monitor.productName} - ${variant.title}`,
        size: variant.title,
        quantity: 1,
        profileId: monitor.profileId,
        proxyId: null,
        mode: monitor.mode,
        status: 'idle',
        retryCount: 0,
        maxRetries: 3,
        delay: 500,
        orderNumber: null,
        errorMessage: null,
        checkoutTime: null,
        createdAt: Date.now(),
        startedAt: null,
        completedAt: null,
      };

      this.database.createTask(task);
      this.database.incrementMonitorTasksCreated(monitor.id);
      await this.taskManager.startTask(task.id);
      tasksStarted++;
    }

    // Send Discord notification
    this.discordService.sendStockFoundNotification({
      productName: monitor.productName,
      productUrl: monitor.productUrl,
      availableSizes: result.availableVariants.map((v) => v.title),
      tasksStarted,
    });

    console.log(`🔔 Stock found for ${monitor.productName}! Started ${tasksStarted} tasks.`);
  }

  private scheduleNextPoll(monitorId: string, intervalMs: number): void {
    // Add jitter: 0-2000ms random
    const jitter = Math.floor(Math.random() * 2000);
    const timeout = setTimeout(() => this.pollOnce(monitorId), intervalMs + jitter);
    this.activeMonitors.set(monitorId, timeout);
  }
}
