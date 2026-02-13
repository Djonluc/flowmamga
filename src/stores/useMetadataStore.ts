import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MangaMetadata } from '../utils/mangaFetcher';

interface MetadataState {
  metadata: Map<string, MangaMetadata>;
  loading: Set<string>;
  
  // Actions
  setMetadata: (title: string, data: MangaMetadata) => void;
  getMetadata: (title: string) => MangaMetadata | undefined;
  isLoading: (title: string) => boolean;
  setLoading: (title: string, loading: boolean) => void;
  clearMetadata: () => void;
}

export const useMetadataStore = create<MetadataState>()(
  persist(
    (set, get) => ({
      metadata: new Map(),
      loading: new Set(),
      
      setMetadata: (title, data) => {
        set((state) => {
          const newMetadata = new Map(state.metadata);
          newMetadata.set(title, data);
          const newLoading = new Set(state.loading);
          newLoading.delete(title);
          return { metadata: newMetadata, loading: newLoading };
        });
      },
      
      getMetadata: (title) => {
        return get().metadata.get(title);
      },
      
      isLoading: (title) => {
        return get().loading.has(title);
      },
      
      setLoading: (title, loading) => {
        set((state) => {
          const newLoading = new Set(state.loading);
          if (loading) {
            newLoading.add(title);
          } else {
            newLoading.delete(title);
          }
          return { loading: newLoading };
        });
      },
      
      clearMetadata: () => {
        set({ metadata: new Map(), loading: new Set() });
      },
    }),
    {
      name: 'flowmanga-metadata',
      // Custom storage to handle Map serialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: {
              ...state,
              metadata: new Map(Object.entries(state.metadata || {})),
              loading: new Set(state.loading || []),
            },
          };
        },
        setItem: (name, value) => {
          const { state } = value;
          localStorage.setItem(
            name,
            JSON.stringify({
              state: {
                ...state,
                metadata: Object.fromEntries(state.metadata),
                loading: Array.from(state.loading),
              },
            })
          );
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
