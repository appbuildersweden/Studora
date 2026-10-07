import { ipcMain, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
let configData: { supabaseUrl?: string; supabaseKey?: string } | null = null;
let autoUpdater: any = null;

function getAutoUpdater(): any {
  if (!autoUpdater) {
    try {
      autoUpdater = require('electron-updater').autoUpdater;
    } catch (err) {
      console.warn('[Updater] electron-updater inte tillgänglig:', (err as Error).message);
      return null;
    }
  }
  return autoUpdater;
}

function getConfigPath(): string {
  const userDataPath = app.getPath('userData');
  const userConfigPath = path.join(userDataPath, 'config.json');

  if (fs.existsSync(userConfigPath)) {
    return userConfigPath;
  }

  const devConfigPath = path.join(__dirname, '..', '..', 'config.json');

  if (fs.existsSync(devConfigPath)) {
    return devConfigPath;
  }

  return userConfigPath;
}

export function initIpcHandlers() {
  ipcMain.handle('get-config', async () => {
    if (configData) {
      return configData;
    }

    const configPath = getConfigPath();

    try {
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf8');
        configData = JSON.parse(raw);

        if (process.env.SUPABASE_URL) {
          configData!.supabaseUrl = process.env.SUPABASE_URL;
        }
        if (process.env.SUPABASE_PUBLISHABLE_KEY) {
          configData!.supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
        }

        return configData!;
      }
    } catch (err) {
      console.error('Failed to read config:', err);
    }

    return { supabaseUrl: undefined, supabaseKey: undefined };
  });

  ipcMain.handle('get-version', async () => {
    return app.getVersion();
  });

  ipcMain.handle('open-external', async (_event, url: string) => {
    const shell = (await import('electron')).shell;
    await shell.openExternal(url);
  });

  ipcMain.handle('log', async (_event, message: string) => {
    console.log('[Studora]', message);
    return true;
  });

  ipcMain.handle('check-for-updates', async () => {
    if (!app.isPackaged) {
      return { error: 'Dev-läge – auto-update är inaktiverat' };
    }
    const updater = getAutoUpdater();
    if (!updater) {
      return { error: 'Auto-update är inte tillgängligt' };
    }
    try {
      const result = await updater.checkForUpdates();
      return { updateAvailable: true, version: (result as any)?.version };
    } catch (err) {
      if ((err as any).message?.includes('No server configured') || (err as any).message?.includes('Cannot check for updates')) {
        return { error: 'Kan inte kontrollera efter uppdatering' };
      }
      return { error: (err as Error).message };
    }
  });

  ipcMain.handle('download-update', async () => {
    if (!app.isPackaged) {
      return { error: 'Dev-läge – auto-update är inaktiverat' };
    }
    const updater = getAutoUpdater();
    if (!updater) {
      return { error: 'Auto-update är inte tillgängligt' };
    }
    try {
      updater.downloadUpdate();
      return { success: true };
    } catch (err) {
      return { error: (err as Error).message };
    }
  });

  ipcMain.handle('quit-and-install', async () => {
    const updater = getAutoUpdater();
    if (!updater) {
      return { error: 'Auto-update är inte tillgängligt' };
    }
    updater.quitAndInstall();
    return { success: true };
  });
}
