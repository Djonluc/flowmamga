import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ReadingMode = 'vertical' | 'single' | 'slideshow' | 'horizontal';
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
  activeView: 'home' | 'library' | 'analytics';
  setActiveView: (view: 'home' | 'library' | 'analytics') => void;
  
  libraryViewMode: 'grid' | 'shelf';
  setLibraryViewMode: (mode: 'grid' | 'shelf') => void;
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
  accentColor: string; // Dynamic color based on current page
  
  setBrightness: (val: number) => void;
  setContrast: (val: number) => void;
  setSaturation: (val: number) => void;
  toggleAutoCrop: () => void;
  setAutoScrollSpeed: (speed: number) => void;
  toggleAutoScrolling: () => void;
  setAccentColor: (color: string) => void;
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
      setLibraryViewMode: (mode) => set({ libraryViewMode: mode }),
      toggleLibraryViewMode: () => set((state) => ({ 
        libraryViewMode: state.libraryViewMode === 'grid' ? 'shelf' : 'grid' 
      })),

      isFullscreen: false,
      setFullscreenState: (f) => set({ isFullscreen: f }),
      toggleFullScreenAction: () => {
        if (window.electron) {
            window.electron.toggleFullScreen().then((full: boolean) => {
                set({ isFullscreen: full });
            });
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
      setAutoScrollSpeed: (speed) => set({ autoScrollSpeed: speed }),
      toggleAutoScrolling: () => set((state) => ({ isAutoScrolling: !state.isAutoScrolling })),
      setAccentColor: (color) => set({ accentColor: color }),
    }),
    {
      name: 'flowmanga-settings',
    }
  )
);
