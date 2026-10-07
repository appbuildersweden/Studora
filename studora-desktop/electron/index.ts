import { app } from 'electron';
import { initIpcHandlers } from './ipc-handlers';

// Initialize IPC handlers before creating window
initIpcHandlers();

app.whenReady().then(() => {
  const { createWindow } = require('./main');
  createWindow();
});
