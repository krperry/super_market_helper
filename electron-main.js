const { app, BrowserWindow } = require('electron');
const path = require('path');

// Import the Express server
const server = require('./server.js');

let mainWindow;
const PORT = 3000;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'public', 'icon.ico')
  });

  // Load the app from localhost
  mainWindow.loadURL(`http://localhost:${PORT}`);

  // Open DevTools in development (optional)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Wait for the server to be ready before creating window
function waitForServer() {
  return new Promise((resolve) => {
    const checkServer = setInterval(() => {
      const http = require('http');
      const req = http.get(`http://localhost:${PORT}`, (res) => {
        clearInterval(checkServer);
        resolve();
      });
      req.on('error', () => {
        // Server not ready yet, will try again
      });
      req.end();
    }, 100);
  });
}

app.whenReady().then(async () => {
  // Wait for server to be ready
  await waitForServer();
  
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  // Server will shut down when process exits
  console.log('Electron app quit');
});
