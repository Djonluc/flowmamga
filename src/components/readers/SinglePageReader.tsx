import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReadingStore } from '../../stores/useReadingStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SmartImage } from '../SmartImage';
import { usePreloader } from '../../hooks/usePreloader';

export const SinglePageReader = () => {
  const { images, currentIndex, nextPage, prevPage } = useReadingStore();
  const { readingDirection } = useSettingsStore();

  usePreloader(3); // Preload next 3 images

  const [directionMultiplier, setDirectionMultiplier] = useState(1);

  useEffect(() => {
    setDirectionMultiplier(readingDirection === 'rtl' ? -1 : 1);
  }, [readingDirection]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        readingDirection === 'ltr' ? nextPage() : prevPage();
      } else if (e.key === 'ArrowLeft') {
        readingDirection === 'ltr' ? prevPage() : nextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readingDirection, nextPage, prevPage]);

  const currentImage = images[currentIndex];

  if (!currentImage) return null;

  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-black">
      {/* Navigation Zones */}
      <div className="absolute inset-y-0 left-0 w-1/4 z-10 cursor-pointer opacity-0 hover:opacity-100 transition-opacity flex items-center justify-start pl-4 bg-gradient-to-r from-black/50 to-transparent"
           onClick={() => readingDirection === 'ltr' ? prevPage() : nextPage()}>
        <ChevronLeft className="text-white" size={48} />
      </div>
      <div className="absolute inset-y-0 right-0 w-1/4 z-10 cursor-pointer opacity-0 hover:opacity-100 transition-opacity flex items-center justify-end pr-4 bg-gradient-to-l from-black/50 to-transparent"
           onClick={() => readingDirection === 'ltr' ? nextPage() : prevPage()}>
        <ChevronRight className="text-white" size={48} />
      </div>

      {/* Image Display */}
      <AnimatePresence mode="wait" custom={directionMultiplier}>
        <motion.div
           key={currentImage}
           className="w-full h-full flex items-center justify-center"
           initial={{ opacity: 0, x: 50 * directionMultiplier }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -50 * directionMultiplier }}
           transition={{ duration: 0.2, ease: "easeInOut" }}
           drag="x"
           dragConstraints={{ left: 0, right: 0 }}
           dragElastic={0.2}
           onDragEnd={(_, info) => {
             const swipe = info.offset.x;
             const threshold = 100;
             if (swipe < -threshold) {
               // Swipe Left
               readingDirection === 'ltr' ? nextPage() : prevPage();
             } else if (swipe > threshold) {
               // Swipe Right
               readingDirection === 'ltr' ? prevPage() : nextPage();
             }
           }}
        >
          <SmartImage
            src={currentImage.startsWith('http') ? currentImage : `media:///${currentImage}`}
            alt={`Page ${currentIndex + 1}`}
            className="shadow-2xl pointer-events-none transition-all duration-200"
            style={{
                width: useSettingsStore.getState().fitMode === 'width' ? '100%' : 'auto',
                height: useSettingsStore.getState().fitMode === 'height' ? '100%' : 'auto',
                maxWidth: useSettingsStore.getState().fitMode === 'original' ? 'none' : '100%',
                maxHeight: useSettingsStore.getState().fitMode === 'original' ? 'none' : '100%',
                objectFit: 'contain' 
            }}
          />
        </motion.div>
      </AnimatePresence>
      
      {/* Page Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-1.5 rounded-full text-white text-sm font-medium backdrop-blur-md border border-white/10">
        Page {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};
