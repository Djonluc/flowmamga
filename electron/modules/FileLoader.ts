import fs from 'fs/promises';
import path from 'path';
import { dialog } from 'electron';
import { watch, FSWatcher } from 'chokidar';
import { EventEmitter } from 'events';

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

export class FileLoader extends EventEmitter {
  private static imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp'];
  private watcher: FSWatcher | null = null;

  /**
   * Opens a dialog to select a folder.
   */
  async openFolder(): Promise<string | null> {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (canceled) { return null; }
    return filePaths[0];
  }

  /**
   * Scans a directory for image files.
   */
  async scanFolder(folderPath: string, recursive: boolean = false): Promise<string[]> {
    try {
      // Setup watcher if new folder (only at top level)
      if (this.watcher) {
         const watched = this.watcher.getWatched();
         if (!Object.keys(watched).includes(folderPath)) {
            this.watchFolder(folderPath);
         }
      } else {
         this.watchFolder(folderPath);
      }

      let fileList: string[] = [];
      const items = await fs.readdir(folderPath, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(folderPath, item.name);
        
        if (item.isDirectory() && recursive) {
          const subFiles = await this.scanFolder(fullPath, true);
          fileList = fileList.concat(subFiles);
        } else if (item.isFile()) {
           const ext = path.extname(item.name).toLowerCase();
           if (FileLoader.imageExtensions.includes(ext)) {
             fileList.push(fullPath);
           }
        }
      }

      // Natural Sort by Full Path to preserve directory structure/order
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      return fileList.sort((a, b) => collator.compare(a, b));
    } catch (error) {
      console.error(`Error scanning folder ${folderPath}:`, error);
      return [];
    }
  }

  /**
   * Parses filename for metadata.
   * Handles formats: [Group] Series Name - Vol.01 Ch.05
   */
  parseMetadata(filename: string): ComicInfo {
    const name = path.parse(filename).name;
    
    // Regex breakdown:
    // 1. (?:\[(.*?)\])? -> Optional [Group]
    // 2. \s*(.*?)\s* -> Series Title (non-greedy)
    // 3. (?:[-–]\s*)? -> Optional separator
    // 4. (?:(?:v|vol|volume)\s?(\d+(\.\d+)?))? -> Optional Volume
    // 5. \s*(?:(?:c|ch|chapter|#)\s?(\d+(\.\d+)?))? -> Optional Chapter
    const regex = /^(?:\[(.*?)\])?\s*(.*?)\s*(?:[-–]\s*)?(?:(?:v|vol|volume)\s?(\d+(\.\d+)?))?\s*(?:(?:c|ch|chapter|#)\s?(\d+(\.\d+)?))?$/i;
    
    const match = name.match(regex);

    if (match) {
        return {
            group: match[1]?.trim(),
            series: match[2]?.trim(),
            volume: match[3]?.trim(),
            chapter: match[5]?.trim(),
            title: name
        };
    }
    
    return { title: name, series: name };
  }

  /**
   * Watches a folder for changes.
   */
  watchFolder(folderPath: string) {
     if (this.watcher) {
       this.watcher.close();
     }
     
      // Ignore dotfiles
      this.watcher = watch(folderPath, { ignored: /(^|[\/\\])\../, persistent: true, depth: 0, ignoreInitial: true });
      
      this.watcher.on('add', (filePath: string) => this.emit('file:added', filePath));
      this.watcher.on('unlink', (filePath: string) => this.emit('file:removed', filePath));
  }

  private async getSmartCover(folderPath: string): Promise<string | null> {
    try {
        const files = await fs.readdir(folderPath, { withFileTypes: true });
        const images = files.filter(f => f.isFile() && FileLoader.imageExtensions.includes(path.extname(f.name).toLowerCase()));
        
        if (images.length === 0) {
            // Check subfolders
            const subfolders = files.filter(f => f.isDirectory());
            for (const sub of subfolders) {
                const subPath = path.join(folderPath, sub.name);
                const cover = await this.getSmartCover(subPath);
                if (cover) return cover;
            }
            return null;
        }

        // 1. Look for explicit cover names
        const coverAliases = ['cover', 'folder', 'poster', '000', '00'];
        const explicitCover = images.find(img => {
            const name = path.parse(img.name).name.toLowerCase();
            return coverAliases.some(alias => name === alias || name.startsWith(alias));
        });

        if (explicitCover) return path.join(folderPath, explicitCover.name);

        // 2. Default to first image
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
        const sortedImages = images.sort((a, b) => collator.compare(a.name, b.name));
        return path.join(folderPath, sortedImages[0].name);

    } catch (err) {
        return null;
    }
  }

  async scanLibrary(rootPath: string): Promise<Series[]> {
    console.log(`[FileLoader] Scanning library at: ${rootPath}`);
    try {
      const entries = await fs.readdir(rootPath, { withFileTypes: true });
      const folders = entries.filter(dirent => dirent.isDirectory());

      const rawBooks: Book[] = [];

      // 1. Process root if it's a book
      const rootImages = entries.filter(e => e.isFile() && FileLoader.imageExtensions.includes(path.extname(e.name).toLowerCase()));
      if (rootImages.length > 0) {
        const title = path.basename(rootPath) || rootPath;
        rawBooks.push({
          path: rootPath,
          title,
          cover: await this.getSmartCover(rootPath),
          meta: this.parseMetadata(title)
        });
      }

      // 2. Process subfolders as potential books
      await Promise.all(folders.map(async (dir) => {
        const fullPath = path.join(rootPath, dir.name);
        const cover = await this.getSmartCover(fullPath);
        
        if (cover) {
            rawBooks.push({
                path: fullPath,
                title: dir.name,
                cover,
                meta: this.parseMetadata(dir.name)
            });
        }
      }));

      // 3. Consolidate into Series
      const seriesMap = new Map<string, Series>();

      for (const book of rawBooks) {
          const seriesName = book.meta.series || book.title;
          const seriesId = seriesName.toLowerCase().replace(/[^a-z0-9]/g, '_');

          if (!seriesMap.has(seriesId)) {
              seriesMap.set(seriesId, {
                  id: seriesId,
                  title: seriesName,
                  cover: book.cover, // Will use first book for now
                  books: []
              });
          }

          const series = seriesMap.get(seriesId)!;
          series.books.push(book);
          
          // Ensure cover is set to the best available one (e.g. from lowest volume)
          // Simple heuristic: if we don't have a cover or this book looks like Vol 1, take its cover
          if (!series.cover || (book.meta.volume === '1' || book.meta.volume === '01')) {
              series.cover = book.cover;
          }
      }

      // 4. Sort Series and Books within series
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      const sortedSeries = Array.from(seriesMap.values()).sort((a, b) => collator.compare(a.title, b.title));

      for (const s of sortedSeries) {
          s.books.sort((a, b) => collator.compare(a.title, b.title));
      }

      console.log(`[FileLoader] Scan complete. Found ${sortedSeries.length} series across ${rawBooks.length} folders.`);
      return sortedSeries;
    } catch (error) {
      console.error('[FileLoader] Error scanning library:', error);
      return [];
    }
  }
}
