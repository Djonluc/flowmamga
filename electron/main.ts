import { app, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { pathToFileURL } from 'url';
import { FileLoader } from './modules/FileLoader';

// const __dirname = path.dirname(fileURLToPath(import.meta.url)); // No longer needed in CJS environment

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// if (require('electron-squirrel-startup')) {
//   app.quit();
// }

// Register custom protocol for local file access
protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { secure: true, supportFetchAPI: true, standard: true, bypassCSP: true, stream: true } }
]);

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // DISABLED FOR DEBUGGING LOCAL ACCESS
      allowRunningInsecureContent: true
    },
    frame: false, // Custom frame
    backgroundColor: '#1a1a1a',
    show: false // Show when ready to avoid white flash
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the index.html of the app.
  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
};

app.whenReady().then(() => {
  const fileLoader = new FileLoader();

  fileLoader.on('file:added', (path) => {
    BrowserWindow.getAllWindows().forEach(win => win.webContents.send('library:file-added', path));
  });

  fileLoader.on('file:removed', (path) => {
    BrowserWindow.getAllWindows().forEach(win => win.webContents.send('library:file-removed', path));
  });

  // Handle media:// protocol
  protocol.handle('media', async (request) => {
    try {
      const url = new URL(request.url);
      console.log(`[Media] Request URL: ${request.url}`);
      
      let filePath = '';
      if (process.platform === 'win32') {
        // Handle cases:
        // media://c/Users -> url.hostname='c', url.pathname='/Users'
        // media:///C:/Users -> url.hostname='', url.pathname='/C:/Users'
        if (url.hostname && url.hostname.length === 1) {
          filePath = url.hostname + ':' + url.pathname;
        } else {
          filePath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        }
      } else {
        filePath = url.pathname;
      }

      const absolutePath = path.resolve(decodeURIComponent(filePath));
      console.log(`[Media] Resolved Path: ${absolutePath}`);
      
      // Use pathToFileURL to create a valid file:// URL for net.fetch
      const fileUrl = pathToFileURL(absolutePath).toString();
      
      const response = await net.fetch(fileUrl);
      
      // Clone response to add CORS headers if needed
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (err) {
      console.error('[Media] Protocol error:', err);
      return new Response('File not found', { status: 404 });
    }
  });

  createWindow();

  // IPC Handlers
  ipcMain.handle('dialog:openFolder', async () => {
    console.log('MAIN process: dialog:openFolder received');
    try {
        const result = await fileLoader.openFolder();
        console.log('MAIN process: openFolder result', result);
        return result;
    } catch (err) {
        console.error('MAIN process: openFolder error', err);
        throw err;
    }
  });

  ipcMain.handle('media:readFolder', async (_, folderPath) => {
    console.log(`[IPC] Reading folder: ${folderPath}`);
    return await fileLoader.scanFolder(folderPath, true); 
  });

  ipcMain.handle('library:scan', async (_, rootPath) => {
    console.log(`[IPC] Scanning library: ${rootPath}`);
    return await fileLoader.scanLibrary(rootPath);
  });

  ipcMain.handle('window:minimize', () => {
    const win = BrowserWindow.getFocusedWindow();
    win?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    const win = BrowserWindow.getFocusedWindow();
    win?.close();
  });

  ipcMain.handle('window:toggle-fullscreen', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      const isFullScreen = !win.isFullScreen();
      win.setFullScreen(isFullScreen);
      // Custom frames can cause issues with auto-hiding menu bars, 
      // but since we have frame: false, it's simpler.
      return isFullScreen;
    }
    return false;
  });

  ipcMain.handle('library:import-folder', async (_, sourcePath: string) => {
    const libraryDir = path.join(app.getPath('userData'), 'flowmanga_library');
    await fs.mkdir(libraryDir, { recursive: true });
    
    // Simplistic target path
    const targetPath = path.join(libraryDir, path.basename(sourcePath));
    
    // We should ideally use a recursive copy.
    // fs.cp is available in Node 16.7+
    try {
        await fs.cp(sourcePath, targetPath, { recursive: true });
        return targetPath;
    } catch (err) {
        console.error('Import failed', err);
        throw err;
    }
  });

  ipcMain.handle('library:get-managed-path', () => {
    return path.join(app.getPath('userData'), 'flowmanga_library');
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
