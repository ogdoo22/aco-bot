import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  taskId?: string;
  data?: any;
}

/**
 * Structured logger for bot operations
 * Logs to both console and file for analysis
 */
export class Logger {
  private logDir: string;
  private logFile: string;
  private sessionId: string;

  constructor(logDir: string) {
    this.logDir = logDir;
    this.sessionId = `session_${Date.now()}`;
    this.logFile = join(logDir, `${this.sessionId}.jsonl`);

    // Create log directory if it doesn't exist
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    this.info('system', 'Logger initialized', undefined, { sessionId: this.sessionId });
  }

  /**
   * Log with specific level
   */
  private log(level: LogLevel, category: string, message: string, taskId?: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      taskId,
      data,
    };

    // Console output with colors
    const emoji = this.getEmoji(level);
    const color = this.getColor(level);
    const prefix = taskId ? `[${taskId.substring(0, 8)}]` : '';

    console.log(
      `${emoji} ${prefix} ${message}`,
      data ? JSON.stringify(data, null, 2) : ''
    );

    // Write to file (JSONL format - one JSON object per line)
    try {
      appendFileSync(this.logFile, JSON.stringify(entry) + '\n');
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  /**
   * Log debug information
   */
  debug(category: string, message: string, taskId?: string, data?: any): void {
    if (process.env.LOG_LEVEL === 'debug') {
      this.log('debug', category, message, taskId, data);
    }
  }

  /**
   * Log info message
   */
  info(category: string, message: string, taskId?: string, data?: any): void {
    this.log('info', category, message, taskId, data);
  }

  /**
   * Log warning
   */
  warn(category: string, message: string, taskId?: string, data?: any): void {
    this.log('warn', category, message, taskId, data);
  }

  /**
   * Log error
   */
  error(category: string, message: string, taskId?: string, data?: any): void {
    this.log('error', category, message, taskId, data);
  }

  /**
   * Log success
   */
  success(category: string, message: string, taskId?: string, data?: any): void {
    this.log('success', category, message, taskId, data);
  }

  /**
   * Log task lifecycle event
   */
  taskEvent(
    event: 'started' | 'completed' | 'failed' | 'retrying',
    taskId: string,
    data: any
  ): void {
    this.log('info', 'task', `Task ${event}`, taskId, data);
  }

  /**
   * Log checkout step
   */
  checkoutStep(
    step: string,
    taskId: string,
    duration?: number,
    data?: any
  ): void {
    this.log('info', 'checkout', step, taskId, {
      duration,
      ...data,
    });
  }

  /**
   * Log proxy event
   */
  proxyEvent(
    event: 'testing' | 'success' | 'failed' | 'deactivated',
    proxyId: string,
    data?: any
  ): void {
    this.log('info', 'proxy', `Proxy ${event}`, undefined, {
      proxyId,
      ...data,
    });
  }

  /**
   * Log captcha event
   */
  captchaEvent(
    event: 'detected' | 'solving' | 'solved' | 'failed',
    taskId: string,
    data?: any
  ): void {
    this.log('info', 'captcha', `Captcha ${event}`, taskId, data);
  }

  /**
   * Get log file path
   */
  getLogFile(): string {
    return this.logFile;
  }

  /**
   * Get emoji for log level
   */
  private getEmoji(level: LogLevel): string {
    const emojis: Record<LogLevel, string> = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅',
    };
    return emojis[level];
  }

  /**
   * Get color for log level
   */
  private getColor(level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[37m', // White
      warn: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
      success: '\x1b[32m', // Green
    };
    return colors[level];
  }
}

/**
 * Global logger instance (singleton)
 */
let globalLogger: Logger | null = null;

export function initLogger(logDir: string): Logger {
  if (!globalLogger) {
    globalLogger = new Logger(logDir);
  }
  return globalLogger;
}

export function getLogger(): Logger {
  if (!globalLogger) {
    throw new Error('Logger not initialized. Call initLogger() first.');
  }
  return globalLogger;
}
