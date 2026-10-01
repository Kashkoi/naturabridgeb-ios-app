const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#050E1F',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    icon: path.join(__dirname, 'www', 'icon.ico'),
    title: 'NaturaBridgeB',
  });

  win.loadFile(path.join(__dirname, 'www', 'index.html'));

  // External links (label sources, intake links) open in the system browser, never inside the app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault();
  });
}

// A minimal menu: without an Edit menu, copy / paste / select-all shortcuts do not work in text fields on Windows.
function buildMenu() {
  const template = [
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    { label: 'File', submenu: [{ role: process.platform === 'darwin' ? 'close' : 'quit' }] },
    { role: 'editMenu' },
    { label: 'View', submenu: [{ role: 'reload' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => { buildMenu(); createWindow(); });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
