import { create } from 'zustand';
import { useSettingsStore } from './useSettingsStore';

export type ReaderMode = 'vertical' | 'single' | 'slideshow';

interface ReaderState {
  // Mode & Navigation
  mode: ReaderMode;
  currentPage: number;
  totalPages: number;
  
  // Auto-Scroll (Vertical)
  autoScroll: boolean;
  scrollSpeed: number; // pixels per second
  
  // Slideshow
  slideshowActive: boolean;
  slideshowDelay: number; // ms
  
  // Actions
  setMode: (mode: ReaderMode) => void;
  setCurrentPage: (page: number) => void;
  setAutoScroll: (active: boolean) => void;
  setScrollSpeed: (speed: number) => void;
  setSlideshowActive: (active: boolean) => void;
  setSlideshowDelay: (delay: number) => void;
  
  // Syncing with data store
  setTotalPages: (total: number) => void;
}

export const useReaderStore = create<ReaderState>((set) => ({
  mode: 'vertical',
  currentPage: 0,
  totalPages: 0,
  
  autoScroll: false,
  scrollSpeed: 40,
  
  slideshowActive: false,
  slideshowDelay: 3000,
  
  setMode: (mode) => {
      // Sync with settings store if needed, but primary is here now
      useSettingsStore.getState().setReadingMode(mode as any);
      set({ 
          mode, 
          autoScroll: false, 
          slideshowActive: false 
      });
  },
  
  setCurrentPage: (currentPage) => set({ currentPage }),
  
  setAutoScroll: (autoScroll) => set({ autoScroll }),
  
  setScrollSpeed: (scrollSpeed) => set({ scrollSpeed }),
  
  setSlideshowActive: (slideshowActive) => set({ slideshowActive }),
  
  setSlideshowDelay: (slideshowDelay) => set({ slideshowDelay }),
  
  setTotalPages: (totalPages) => set({ totalPages }),
}));
