export interface ComicInfo {
  series?: string;
  volume?: string;
  chapter?: string;
  group?: string;
  title?: string;
}

export interface Book {
  path: string;
  title: string;
  cover: string | null;
  meta: ComicInfo;
}

export interface Series {
  id: string;
  title: string;
  cover: string | null;
  books: Book[];
}

export interface ElectronAPI {
  openFolder: () => Promise<string | null>;
  readFolder: (path: string) => Promise<string[]>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  scanLibrary: (path: string) => Promise<Series[]>;
  onLibraryUpdate: (callback: (event: any, ...args: any[]) => void) => () => void;
  toggleFullScreen: () => Promise<boolean>;
  importFolder: (path: string) => Promise<string>;
  getManagedLibraryPath: () => Promise<string>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
