import { create } from 'zustand';
import { getDb } from '../services/db';

export interface ComicInfo {
  series?: string;
  volume?: string;
  chapter?: string;
  group?: string;
  title?: string;
}

export interface Book {
  id: string;
  seriesId: string;
  path: string;
  title: string;
  cover: string | null;
  meta: ComicInfo;
  progress?: {
    currentPage: number;
    totalPages: number;
  };
}

export interface Series {
  id: string;
  title: string;
  path: string;
  displayName: string;
  author?: string;
  cover: string | null;
  description?: string;
  tags: string[];
  books: Book[];
  createdAt: string;
  updatedAt: string;
}

interface LibraryState {
  series: Series[];
  recentBooks: any[];
  isLoading: boolean;
  
  // Actions
  loadFromDb: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  addMangaFolder: (path: string) => Promise<void>;
  addToRecent: (book: any) => void;
  updateReadingProgress: (seriesId: string, chapterId: string, page: number) => Promise<void>;
  updateTags: (seriesId: string, tags: string[]) => Promise<void>;
  renameSeries: (seriesId: string, newTitle: string) => Promise<void>;
  deleteSeries: (seriesId: string) => Promise<void>;
  registerDownloadedSeries: (metadata: any, chapters: any[]) => Promise<void>;
  scanLibrary: (path?: string) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  series: [],
  recentBooks: [],
  isLoading: false,

  loadFromDb: async () => {
    const db = getDb();
    const series = await db.select<any[]>('SELECT * FROM Series WHERE type = "manga"');
    const enrichedSeries: Series[] = [];

    for (const s of series) {
      const chapters = await db.select<any[]>(`
        SELECT c.*, p.currentPage, p.totalPages as savedTotalPages 
        FROM Chapters c 
        LEFT JOIN ReadingProgress p ON c.id = p.chapterId 
        WHERE c.seriesId = ?
      `, [s.id]);
      
      enrichedSeries.push({
        id: s.id,
        title: s.title, 
        path: s.path,
        displayName: s.title, 
        author: s.author,
        cover: s.coverPath,
        description: s.description,
        tags: s.tags ? s.tags.split(',').filter((t: string) => t) : [],
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        books: chapters.map(c => ({
          id: c.id,
          seriesId: s.id,
          path: c.filePath,
          title: c.title,
          cover: s.coverPath,
          meta: { series: s.title, chapter: c.chapterNumber.toString() },
          progress: c.currentPage !== null ? {
            currentPage: c.currentPage,
            totalPages: c.totalPages || c.savedTotalPages || 0
          } : undefined
        }))
      });
    }

    // Sort recent items
    const recentBooks = enrichedSeries.flatMap(s => s.books).slice(0, 10);

    set({ series: enrichedSeries, recentBooks });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  addToRecent: (book: any) => {
      set(state => ({
          recentBooks: [book, ...state.recentBooks.filter(b => b.path !== book.path)].slice(0, 10)
      }));
  },

  addMangaFolder: async (path: string) => {
    // ... (keep existing)
    const { invoke } = await import('@tauri-apps/api/core');
    const db = getDb();
    
    try {
      const results: any[] = await invoke('scan_manga_folder', { path });

      for (const m of results) {
        // 1. Insert Series with rich v2.5 metadata
        await db.execute(
          'INSERT OR IGNORE INTO Series (id, title, path, author, type, coverPath, source, tags, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [m.id, m.title, m.file_path, m.author || '', 'manga', m.cover_path, 'local', (m.tags || []).join(','), m.description || '']
        );
        
        // 2. Scan and Insert Chapters
        const chapters: any[] = await invoke('scan_chapters', { path: m.file_path, seriesId: m.id });
        for (const c of chapters) {
            await db.execute(
              'INSERT OR IGNORE INTO Chapters (id, seriesId, title, chapterNumber, filePath) VALUES (?, ?, ?, ?, ?)',
              [c.id, m.id, c.title, c.chapter_number, c.file_path]
            );
        }
      }

      await get().loadFromDb();
    } catch (err) {
      console.error('[LibraryStore] Failed to add manga folder:', err);
      throw err;
    }
  },

  updateReadingProgress: async (seriesId, chapterId, page) => {
    const db = getDb();
    await db.execute(
      'INSERT OR REPLACE INTO ReadingProgress (id, seriesId, chapterId, currentPage) VALUES (?, ?, ?, ?)',
      [`${seriesId}-${chapterId}`, seriesId, chapterId, page]
    );
  },

  updateTags: async (seriesId, tags) => {
      const db = getDb();
      const tagsStr = tags.join(',');
      await db.execute('UPDATE Series SET tags = ? WHERE id = ?', [tagsStr, seriesId]);
      await get().loadFromDb(); 
  },

  renameSeries: async (seriesId, newTitle) => {
      const db = getDb();
      await db.execute('UPDATE Series SET title = ? WHERE id = ?', [newTitle, seriesId]);
      await get().loadFromDb();
  },

  deleteSeries: async (seriesId) => {
      const db = getDb();
      // CASCADE should handle Chapters and ReadingProgress if setup correctly, 
      // but we'll be explicit or rely on the established CASCADE.
      await db.execute('DELETE FROM Series WHERE id = ?', [seriesId]);
      await get().loadFromDb();
  },

  registerDownloadedSeries: async (metadata: any, chapters: any[]) => {
      const db = getDb();
      try {
          // 1. Insert/Update Series
          await db.execute(
            'INSERT OR REPLACE INTO Series (id, title, path, author, type, coverPath, source, tags, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                metadata.mangaId, 
                metadata.title, 
                metadata.rootPath, 
                metadata.author || '', 
                'manga', 
                metadata.coverPath, 
                'mangadex', 
                (metadata.tags || []).join(','), 
                metadata.description || ''
            ]
          );

          // 2. Insert Chapters
          for (const c of chapters) {
              await db.execute(
                'INSERT OR IGNORE INTO Chapters (id, seriesId, title, chapterNumber, filePath) VALUES (?, ?, ?, ?, ?)',
                [c.id, metadata.mangaId, c.title, c.chapterNumber, c.filePath]
              );
          }
          
          // 3. Refresh UI
          await get().loadFromDb();
      } catch (err) {
          console.error('[LibraryStore] Failed to register downloaded series:', err);
      }
  },

  scanLibrary: async (path?: string) => {
        if (path) {
            await get().addMangaFolder(path);
        } else {
            const { useSettingsStore } = await import('./useSettingsStore');
            const { libraryPath } = useSettingsStore.getState();
            if (libraryPath) {
                await get().addMangaFolder(libraryPath);
            }
        }
  }
}));
