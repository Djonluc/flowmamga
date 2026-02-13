
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    openFolder: () => {
        console.log('PRELOAD: invoking openFolder');
        return ipcRenderer.invoke('dialog:openFolder');
    },
    readFolder: (path: string) => {
        console.log('PRELOAD: invoking readFolder', path);
        return ipcRenderer.invoke('media:readFolder', path);
    },
    minimize: () => {
        console.log('PRELOAD: invoking minimize');
        return ipcRenderer.invoke('window:minimize');
    },
    maximize: () => {
        console.log('PRELOAD: invoking maximize');
        return ipcRenderer.invoke('window:maximize');
    },
    close: () => {
        console.log('PRELOAD: invoking close');
        return ipcRenderer.invoke('window:close');
    },
    scanLibrary: (path: string) => {
        console.log('PRELOAD: invoking scanLibrary', path);
        return ipcRenderer.invoke('library:scan', path);
    },
    onLibraryUpdate: (callback: (event: any, ...args: any[]) => void) => {
        console.log('PRELOAD: setting up onLibraryUpdate');
        const subscription = (_: any, ...args: any[]) => callback(_, ...args);
        ipcRenderer.on('library:file-added', subscription);
        ipcRenderer.on('library:file-removed', subscription);
        return () => {
            ipcRenderer.off('library:file-added', subscription);
            ipcRenderer.off('library:file-removed', subscription);
        };
    },
    toggleFullScreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
    importFolder: (path: string) => ipcRenderer.invoke('library:import-folder', path),
    getManagedLibraryPath: () => ipcRenderer.invoke('library:get-managed-path')
});
