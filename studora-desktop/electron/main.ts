import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let updateInterval: NodeJS.Timeout | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let _autoUpdater: any = null;

function getAutoUpdater(): any {
  if (!_autoUpdater) {
    try {
      _autoUpdater = require('electron-updater').autoUpdater;
    } catch (err) {
      console.warn('[Updater] electron-updater inte tillgänglig:', (err as Error).message);
      return null;
    }
  }
  return _autoUpdater;
}

export function setupAutoUpdater() {
  const updater = getAutoUpdater();
  if (!updater) {
    console.warn('[Updater] Kan inte initiera auto-updater – hoppar över');
    return;
  }

  updater.autoDownload = false;

  updater.on('checking-for-update', () => {
    console.log('[Updater] Kontrollerar efter uppdatering...');
  });

  updater.on('update-available', (info: any) => {
    console.log('[Updater] Ny version tillgänglig:', info?.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
    }
  });

  updater.on('update-not-available', () => {
    console.log('[Updater] Ingen ny version.');
  });

  updater.on('download-progress', (progress: any) => {
    console.log(`[Updater] Framsteg: ${progress?.percent?.toFixed(1)}%`);
    if (mainWindow) {
      mainWindow.webContents.send('update-progress', progress);
    }
  });

  updater.on('update-downloaded', (info: any) => {
    console.log('[Updater] Uppdatering nedladdad:', info?.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
    }
  });

  updater.on('error', (err: any) => {
    console.error('[Updater] Fel:', err?.message);
  });
}

function checkForUpdates() {
  if (!app.isPackaged) {
    console.log('[Updater] Körs i dev-läge – hoppar över auto-update-kontroll');
    return;
  }
  const updater = getAutoUpdater();
  if (!updater) {
    console.warn('[Updater] Auto-updater inte tillgänglig – hoppar över');
    return;
  }
  updater.checkForUpdates().catch((err: any) => {
    console.error('[Updater] Fel vid uppdateringskontroll:', err?.message);
  });
}

function createWindow() {
  const iconPath = path.join(__dirname, '../web/STUDORA.ico');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
    backgroundColor: '#f3f5f8',
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.setIcon(iconPath);
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadFile(path.join(__dirname, '../src/index.html'));
  } else {
    mainWindow.loadFile(path.join(__dirname, '../src/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createMenu();
}

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Arkiv',
      submenu: [
        { role: 'quit' },
      ],
    },
    {
      label: 'Redigera',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'Visa',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Fönster',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  setupAutoUpdater();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  if (app.isPackaged) {
    updateInterval = setInterval(checkForUpdates, 60 * 60 * 1000);
    checkForUpdates();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (mainWindow) {
    mainWindow.webContents.send('app-quitting');
  }
});
