import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { autoUpdater } from 'electron-updater';

let mainWindow: BrowserWindow | null = null;
let updateInterval: NodeJS.Timeout | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

export function setupAutoUpdater() {
  autoUpdater.autoDownload = false;

  autoUpdater.on('checking-for-update', () => {
    console.log('[Updater] Kontrollerar efter uppdatering...');
  });

  autoUpdater.on('update-available', (info: any) => {
    console.log('[Updater] Ny version tillgänglig:', info?.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[Updater] Ingen ny version.');
  });

  autoUpdater.on('download-progress', (progress: any) => {
    console.log(`[Updater] Framsteg: ${progress?.percent?.toFixed(1)}%`);
    if (mainWindow) {
      mainWindow.webContents.send('update-progress', progress);
    }
  });

  autoUpdater.on('update-downloaded', (info: any) => {
    console.log('[Updater] Uppdatering nedladdad:', info?.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
    }
  });

  autoUpdater.on('error', (err: any) => {
    console.error('[Updater] Fel:', err?.message);
  });
}

function checkForUpdates() {
  if (!app.isPackaged) {
    console.log('[Updater] Körs i dev-läge – hoppar över auto-update-kontroll');
    return;
  }
  autoUpdater.checkForUpdates().catch(err => {
    console.error('[Updater] Fel vid uppdateringskontroll:', err.message);
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

  mainWindow.on('ready-to-show', () => {
    mainWindow?.setIcon(iconPath);
    mainWindow?.show();
  });

  mainWindow.once('ready-to-show', () => {
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
