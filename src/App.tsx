import { Reader } from './components/Reader'
import { ControlPanel } from './components/ControlPanel'
import { LibraryGrid } from './components/LibraryGrid'
import { useReadingStore } from './stores/useReadingStore'
// import { useLibraryStore } from './stores/useLibraryStore'
import { useSettingsStore } from './stores/useSettingsStore'
import { Sidebar } from './components/Sidebar';
import { AmbientBackground } from './components/AmbientBackground';
import { AmbientSoundPlayer } from './components/AmbientSoundPlayer';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ShortcutsManager } from './components/ShortcutsManager';
import { ShortcutsGuide } from './components/ShortcutsGuide';
import { TitleBar } from './components/TitleBar'
import { ArrowLeft } from 'lucide-react'
import { useLibraryEvents } from './hooks/useLibraryEvents'
import { useAdaptiveColor } from './hooks/useAdaptiveColor'
import { useReadingAnalytics } from './hooks/useReadingAnalytics'
import clsx from 'clsx'
import './App.css'

import { HomeView } from './components/HomeView';
import { ToastContainer } from './components/Toast';

function App() {
  const { reset, images } = useReadingStore()
  // const { libraryPath, isLoading } = useLibraryStore(); // unused now
  const { theme, activeView, isFullscreen } = useSettingsStore();

  useLibraryEvents();
  useAdaptiveColor();
  useReadingAnalytics();

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300 relative" data-theme={theme}>
      <AmbientBackground />
      <AmbientSoundPlayer />
      <ShortcutsManager />
      <ShortcutsGuide />
      <ToastContainer />
      {!isFullscreen && <TitleBar />}
      <div className={clsx(
          "flex relative z-10 pointer-events-auto transition-all duration-500",
          isFullscreen ? "h-screen" : "h-[calc(100vh-32px)]"
      )}>
        {!isFullscreen && <Sidebar />}
        <main className="flex-1 relative overflow-hidden">
            {images.length > 0 ? (
                <>
                <div className="absolute top-4 left-4 z-50">
                    <button 
                    onClick={reset}
                    className="p-2 bg-black/50 backdrop-blur text-white rounded-full hover:bg-black/80 transition-colors"
                    title="Back to Library"
                    >
                    <ArrowLeft size={20} />
                    </button>
                </div>
                <Reader />
                </>
            ) : activeView === 'analytics' ? (
                <AnalyticsDashboard />
            ) : activeView === 'home' ? (
                <HomeView />
            ) : (
                <LibraryGrid />
            )}
            <ControlPanel />
        </main>
      </div>
    </div>
  )
}

export default App
