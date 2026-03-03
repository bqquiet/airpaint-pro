const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // MediaPipe needs camera access, which Electron handles via standard web APIs
    },
    title: "Air Canvas AI",
    backgroundColor: '#000000',
  });

  // In development, load from the Vite dev server
  // In production, load the built index.html
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  win.loadURL(startUrl);

  if (isDev) {
    win.webContents.openDevTools();
  }

  // Handle camera permissions
  win.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    if (permission === 'media') return true;
    return false;
  });

  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') callback(true);
    else callback(false);
  });
}

app.whenReady().then(() => {
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
