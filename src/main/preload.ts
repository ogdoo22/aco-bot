import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload script - exposes safe IPC methods to renderer
 */
contextBridge.exposeInMainWorld('electron', {
  // Profiles
  createProfile: (profile: any) => ipcRenderer.invoke('profile:create', profile),
  getAllProfiles: () => ipcRenderer.invoke('profile:getAll'),
  getProfile: (id: string) => ipcRenderer.invoke('profile:get', id),
  updateProfile: (profile: any) => ipcRenderer.invoke('profile:update', profile),
  deleteProfile: (id: string) => ipcRenderer.invoke('profile:delete', id),

  // Proxies (BYOP - profile-specific)
  createProxy: (proxy: any) => ipcRenderer.invoke('proxy:create', proxy),
  getAllProxies: () => ipcRenderer.invoke('proxy:getAll'),
  getProxiesByProfile: (profileId: string) => ipcRenderer.invoke('proxy:getByProfile', profileId),
  getActiveProxies: (profileId?: string) => ipcRenderer.invoke('proxy:getActive', profileId),
  importProxies: (data: { profileId: string; proxyList: string[]; type: string }) =>
    ipcRenderer.invoke('proxy:import', data),
  testProxy: (id: string) => ipcRenderer.invoke('proxy:test', id),
  testAllProxies: () => ipcRenderer.invoke('proxy:testAll'),
  deleteProxy: (id: string) => ipcRenderer.invoke('proxy:delete', id),

  // Tasks
  createTask: (task: any) => ipcRenderer.invoke('task:create', task),
  getAllTasks: () => ipcRenderer.invoke('task:getAll'),
  startTask: (taskId: string) => ipcRenderer.invoke('task:start', taskId),
  startMultipleTasks: (taskIds: string[]) => ipcRenderer.invoke('task:startMultiple', taskIds),
  stopTask: (taskId: string) => ipcRenderer.invoke('task:stop', taskId),
  deleteTask: (taskId: string) => ipcRenderer.invoke('task:delete', taskId),

  // Analytics
  getAnalytics: (startDate?: number, endDate?: number) =>
    ipcRenderer.invoke('analytics:get', startDate, endDate),

  // Discord
  testDiscord: () => ipcRenderer.invoke('discord:test'),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:getAll'),
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),

  // Event listeners
  onTaskUpdate: (callback: (data: any) => void) => {
    ipcRenderer.on('task:update', (_, data) => callback(data));
  },
});
