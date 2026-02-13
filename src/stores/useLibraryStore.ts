import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface LibraryState {
  libraryPaths: string[];
  series: Series[];
  isLoading: boolean;
  
  setLibraryPaths: (paths: string[]) => void;
  addLibraryPath: (path: string) => void;
  webLinks: string[];
  addWebLink: (url: string) => void;
  setSeries: (series: Series[]) => void;
  setLoading: (loading: boolean) => void;

  recentBooks: Book[];
  addToRecent: (book: Book) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      libraryPaths: [],
      series: [],
      isLoading: false,

      setLibraryPaths: (paths) => set({ libraryPaths: paths }),
      addLibraryPath: (path) => set((state) => ({ 
          libraryPaths: state.libraryPaths.includes(path) ? state.libraryPaths : [...state.libraryPaths, path] 
      })),
      webLinks: [],
      addWebLink: (url) => set((state) => ({
          webLinks: state.webLinks.includes(url) ? state.webLinks : [...state.webLinks, url]
      })),
      setSeries: (series) => set({ series }),
      setLoading: (loading) => set({ isLoading: loading }),
      
      recentBooks: [],
      addToRecent: (book) => set((state) => {
          const filtered = state.recentBooks.filter(b => b.path !== book.path);
          return { recentBooks: [book, ...filtered].slice(0, 5) };
      }),
    }),
    {
      name: 'flowmanga-library',
    }
  )
);
