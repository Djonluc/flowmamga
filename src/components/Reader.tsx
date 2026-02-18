import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReadingStore } from '../stores/useReadingStore';
import { useReaderStore } from '../stores/useReaderStore'; // New V2 Store
import { useAnalyticsStore } from '../stores/useAnalyticsStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { usePreloader } from '../hooks/usePreloader';

import { VerticalReader } from './readers/VerticalReader';
import { SinglePageReader } from './readers/SinglePageReader';
import { SlideshowReader } from './readers/SlideshowReader';

import { ReaderTopBar } from './reader/ReaderTopBar';
import { ReaderBottomBar } from './reader/ReaderBottomBar';
import { QuickSettings } from './reader/QuickSettings';
import { useReaderEngine } from '../hooks/useReaderEngine';

export const Reader = () => {
  useReaderEngine();
  usePreloader(5); 
  const { startSession, addReadingTime } = useAnalyticsStore();
  const { images, currentPageIndex: currentIndex, reset, seriesId } = useReadingStore(); 
  const { mode, setCurrentPage, setTotalPages } = useReaderStore();
  const { setAmbientImage } = useSettingsStore();
  
  // UI Visibility State
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync internal storage index with Reader V2 Store on load
  useEffect(() => {
    if (images.length > 0) {
        setTotalPages(images.length);
        setCurrentPage(currentIndex);
    }
  }, [images.length, currentIndex]);

  // Sync Global Ambient Image
  useEffect(() => {
      const currentImg = images[currentIndex];
      if (currentImg) {
          setAmbientImage(currentImg);
      }
      return () => {
          // Verify if we are unmounting or just changing page?
          // Actually, we want to clear ONLY on unmount of the Reader component.
          // But this effect runs on index change.
          // So we should have a separate effect for cleanup?
          // Or just let the next view set it.
          // But if we go back to Home (which sets its own), it's fine.
          // If we go to a view that DOESN'T set it (like Library grid), we might want to clear it.
          // Let's rely on a separate mount/unmount effect.
      };
  }, [currentIndex, images]);

  useEffect(() => {
      return () => {
          setAmbientImage(null); // Clear on reader exit
      };
  }, []);

  const handleMouseMove = (e: MouseEvent) => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

      if (e.clientY > 100 && e.clientY < window.innerHeight - 100) {
          controlsTimeoutRef.current = setTimeout(() => {
              setShowControls(false);
          }, 3000);
      }
  };

  useEffect(() => {
      window.addEventListener('mousemove', handleMouseMove);
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
      
      startSession();
      const timer = setInterval(() => {
          if (document.hasFocus()) addReadingTime(1, seriesId ?? undefined);
      }, 1000);

      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
          clearInterval(timer);
      };
  }, []);

  // Update Reading Progress in Data Store when Reader V2 page changes
  // This ensures progress persists even when using the new engine
  useEffect(() => {
      const readerPage = useReaderStore.getState().currentPage;
      if (readerPage !== currentIndex) {
          useReadingStore.getState().setPageIndex(readerPage);
      }
  }, [useReaderStore.getState().currentPage]);

  const renderReader = () => {
      // V2 Architecture: Unmount previous mode by using separate components
      switch (mode) {
        case 'vertical': return <VerticalReader />;
        case 'single': return <SinglePageReader />;
        case 'slideshow': return <SlideshowReader />;
        default: return <VerticalReader />;
      }
  };

  return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-transparent overflow-hidden select-none flex flex-col items-center justify-center">
          
          <ReaderTopBar visible={showControls} onBack={reset} />
          
          <QuickSettings />

          {/* Overlay Controls */}
          <div className="absolute inset-0 z-40 flex pointer-events-none">
              {/* Interaction areas should probably be handled by specific readers if they need scrolling 
                  but for Single/Slideshow we can have global tap zones */}
              {mode !== 'vertical' && (
                  <div className="absolute inset-0 flex pointer-events-auto">
                      <div className="w-[15%] h-full cursor-w-resize" onClick={() => useReadingStore.getState().prevPage()} />
                      <div className="flex-1 h-full" onClick={() => setShowControls(!showControls)} />
                      <div className="w-[15%] h-full cursor-e-resize" onClick={() => useReadingStore.getState().nextPage()} />
                  </div>
              )}
          </div>

          <div className="w-full h-full flex items-center justify-center relative z-0">
                {renderReader()}
          </div>
          
          <ChapterTransitionOverlay />
          <FeedbackHUD />

          <ReaderBottomBar visible={showControls} />
      </div>
  );
};

const ChapterTransitionOverlay = () => {
    // We access store via hook inside component to subscribe to changes
    // But we need to use ref to track previous value because 
    // currentChapterIndex changes instantly on transition.
    
    // We need to import useReadingStore inside or outside? outside.
    const { chapters, currentChapterIndex } = useReadingStore();
    const [visible, setVisible] = useState(false);
    const prevIndex = useRef(currentChapterIndex);

    useEffect(() => {
        if (currentChapterIndex !== prevIndex.current) {
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 2000); // 2s duration
            prevIndex.current = currentChapterIndex;
            return () => clearTimeout(timer);
        }
    }, [currentChapterIndex]);

    const title = chapters[currentChapterIndex]?.title;
    if (!title) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div 
                    initial={{ opacity: 0, y: -20, x: '-50%' }}
                    animate={{ opacity: 1, y: 32, x: '-50%' }}
                    exit={{ opacity: 0, y: -10, x: '-50%' }}
                    className="absolute top-0 left-1/2 z-[60] px-6 py-3 bg-black/80 backdrop-blur-md rounded-full border border-white/10 text-white font-black uppercase tracking-widest text-xs shadow-2xl pointer-events-none select-none whitespace-nowrap flex items-center gap-3"
                >
                    <span className="text-blue-500">NOW READING</span>
                    <span className="opacity-80">|</span>
                    {title}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const FeedbackHUD = () => {
    const { feedback } = useReaderStore();
    
    return (
        <AnimatePresence>
            {feedback && (
                <motion.div
                    key={feedback.type + feedback.value}
                    initial={{ opacity: 0, scale: 0.8, y: 50, x: '-50%' }}
                    animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, scale: 0.8, y: -20, x: '-50%' }}
                    className="fixed bottom-32 left-1/2 z-[100] px-8 py-4 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[32px] flex flex-col items-center gap-0 shadow-2xl pointer-events-none select-none min-w-[160px]"
                >
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">{feedback.type}</span>
                    <span className="text-3xl font-black text-white italic tracking-tighter">{feedback.value}</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

