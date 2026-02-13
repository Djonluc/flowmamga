import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReadingStore } from '../../stores/useReadingStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { Play, Pause } from 'lucide-react';

export const SlideshowReader = () => {
  const { images, currentIndex, nextPage } = useReadingStore();
  const { slideshowInterval } = useSettingsStore();
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      console.log('Slideshow starting', slideshowInterval);
      interval = setInterval(() => {
        nextPage();
      }, slideshowInterval);
    }
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [isPlaying, slideshowInterval, nextPage]);

  const currentImage = images[currentIndex];
  if (!currentImage) return null;

  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-black">
      {/* Play/Pause Indicator (Overlay) */}
      <div 
        className="absolute inset-0 z-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer bg-black/20 backdrop-blur-sm"
        onClick={() => setIsPlaying(!isPlaying)}
      >
        <div className="p-4 rounded-full bg-white/20 backdrop-blur-md">
          {isPlaying ? <Pause size={48} className="text-white" /> : <Play size={48} className="text-white" />}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 h-1 bg-blue-500 z-30 transition-all duration-300"
           style={{ width: `${((currentIndex + 1) / images.length) * 100}%` }} />

      {/* Image Display */}
      <AnimatePresence mode="wait">
        <motion.img
          key={currentImage}
          src={currentImage.startsWith('http') ? currentImage : `media:///${currentImage}`}
          alt={`Page ${currentIndex + 1}`}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="max-h-full max-w-full object-contain"
        />
      </AnimatePresence>
      
      {/* Info */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-1.5 rounded-full text-white text-sm font-medium backdrop-blur-md border border-white/10 flex gap-2 items-center">
        <span>Page {currentIndex + 1} / {images.length}</span>
        <span className="w-px h-3 bg-white/20" />
        <span className="text-xs text-neutral-400">{slideshowInterval / 1000}s</span>
      </div>
    </div>
  );
};
