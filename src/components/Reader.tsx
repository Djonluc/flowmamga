import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReadingStore } from '../stores/useReadingStore';
import { useReaderStore } from '../stores/useReaderStore'; // New V2 Store
import { useAnalyticsStore } from '../stores/useAnalyticsStore';
import { usePreloader } from '../hooks/usePreloader';

import { VerticalReader } from './readers/VerticalReader';
import { SinglePageReader } from './readers/SinglePageReader';
import { SlideshowReader } from './readers/SlideshowReader';

import { ReaderTopBar } from './reader/ReaderTopBar';
import { ReaderBottomBar } from './reader/ReaderBottomBar';
import { QuickSettings } from './reader/QuickSettings';

export const Reader = () => {
  usePreloader(5); 
  const { startSession, addReadingTime } = useAnalyticsStore();
  const { images, currentPageIndex: currentIndex, reset, seriesId } = useReadingStore(); 
  const { mode, setCurrentPage, setTotalPages } = useReaderStore();
  
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
          useReadingStore.getState().setCurrentIndex(readerPage);
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
      <div className="fixed inset-0 z-50 w-screen h-screen bg-black overflow-hidden select-none flex flex-col items-center justify-center">
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
    if (!title || !visible) return null;

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
