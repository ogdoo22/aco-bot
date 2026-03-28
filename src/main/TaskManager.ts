import { ACODatabase } from '../database/Database';
import { ProxyManager } from '../services/proxy/ProxyManager';
import { DiscordService } from '../services/discord/DiscordService';
import { ShopifyAutomation } from '../automation/shopify/ShopifyAutomation';
import { WalmartAutomation } from '../automation/walmart/WalmartAutomation';
import { Task, TaskResult } from '../shared/types';
import { sendTaskUpdate } from './main';

/**
 * Manages task execution and lifecycle
 */
export class TaskManager {
  private database: ACODatabase;
  private proxyManager: ProxyManager;
  private discordService: DiscordService;
  private runningTasks: Map<string, AbortController> = new Map();

  constructor(
    database: ACODatabase,
    proxyManager: ProxyManager,
    discordService: DiscordService
  ) {
    this.database = database;
    this.proxyManager = proxyManager;
    this.discordService = discordService;
  }

  /**
   * Start a single task
   */
  async startTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    const task = this.database.getTask(taskId);

    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    if (this.runningTasks.has(taskId)) {
      return { success: false, error: 'Task already running' };
    }

    // Create abort controller for this task
    const abortController = new AbortController();
    this.runningTasks.set(taskId, abortController);

    // Update task status to running
    this.database.updateTaskStatus(taskId, 'running');
    sendTaskUpdate(taskId, 'running');

    // Execute task in background
    this.executeTask(task, abortController.signal)
      .then((result) => {
        this.handleTaskComplete(result);
      })
      .catch((error) => {
        this.handleTaskError(taskId, error);
      })
      .finally(() => {
        this.runningTasks.delete(taskId);
      });

    return { success: true };
  }

  /**
   * Start multiple tasks
   */
  async startMultipleTasks(taskIds: string[]): Promise<{ success: boolean; started: number }> {
    let started = 0;

    for (const taskId of taskIds) {
      const result = await this.startTask(taskId);
      if (result.success) {
        started++;
      }
      // Add small delay between task starts to avoid detection
      await this.delay(100 + Math.random() * 200);
    }

    return { success: true, started };
  }

  /**
   * Stop a running task
   */
  async stopTask(taskId: string): Promise<{ success: boolean }> {
    const abortController = this.runningTasks.get(taskId);

    if (!abortController) {
      return { success: false };
    }

    abortController.abort();
    this.runningTasks.delete(taskId);
    this.database.updateTaskStatus(taskId, 'failed', 'Manually stopped');
    sendTaskUpdate(taskId, 'failed', { error: 'Manually stopped' });

    return { success: true };
  }

  /**
   * Stop all running tasks
   */
  stopAllTasks(): void {
    this.runningTasks.forEach((abortController, taskId) => {
      abortController.abort();
      this.database.updateTaskStatus(taskId, 'failed', 'App closing');
    });
    this.runningTasks.clear();
  }

  /**
   * Execute a task
   */
  private async executeTask(task: Task, signal: AbortSignal): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      // Get profile
      const profile = this.database.getProfile(task.profileId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Get proxy from profile's proxy pool (BYOP model)
      let proxy = null;
      if (task.proxyId) {
        proxy = this.database.getProxy(task.proxyId);
        if (!proxy || !proxy.isActive) {
          // Try to get another active proxy from this profile's pool
          proxy = await this.proxyManager.getProxyForProfile(task.profileId);
        }
      } else {
        // No specific proxy assigned, get random from profile's pool
        proxy = await this.proxyManager.getProxyForProfile(task.profileId);
      }

      // Check if profile has any proxies configured
      if (!proxy) {
        throw new Error('No active proxies configured for this profile. Please add proxies in profile settings.');
      }

      // Execute based on site
      let orderNumber: string | null = null;

      const captchaApiKey = this.database.getSetting('twoCaptchaApiKey') || '';

      if (task.site === 'shopify') {
        const shopifyBot = new ShopifyAutomation(proxy, captchaApiKey);
        orderNumber = await shopifyBot.checkout(task, profile, signal);
      } else if (task.site === 'walmart') {
        const walmartBot = new WalmartAutomation(proxy, captchaApiKey);
        orderNumber = await walmartBot.checkout(task, profile, signal);
      } else {
        throw new Error(`Unsupported site: ${task.site}`);
      }

      const checkoutTime = Date.now() - startTime;

      // Update proxy stats
      if (proxy) {
        this.database.updateProxyStats(proxy.id, true, checkoutTime);
      }

      return {
        taskId: task.id,
        success: true,
        orderNumber,
        checkoutTime,
        errorMessage: null,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      const checkoutTime = Date.now() - startTime;

      // Update proxy stats (failed)
      if (task.proxyId) {
        const proxy = this.database.getProxy(task.proxyId);
        if (proxy) {
          this.database.updateProxyStats(proxy.id, false, checkoutTime);
        }
      }

      // Check if should retry
      if (task.retryCount < task.maxRetries && !signal.aborted) {
        // Update retry count
        this.database.updateTaskStatus(task.id, 'retrying', error.message);
        sendTaskUpdate(task.id, 'retrying', { error: error.message, retryCount: task.retryCount + 1 });

        // Wait before retry
        await this.delay(task.delay);

        // Retry with new proxy
        const newTask = { ...task, retryCount: task.retryCount + 1, proxyId: null };
        return await this.executeTask(newTask, signal);
      }

      return {
        taskId: task.id,
        success: false,
        orderNumber: null,
        checkoutTime,
        errorMessage: error.message,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Handle task completion
   */
  private handleTaskComplete(result: TaskResult): void {
    this.database.completeTask(result);
    sendTaskUpdate(result.taskId, result.success ? 'success' : 'failed', result);

    if (result.success) {
      // Send Discord notification
      this.discordService.sendSuccessNotification({
        taskId: result.taskId,
        orderNumber: result.orderNumber || 'Unknown',
        checkoutTime: result.checkoutTime,
      });
    }
  }

  /**
   * Handle task error
   */
  private handleTaskError(taskId: string, error: Error): void {
    const result: TaskResult = {
      taskId,
      success: false,
      orderNumber: null,
      checkoutTime: 0,
      errorMessage: error.message,
      timestamp: Date.now(),
    };

    this.database.completeTask(result);
    sendTaskUpdate(taskId, 'failed', { error: error.message });
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
