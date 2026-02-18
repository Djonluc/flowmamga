import { useEffect, useRef } from 'react';
import { useReadingStore } from '../../stores/useReadingStore';
import { useReaderStore } from '../../stores/useReaderStore';
import { convertFileSrc } from '@tauri-apps/api/core';
import { SmartImage } from '../SmartImage';
import { motion, AnimatePresence } from 'framer-motion';

export const SlideshowReader = () => {
    const { images } = useReadingStore();
    const { 
        slideshowActive, 
        slideshowDelay, 
        currentPage, 
        setCurrentPage, 
        setSlideshowActive,
        totalPages 
    } = useReaderStore();
    
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // SLIDESHOW ENGINE
    useEffect(() => {
        if (!slideshowActive) return;

        intervalRef.current = setInterval(() => {
            setCurrentPage(useReaderStore.getState().currentPage + 1);
        }, slideshowDelay);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [slideshowActive, slideshowDelay]);

    // End of Chapter Check
    // End of Chapter Check
    useEffect(() => {
        if (currentPage >= totalPages && totalPages > 0) {
            const store = useReadingStore.getState();
            if (store.currentChapterIndex + 1 < store.chapters.length) {
                // Transition to Next Chapter
                store.goToNextChapter();
            } else {
                // End of Series
                setSlideshowActive(false);
                setCurrentPage(totalPages - 1);
            }
        }
    }, [currentPage, totalPages, setSlideshowActive, setCurrentPage]);

    const currentImage = images[currentPage];
    if (!currentImage) return null;

    return (
        <div className="slideshow-reader w-full h-full flex items-center justify-center bg-black overflow-hidden relative">
            <AnimatePresence mode="wait">
                <motion.div
                   key={currentImage}
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   transition={{ duration: 0.8 }}
                   className="w-full h-full flex items-center justify-center px-4"
                >
                    <SmartImage
                        src={currentImage.startsWith('http') ? currentImage : convertFileSrc(currentImage)}
                        alt={`Slide ${currentPage + 1}`}
                        className="max-w-full max-h-full object-contain shadow-2xl"
                    />
                </motion.div>
            </AnimatePresence>
            
            {/* Status Indicator */}
            <div className="absolute bottom-10 left-10 flex items-center gap-3 bg-black/40 backdrop-blur-xl border border-white/5 px-4 py-2 rounded-full">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                    Streaming Slide <span className="text-white/20">•</span> {(slideshowDelay / 1000).toFixed(1)}s
                </span>
            </div>
        </div>
    );
};
