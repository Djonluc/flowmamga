import { create } from 'zustand';

interface ReadingState {
  // Core State (Requested Model)
  currentChapterIndex: number;
  currentPageIndex: number;
  chapters: { id: string, path: string, title: string }[];
  currentChapterPages: string[];
  
  // Compatibility
  images: string[]; // Kept for un-migrated components, synced with currentChapterPages
  
  isLoading: boolean;
  seriesId: string | null; // For DB Sequence
  currentFolderPath: string | null; // Legacy support
  currentChapterId: string | null; // Legacy support

  // Actions
  openFolder: (path: string, seriesId?: string, chapterId?: string, sequence?: { id: string, path: string, title: string }[]) => Promise<void>;
  
  loadChapter: (index: number) => Promise<void>;
  goToNextChapter: () => Promise<void>;
  goToPrevChapter: () => Promise<void>;
  
  setPageIndex: (index: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  
  // Legacy Aliases
  setCurrentIndex: (index: number) => void;
  
  reset: () => void;
}

export const useReadingStore = create<ReadingState>((set, get) => ({
  currentChapterIndex: 0,
  currentPageIndex: 0,
  chapters: [],
  currentChapterPages: [],
  images: [], 
  isLoading: false,
  seriesId: null,
  currentFolderPath: null,
  currentChapterId: null,

  openFolder: async (path, seriesId, chapterId, sequence) => {
    set({ 
      isLoading: true, 
      seriesId: seriesId || null,
      chapters: sequence || [],
      currentChapterPages: [], 
      images: [],
      currentPageIndex: 0,
      currentFolderPath: path,
      currentChapterId: chapterId || null
    });

    // Determine Start Index
    let startIndex = 0;
    if (sequence && chapterId) {
        startIndex = sequence.findIndex(c => c.id === chapterId);
        if (startIndex === -1) startIndex = 0;
    }
    
    set({ currentChapterIndex: startIndex });
    await get().loadChapter(startIndex);
  },

  loadChapter: async (index: number) => {
      const state = get();
      const chapter = state.chapters[index];
      if (!chapter) {
          set({ isLoading: false });
          return;
      }

      const { invoke } = await import('@tauri-apps/api/core');
      try {
          // Pre-set index to avoid UI flickering old chapter
          set({ isLoading: true, currentChapterIndex: index, currentChapterId: chapter.id }); 
          
          const pages: string[] = await invoke('read_folder', { path: chapter.path });
          
          // Restore Progress
          let startPage = 0;
          if (state.seriesId) {
             try {
                const { getDb } = await import('../services/db');
                const db = getDb();
                const progress = await db.select<any[]>(
                     'SELECT currentPage FROM ReadingProgress WHERE seriesId = ? AND chapterId = ?',
                     [state.seriesId, chapter.id]
                );
                if (progress.length > 0 && progress[0].currentPage >= 0) {
                    startPage = Math.min(progress[0].currentPage, pages.length - 1);
                }
             } catch(e) { /* ignore */ }
          }

          set({ 
              currentChapterPages: pages,
              images: pages, // Sync
              currentPageIndex: startPage,
              isLoading: false 
          });

          // Preload next chapter (Asset Caching)
          if (index < state.chapters.length - 1) {
              // const nextChap = state.chapters[index + 1];
              // invoke('preload_folder', { path: nextChap.path }); 
          }

      } catch (err) {
          console.error('[ReadingStore] Failed to load chapter', err);
          set({ isLoading: false });
      }
  },

  goToNextChapter: async () => {
      const { currentChapterIndex, chapters } = get();
      if (currentChapterIndex + 1 < chapters.length) {
          await get().loadChapter(currentChapterIndex + 1);
      } else {
          console.log("No next chapter");
      }
  },

  goToPrevChapter: async () => {
      const { currentChapterIndex } = get();
      if (currentChapterIndex > 0) {
          await get().loadChapter(currentChapterIndex - 1);
      }
  },

  setPageIndex: (index) => {
      const state = get();
      set({ currentPageIndex: index });
      
      // Save Progress
      if (state.seriesId) {
          const chapter = state.chapters[state.currentChapterIndex];
          if (chapter) {
              import('./useLibraryStore').then(m => {
                  m.useLibraryStore.getState().updateReadingProgress(state.seriesId!, chapter.id, index);
              });
          }
      }

      // Preload Trigger
      if (index >= state.currentChapterPages.length - 5) {
           // Maybe preload next chapter data logic here
      }
  },

  nextPage: () => {
      const state = get();
      if (state.currentPageIndex < state.currentChapterPages.length - 1) {
          state.setPageIndex(state.currentPageIndex + 1);
      } else {
          state.goToNextChapter();
      }
  },

  prevPage: () => {
      const state = get();
      if (state.currentPageIndex > 0) {
          state.setPageIndex(state.currentPageIndex - 1);
      } else {
          state.goToPrevChapter();
      }
  },
  
  // Alias
  setCurrentIndex: (index) => get().setPageIndex(index),

  reset: () => set({ 
      chapters: [], 
      currentChapterPages: [], 
      images: [],
      isLoading: false,
      seriesId: null,
      currentChapterIndex: 0,
      currentPageIndex: 0,
      currentFolderPath: null,
      currentChapterId: null
  }),
}));
