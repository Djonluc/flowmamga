import { create } from 'zustand';

interface ReadingState {
  currentFolderPath: string | null;
  images: string[];
  currentIndex: number;
  isLoading: boolean;
  
  openFolder: (path: string, images: string[]) => void;
  setCurrentIndex: (index: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (index: number) => void;
  reset: () => void;
}

export const useReadingStore = create<ReadingState>((set) => ({
  currentFolderPath: null,
  images: [],
  currentIndex: 0,
  isLoading: false,

  openFolder: (path, images) => set({ currentFolderPath: path, images, currentIndex: 0 }),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  nextPage: () => set((state) => ({ 
    currentIndex: Math.min(state.currentIndex + 1, state.images.length - 1) 
  })),
  prevPage: () => set((state) => ({ 
    currentIndex: Math.max(state.currentIndex - 1, 0) 
  })),
  setPage: (index) => set({ currentIndex: index }),
  reset: () => set({ currentFolderPath: null, images: [], currentIndex: 0 }),
}));
