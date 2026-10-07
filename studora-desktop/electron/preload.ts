import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: (): Promise<{ supabaseUrl?: string; supabaseKey?: string }> =>
    ipcRenderer.invoke('get-config'),
  getVersion: (): Promise<string> =>
    ipcRenderer.invoke('get-version'),
  onAppQuitting: (callback: () => void) => {
    ipcRenderer.on('app-quitting', callback);
    return () => ipcRenderer.removeListener('app-quitting', callback);
  },
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  log: (message: string) => ipcRenderer.invoke('log', message),
});

export {};
