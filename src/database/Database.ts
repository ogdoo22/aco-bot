import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as crypto from 'crypto-js';
import { Task, Profile, Proxy, TaskResult, Analytics, Monitor, MonitorStatus } from '../shared/types';

/**
 * Database manager for ACO Bot
 */
export class ACODatabase {
  private db: Database.Database;
  private encryptionKey: string;

  constructor(dbPath: string, encryptionKey: string) {
    this.db = new Database(dbPath);
    this.encryptionKey = encryptionKey;
    this.initialize();
  }

  /**
   * Initialize database schema
   */
  private initialize(): void {
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    this.db.exec(schema);
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(data: string): string {
    return crypto.AES.encrypt(data, this.encryptionKey).toString();
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encrypted: string): string {
    const bytes = crypto.AES.decrypt(encrypted, this.encryptionKey);
    return bytes.toString(crypto.enc.Utf8);
  }

  // ==================== PROFILES ====================

  /**
   * Create a new profile
   */
  createProfile(profile: Profile): void {
    const stmt = this.db.prepare(`
      INSERT INTO profiles (id, name, email, phone, shipping_json, billing_json, payment_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const encryptedPayment = this.encrypt(JSON.stringify(profile.payment));

    stmt.run(
      profile.id,
      profile.name,
      profile.email,
      profile.phone,
      JSON.stringify(profile.shipping),
      JSON.stringify(profile.billing),
      encryptedPayment,
      profile.createdAt,
      profile.updatedAt
    );
  }

  /**
   * Get profile by ID
   */
  getProfile(id: string): Profile | null {
    const stmt = this.db.prepare('SELECT * FROM profiles WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      shipping: JSON.parse(row.shipping_json),
      billing: JSON.parse(row.billing_json),
      payment: JSON.parse(this.decrypt(row.payment_json)),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Get all profiles
   */
  getAllProfiles(): Profile[] {
    const stmt = this.db.prepare('SELECT * FROM profiles ORDER BY created_at DESC');
    const rows = stmt.all() as any[];

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      shipping: JSON.parse(row.shipping_json),
      billing: JSON.parse(row.billing_json),
      payment: JSON.parse(this.decrypt(row.payment_json)),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Update profile
   */
  updateProfile(profile: Profile): void {
    const stmt = this.db.prepare(`
      UPDATE profiles
      SET name = ?, email = ?, phone = ?, shipping_json = ?, billing_json = ?, payment_json = ?, updated_at = ?
      WHERE id = ?
    `);

    const encryptedPayment = this.encrypt(JSON.stringify(profile.payment));

    stmt.run(
      profile.name,
      profile.email,
      profile.phone,
      JSON.stringify(profile.shipping),
      JSON.stringify(profile.billing),
      encryptedPayment,
      Date.now(),
      profile.id
    );
  }

  /**
   * Delete profile
   */
  deleteProfile(id: string): void {
    const stmt = this.db.prepare('DELETE FROM profiles WHERE id = ?');
    stmt.run(id);
  }

  // ==================== PROXIES ====================

  /**
   * Create a new proxy (BYOP - profile-specific)
   */
  createProxy(proxy: Proxy): void {
    const stmt = this.db.prepare(`
      INSERT INTO proxies (id, profile_id, host, port, username, password, type, speed_ms, success_rate,
                           total_requests, successful_requests, last_tested, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      proxy.id,
      proxy.profileId,
      proxy.host,
      proxy.port,
      proxy.username,
      proxy.password,
      proxy.type,
      proxy.speedMs,
      proxy.successRate,
      proxy.totalRequests,
      proxy.successfulRequests,
      proxy.lastTested,
      proxy.isActive ? 1 : 0,
      proxy.createdAt
    );
  }

  /**
   * Get proxy by ID
   */
  getProxy(id: string): Proxy | null {
    const stmt = this.db.prepare('SELECT * FROM proxies WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) {
      return null;
    }

    return this.mapProxyFromRow(row);
  }

  /**
   * Get all active proxies (optionally filter by profile)
   */
  getActiveProxies(profileId?: string): Proxy[] {
    let query = 'SELECT * FROM proxies WHERE is_active = 1';
    const params: any[] = [];

    if (profileId) {
      query += ' AND profile_id = ?';
      params.push(profileId);
    }

    query += ' ORDER BY success_rate DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map((row) => this.mapProxyFromRow(row));
  }

  /**
   * Get proxies for a specific profile
   */
  getProxiesByProfile(profileId: string): Proxy[] {
    const stmt = this.db.prepare('SELECT * FROM proxies WHERE profile_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(profileId) as any[];
    return rows.map((row) => this.mapProxyFromRow(row));
  }

  /**
   * Get all proxies
   */
  getAllProxies(): Proxy[] {
    const stmt = this.db.prepare('SELECT * FROM proxies ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapProxyFromRow(row));
  }

  /**
   * Update proxy stats after use
   */
  updateProxyStats(id: string, success: boolean, speedMs: number): void {
    const stmt = this.db.prepare(`
      UPDATE proxies
      SET total_requests = total_requests + 1,
          successful_requests = successful_requests + ?,
          success_rate = CAST(successful_requests + ? AS REAL) / (total_requests + 1),
          speed_ms = ?,
          last_tested = ?
      WHERE id = ?
    `);

    stmt.run(success ? 1 : 0, success ? 1 : 0, speedMs, Date.now(), id);
  }

  /**
   * Deactivate proxy
   */
  deactivateProxy(id: string): void {
    const stmt = this.db.prepare('UPDATE proxies SET is_active = 0 WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Delete proxy
   */
  deleteProxy(id: string): void {
    const stmt = this.db.prepare('DELETE FROM proxies WHERE id = ?');
    stmt.run(id);
  }

  private mapProxyFromRow(row: any): Proxy {
    return {
      id: row.id,
      profileId: row.profile_id,
      host: row.host,
      port: row.port,
      username: row.username,
      password: row.password,
      type: row.type as any,
      speedMs: row.speed_ms,
      successRate: row.success_rate,
      totalRequests: row.total_requests,
      successfulRequests: row.successful_requests,
      lastTested: row.last_tested,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
    };
  }

  // ==================== TASKS ====================

  /**
   * Create a new task
   */
  createTask(task: Task): void {
    const stmt = this.db.prepare(`
      INSERT INTO tasks (id, site, product_url, product_name, size, quantity, profile_id, proxy_id,
                        mode, status, retry_count, max_retries, delay, order_number, error_message,
                        checkout_time, created_at, started_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      task.id,
      task.site,
      task.productUrl,
      task.productName,
      task.size,
      task.quantity,
      task.profileId,
      task.proxyId,
      task.mode,
      task.status,
      task.retryCount,
      task.maxRetries,
      task.delay,
      task.orderNumber,
      task.errorMessage,
      task.checkoutTime,
      task.createdAt,
      task.startedAt,
      task.completedAt
    );
  }

  /**
   * Get task by ID
   */
  getTask(id: string): Task | null {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) {
      return null;
    }

    return this.mapTaskFromRow(row);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    const stmt = this.db.prepare('SELECT * FROM tasks ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapTaskFromRow(row));
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: string): Task[] {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC');
    const rows = stmt.all(status) as any[];
    return rows.map((row) => this.mapTaskFromRow(row));
  }

  /**
   * Update task status
   */
  updateTaskStatus(id: string, status: string, errorMessage?: string): void {
    const stmt = this.db.prepare(`
      UPDATE tasks
      SET status = ?, error_message = ?, started_at = COALESCE(started_at, ?)
      WHERE id = ?
    `);

    stmt.run(status, errorMessage || null, status === 'running' ? Date.now() : null, id);
  }

  /**
   * Complete task (success or failure)
   */
  completeTask(result: TaskResult): void {
    const stmt = this.db.prepare(`
      UPDATE tasks
      SET status = ?, order_number = ?, checkout_time = ?, error_message = ?, completed_at = ?
      WHERE id = ?
    `);

    stmt.run(
      result.success ? 'success' : 'failed',
      result.orderNumber,
      result.checkoutTime,
      result.errorMessage,
      result.timestamp,
      result.taskId
    );

    // Add to history
    this.addTaskHistory(result);
  }

  /**
   * Delete task
   */
  deleteTask(id: string): void {
    const stmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
    stmt.run(id);
  }

  private mapTaskFromRow(row: any): Task {
    return {
      id: row.id,
      site: row.site,
      productUrl: row.product_url,
      productName: row.product_name,
      size: row.size,
      quantity: row.quantity,
      profileId: row.profile_id,
      proxyId: row.proxy_id,
      mode: row.mode as any,
      status: row.status as any,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      delay: row.delay,
      orderNumber: row.order_number,
      errorMessage: row.error_message,
      checkoutTime: row.checkout_time,
      createdAt: row.created_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
    };
  }

  // ==================== TASK HISTORY ====================

  /**
   * Add task to history
   */
  private addTaskHistory(result: TaskResult): void {
    const task = this.getTask(result.taskId);
    if (!task) {
      return;
    }

    const stmt = this.db.prepare(`
      INSERT INTO task_history (task_id, site, product_name, success, order_number, checkout_time,
                               error_message, profile_id, proxy_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      task.id,
      task.site,
      task.productName,
      result.success ? 1 : 0,
      result.orderNumber,
      result.checkoutTime,
      result.errorMessage,
      task.profileId,
      task.proxyId,
      result.timestamp
    );
  }

  /**
   * Get analytics data
   */
  getAnalytics(startDate?: number, endDate?: number): Analytics {
    let query = 'SELECT * FROM task_history';
    const params: number[] = [];

    if (startDate && endDate) {
      query += ' WHERE created_at >= ? AND created_at <= ?';
      params.push(startDate, endDate);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    const totalTasks = rows.length;
    const successfulTasks = rows.filter((r) => r.success === 1).length;
    const failedTasks = totalTasks - successfulTasks;
    const successRate = totalTasks > 0 ? (successfulTasks / totalTasks) * 100 : 0;

    const checkoutTimes = rows.filter((r) => r.checkout_time).map((r) => r.checkout_time);
    const averageCheckoutTime =
      checkoutTimes.length > 0 ? checkoutTimes.reduce((a, b) => a + b, 0) / checkoutTimes.length : 0;

    return {
      totalTasks,
      successfulTasks,
      failedTasks,
      successRate,
      averageCheckoutTime,
      totalSpent: 0, // Will be calculated based on product prices
      estimatedRevenue: 0, // Will be calculated based on resale prices
      estimatedProfit: 0, // Revenue - Spent - Fees
    };
  }

  // ==================== MONITORS ====================

  createMonitor(monitor: Monitor): void {
    const stmt = this.db.prepare(`
      INSERT INTO monitors (id, site, product_url, product_name, sizes_json, profile_id, mode,
                           poll_interval, status, last_checked, last_stock_state, tasks_created,
                           error_message, created_at, started_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      monitor.id,
      monitor.site,
      monitor.productUrl,
      monitor.productName,
      JSON.stringify(monitor.sizes),
      monitor.profileId,
      monitor.mode,
      monitor.pollInterval,
      monitor.status,
      monitor.lastChecked,
      monitor.lastStockState,
      monitor.tasksCreated,
      monitor.errorMessage,
      monitor.createdAt,
      monitor.startedAt
    );
  }

  getMonitor(id: string): Monitor | null {
    const stmt = this.db.prepare('SELECT * FROM monitors WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return this.mapMonitorFromRow(row);
  }

  getAllMonitors(): Monitor[] {
    const stmt = this.db.prepare('SELECT * FROM monitors ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapMonitorFromRow(row));
  }

  updateMonitorStatus(id: string, status: MonitorStatus, errorMessage?: string): void {
    const stmt = this.db.prepare(`
      UPDATE monitors SET status = ?, error_message = ?, started_at = COALESCE(started_at, ?)
      WHERE id = ?
    `);
    stmt.run(status, errorMessage || null, status === 'monitoring' ? Date.now() : null, id);
  }

  updateMonitorLastChecked(id: string, lastChecked: number, stockState: string): void {
    const stmt = this.db.prepare(`
      UPDATE monitors SET last_checked = ?, last_stock_state = ? WHERE id = ?
    `);
    stmt.run(lastChecked, stockState, id);
  }

  incrementMonitorTasksCreated(id: string): void {
    const stmt = this.db.prepare('UPDATE monitors SET tasks_created = tasks_created + 1 WHERE id = ?');
    stmt.run(id);
  }

  deleteMonitor(id: string): void {
    const stmt = this.db.prepare('DELETE FROM monitors WHERE id = ?');
    stmt.run(id);
  }

  private mapMonitorFromRow(row: any): Monitor {
    return {
      id: row.id,
      site: row.site,
      productUrl: row.product_url,
      productName: row.product_name,
      sizes: JSON.parse(row.sizes_json),
      profileId: row.profile_id,
      mode: row.mode as any,
      pollInterval: row.poll_interval,
      status: row.status as any,
      lastChecked: row.last_checked,
      lastStockState: row.last_stock_state,
      tasksCreated: row.tasks_created,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      startedAt: row.started_at,
    };
  }

  // ==================== SETTINGS ====================

  /**
   * Get a setting value
   */
  getSetting(key: string): string | null {
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    const row = stmt.get(key) as any;
    return row ? row.value : null;
  }

  /**
   * Set a setting value
   */
  setSetting(key: string, value: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
    `);
    const now = Date.now();
    stmt.run(key, value, now, value, now);
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}
