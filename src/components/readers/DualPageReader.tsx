import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReadingStore } from '../../stores/useReadingStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { SmartImage } from '../SmartImage';
import { usePreloader } from '../../hooks/usePreloader';
import { convertFileSrc } from '@tauri-apps/api/core';

export const DualPageReader = () => {
  const { images, currentPageIndex: currentIndex, setPageIndex: setPage } = useReadingStore();
  const { readingDirection } = useSettingsStore();

  usePreloader(4); // Preload a few more for dual mode

  // Calculate pairs
  // Logic: 
  // Page 0 (Cover) -> Single
  // Page 1-2 -> Pair
  // Page 3-4 -> Pair
  // If currentIndex is 0, show [0]
  // If currentIndex is odd (1), show [1, 2]
  // If currentIndex is even (2), show [1, 2] (normalization needed)
  
  // Normalized Index (Left/Start of pair)
  const getPairStartIndex = (index: number) => {
    if (index === 0) return 0;
    return index % 2 === 0 ? index - 1 : index;
  };

  const startIndex = getPairStartIndex(currentIndex);
  const isCover = startIndex === 0;
  
  const firstImage = images[startIndex];
  const secondImage = isCover ? null : images[startIndex + 1];

  // Navigation Wrappers
  const nextPair = () => {
    const nextIndex = isCover ? 1 : startIndex + 2;
    if (nextIndex < images.length) setPage(nextIndex);
  };

  const prevPair = () => {
    const prevIndex = startIndex - (startIndex === 1 ? 1 : 2);
    if (prevIndex >= 0) setPage(prevIndex);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        readingDirection === 'ltr' ? nextPair() : prevPair();
      } else if (e.key === 'ArrowLeft') {
        readingDirection === 'ltr' ? prevPair() : nextPair();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readingDirection, startIndex, images.length]);

  if (!firstImage) return null;

  // Layout Logic depending on Direction
  // LTR: [Page N] [Page N+1]
  // RTL: [Page N+1] [Page N]
  const renderImages = () => {
    if (isCover) {
        return (
            <div className="flex items-center justify-center w-full h-full p-4">
                 <SmartImage
                    src={firstImage.startsWith('http') ? firstImage : convertFileSrc(firstImage)}
                    alt={`Cover`}
                    className="shadow-2xl object-contain max-h-full max-w-full"
                  />
            </div>
        );
    }

    const img1 = (
        <div key={startIndex} className="flex-1 flex items-center justify-center h-full p-1">
             <SmartImage
                src={firstImage.startsWith('http') ? firstImage : convertFileSrc(firstImage)}
                alt={`Page ${startIndex + 1}`}
                className="shadow-xl object-contain max-h-full max-w-full"
              />
        </div>
    );

    const img2 = secondImage ? (
        <div key={startIndex + 1} className="flex-1 flex items-center justify-center h-full p-1">
             <SmartImage
                src={secondImage.startsWith('http') ? secondImage : convertFileSrc(secondImage)}
                alt={`Page ${startIndex + 2}`}
                className="shadow-xl object-contain max-h-full max-w-full"
              />
        </div>
    ) : (
        <div className="flex-1" /> // Spacer for single last page
    );

    return readingDirection === 'ltr' 
        ? <>{img1}{img2}</>
        : <>{img2}{img1}</>;
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.div
           key={startIndex}
           className="w-full h-full flex items-center justify-center px-4" // Padding for aesthetics
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.2 }}
        >
            {renderImages()}
        </motion.div>
      </AnimatePresence>
      
    </div>
  );
};

