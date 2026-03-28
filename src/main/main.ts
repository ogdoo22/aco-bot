import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { config } from 'dotenv';
import { ACODatabase } from '../database/Database';
import { TaskManager } from './TaskManager';
import { ProxyManager } from '../services/proxy/ProxyManager';
import { DiscordService } from '../services/discord/DiscordService';
import { Task, Profile, Proxy } from '../shared/types';
import { initLogger, getLogger } from '../shared/Logger';

// Load environment variables
config();

// Initialize logger
const logDir = join(app.getPath('userData'), 'logs');
const logger = initLogger(logDir);

let mainWindow: BrowserWindow | null = null;
let database: ACODatabase | null = null;
let taskManager: TaskManager | null = null;
let proxyManager: ProxyManager | null = null;
let discordService: DiscordService | null = null;
let dbPath: string = '';

/**
 * Create the main application window
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
    backgroundColor: '#1a1a1a',
    show: false,
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Initialize services
 */
function initializeServices(): void {
  dbPath = join(app.getPath('userData'), 'aco-bot.db');
  const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-me';

  database = new ACODatabase(dbPath, encryptionKey);
  proxyManager = new ProxyManager(database);
  discordService = new DiscordService(process.env.DISCORD_WEBHOOK_URL || '');
  taskManager = new TaskManager(database, proxyManager, discordService);

  logger.success('system', 'Services initialized', undefined, {
    dbPath,
    logDir,
    logFile: logger.getLogFile(),
  });

  console.log('✅ Services initialized');
  console.log(`📂 Database: ${dbPath}`);
  console.log(`📝 Logs: ${logger.getLogFile()}`);
}

/**
 * Setup IPC handlers
 */
function setupIPC(): void {
  // ==================== PROFILES ====================
  ipcMain.handle('profile:create', async (_, profile: Profile) => {
    database?.createProfile(profile);
    return { success: true };
  });

  ipcMain.handle('profile:getAll', async () => {
    return database?.getAllProfiles() || [];
  });

  ipcMain.handle('profile:get', async (_, id: string) => {
    return database?.getProfile(id);
  });

  ipcMain.handle('profile:update', async (_, profile: Profile) => {
    database?.updateProfile(profile);
    return { success: true };
  });

  ipcMain.handle('profile:delete', async (_, id: string) => {
    database?.deleteProfile(id);
    return { success: true };
  });

  // ==================== PROXIES (BYOP - Profile-specific) ====================
  ipcMain.handle('proxy:create', async (_, proxy: Proxy) => {
    database?.createProxy(proxy);
    return { success: true };
  });

  ipcMain.handle('proxy:getAll', async () => {
    return database?.getAllProxies() || [];
  });

  ipcMain.handle('proxy:getByProfile', async (_, profileId: string) => {
    return database?.getProxiesByProfile(profileId) || [];
  });

  ipcMain.handle('proxy:getActive', async (_, profileId?: string) => {
    return database?.getActiveProxies(profileId) || [];
  });

  ipcMain.handle('proxy:import', async (_, data: { profileId: string; proxyList: string[]; type: 'residential' | 'datacenter' | 'isp' }) => {
    const count = proxyManager?.importProxiesForProfile(data.profileId, data.proxyList, data.type);
    return { success: true, imported: count };
  });

  ipcMain.handle('proxy:test', async (_, id: string) => {
    return await proxyManager?.testProxy(id);
  });

  ipcMain.handle('proxy:testAll', async () => {
    return await proxyManager?.testAllProxies();
  });

  ipcMain.handle('proxy:delete', async (_, id: string) => {
    database?.deleteProxy(id);
    return { success: true };
  });

  // ==================== TASKS ====================
  ipcMain.handle('task:create', async (_, task: Task) => {
    database?.createTask(task);
    return { success: true };
  });

  ipcMain.handle('task:getAll', async () => {
    return database?.getAllTasks() || [];
  });

  ipcMain.handle('task:start', async (_, taskId: string) => {
    return await taskManager?.startTask(taskId);
  });

  ipcMain.handle('task:startMultiple', async (_, taskIds: string[]) => {
    return await taskManager?.startMultipleTasks(taskIds);
  });

  ipcMain.handle('task:stop', async (_, taskId: string) => {
    return await taskManager?.stopTask(taskId);
  });

  ipcMain.handle('task:delete', async (_, taskId: string) => {
    database?.deleteTask(taskId);
    return { success: true };
  });

  // ==================== ANALYTICS ====================
  ipcMain.handle('analytics:get', async (_, startDate?: number, endDate?: number) => {
    return database?.getAnalytics(startDate, endDate);
  });

  // ==================== DISCORD ====================
  ipcMain.handle('discord:test', async () => {
    return await discordService?.sendTestMessage();
  });

  // ==================== SETTINGS ====================
  ipcMain.handle('settings:get', async (_, key: string) => {
    return database?.getSetting(key);
  });

  ipcMain.handle('settings:set', async (_, key: string, value: string) => {
    database?.setSetting(key, value);
    return { success: true };
  });

  ipcMain.handle('settings:getAll', async () => {
    return {
      twoCaptchaApiKey: database?.getSetting('twoCaptchaApiKey') || process.env.TWOCAPTCHA_API_KEY || '',
      discordWebhookUrl: database?.getSetting('discordWebhookUrl') || process.env.DISCORD_WEBHOOK_URL || '',
      dbPath: dbPath,
      logDir: logDir,
    };
  });

  console.log('✅ IPC handlers registered');
}

/**
 * App lifecycle
 */
app.whenReady().then(() => {
  initializeServices();
  setupIPC();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  taskManager?.stopAllTasks();
  database?.close();
  console.log('✅ Cleanup complete');
});

/**
 * Handle task status updates from automation
 */
export function sendTaskUpdate(taskId: string, status: string, data?: any): void {
  mainWindow?.webContents.send('task:update', { taskId, status, data });
}
