import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ReadingMode = 'vertical' | 'single' | 'dual' | 'slideshow' | 'horizontal';
export type Theme = 'dark' | 'light' | 'oled' | 'paper' | 'cyberpunk';

interface SettingsState {
  theme: Theme;
  readingMode: ReadingMode;
  readingDirection: 'ltr' | 'rtl';
  gapSize: number;
  slideshowInterval: number;
  fitMode: 'width' | 'height' | 'original' | 'smart';
  zoomScale: number; // Global zoom preference
  sidebarOpen: boolean;
  activeView: 'home' | 'library' | 'analytics' | 'videos' | 'history';
  setActiveView: (view: 'home' | 'library' | 'analytics' | 'videos' | 'history') => void;
  
  libraryViewMode: 'grid' | 'shelf';
  libraryDensity: 'compact' | 'comfortable' | 'cinematic';
  setLibraryViewMode: (mode: 'grid' | 'shelf') => void;
  setLibraryDensity: (density: 'compact' | 'comfortable' | 'cinematic') => void;
  toggleLibraryViewMode: () => void;

  isFullscreen: boolean;
  setFullscreenState: (full: boolean) => void;
  toggleFullScreenAction: () => void;
  
  setTheme: (theme: Theme) => void;
  setReadingMode: (mode: ReadingMode) => void;
  setReadingDirection: (dir: 'ltr' | 'rtl') => void;
  setGapSize: (size: number) => void;
  setSlideshowInterval: (ms: number) => void;
  setFitMode: (mode: 'width' | 'height' | 'original' | 'smart') => void;
  setZoomScale: (scale: number) => void;
  toggleSidebar: () => void;
  
  ambientVolume: number; // 0 to 1
  setAmbientVolume: (volume: number) => void;
  
  isHudVisible: boolean;
  toggleHud: () => void;
  setHudVisibility: (visible: boolean) => void;

  isShortcutsOpen: boolean;
  toggleShortcuts: () => void;

  isSettingsOpen: boolean;
  toggleSettings: () => void;

  // Image Processing
  brightness: number;
  contrast: number;
  saturation: number;
  autoCrop: boolean;

  autoScrollSpeed: number; // pixels per frame/second
  isAutoScrolling: boolean;
  accentColor: string;
  isInitializing: boolean;
  selectedAmbientSound: string;
  
  setBrightness: (val: number) => void;
  setContrast: (val: number) => void;
  setSaturation: (val: number) => void;
  toggleAutoCrop: () => void;
  setAutoScrollSpeed: (speed: number) => void;
  toggleAutoScrolling: () => void;
  setAccentColor: (color: string) => void;
  setInitializing: (init: boolean) => void;
  setSelectedAmbientSound: (sound: string) => void;
  
  libraryPath: string | null;
  setLibraryPath: (path: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      readingMode: 'vertical',
      readingDirection: 'ltr',
      gapSize: 20,
      slideshowInterval: 3000,
      fitMode: 'width',
      zoomScale: 1,
      activeView: 'home',
      setActiveView: (view) => set({ activeView: view }),

      libraryViewMode: 'grid',
      libraryDensity: 'comfortable',
      setLibraryViewMode: (mode) => set({ libraryViewMode: mode }),
      setLibraryDensity: (density) => set({ libraryDensity: density }),
      toggleLibraryViewMode: () => set((state) => ({ 
        libraryViewMode: state.libraryViewMode === 'grid' ? 'shelf' : 'grid' 
      })),

      isFullscreen: false,
      setFullscreenState: (f) => set({ isFullscreen: f }),
      toggleFullScreenAction: async () => {
        try {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          const appWindow = getCurrentWindow();
          const isFull = await appWindow.isFullscreen();
          await appWindow.setFullscreen(!isFull);
          set({ isFullscreen: !isFull });
        } catch (err) {
          console.error('[Settings] Failed to toggle fullscreen:', err);
        }
      },

      sidebarOpen: true,

      setTheme: (theme) => set({ theme }),
      setReadingMode: (mode) => set({ readingMode: mode }),
      setReadingDirection: (dir) => set({ readingDirection: dir }),
      setGapSize: (size) => set({ gapSize: size }),
      setSlideshowInterval: (ms) => set({ slideshowInterval: ms }),
      setFitMode: (mode) => set({ fitMode: mode }),
      setZoomScale: (scale) => set({ zoomScale: scale }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      ambientVolume: 0.2,
      setAmbientVolume: (volume) => set({ ambientVolume: volume }),
      
      isHudVisible: true,
      toggleHud: () => set((state) => ({ isHudVisible: !state.isHudVisible })),
      setHudVisibility: (visible) => set({ isHudVisible: visible }),

      isShortcutsOpen: false,
      toggleShortcuts: () => set((state) => ({ isShortcutsOpen: !state.isShortcutsOpen })),

      isSettingsOpen: false,
      toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

      // Image Processing
      brightness: 1,
      contrast: 1,
      saturation: 1,
      autoCrop: false,
      
      setBrightness: (b) => set({ brightness: b }),
      setContrast: (c) => set({ contrast: c }),
      setSaturation: (s) => set({ saturation: s }),
      toggleAutoCrop: () => set((state) => ({ autoCrop: !state.autoCrop })),

      autoScrollSpeed: 2, // Default speed
      isAutoScrolling: false,
      accentColor: '#3b82f6', // Default blue-500
      isInitializing: true,
      setAutoScrollSpeed: (speed) => set({ autoScrollSpeed: speed }),
      toggleAutoScrolling: () => set((state) => ({ isAutoScrolling: !state.isAutoScrolling })),
      setAccentColor: (color) => set({ accentColor: color }),
      setInitializing: (init) => set({ isInitializing: init }),
      selectedAmbientSound: 'none',
      setSelectedAmbientSound: (sound) => set({ selectedAmbientSound: sound }),

      // Library Persistence
      libraryPath: null,
      setLibraryPath: (path) => set({ libraryPath: path }),
    }),
    {
      name: 'flowmanga-settings',
      partialize: (state) => {
        const { isInitializing, ...rest } = state;
        return rest;
      },
    }
  )
);
