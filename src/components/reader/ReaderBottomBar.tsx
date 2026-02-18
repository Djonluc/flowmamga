import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReadingStore } from '../../stores/useReadingStore';
import { convertFileSrc } from '@tauri-apps/api/core';

export const ReaderBottomBar = ({ visible }: { visible: boolean }) => {
    const { currentPageIndex: currentIndex, images, setPageIndex: setPage } = useReadingStore();
    const totalPages = images.length;
    
    const [hoverProgress, setHoverProgress] = useState<number | null>(null);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);
    const barRef = useRef<HTMLDivElement>(null);

    const progress = totalPages > 0 ? ((currentIndex + 1) / totalPages) * 100 : 0;

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!barRef.current) return;
        const rect = barRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const boundedX = Math.max(0, Math.min(x, rect.width));
        const p = boundedX / rect.width;
        setHoverProgress(p * 100);
        
        const index = Math.floor(p * totalPages);
        setPreviewIndex(Math.max(0, Math.min(totalPages - 1, index)));
    };

    const handleClick = (e: React.MouseEvent) => {
        if (!barRef.current) return;
        const rect = barRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const p = x / rect.width;
        const index = Math.floor(p * totalPages);
        setPage(Math.max(0, Math.min(totalPages - 1, index)));
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="fixed bottom-0 left-0 right-0 z-[55] pointer-events-none pb-8 px-12"
                >
                    <div className="relative w-full max-w-4xl mx-auto pointer-events-auto group">
                        
                        {/* Preview Thumbnail */}
                        <AnimatePresence>
                            {previewIndex !== null && hoverProgress !== null && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: -20, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    className="absolute bottom-10 z-50 pointer-events-none"
                                    style={{ left: `${hoverProgress}%`, transform: 'translateX(-50%)' }}
                                >
                                    <div className="bg-neutral-900 border border-white/10 p-1.5 rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.8)] flex flex-col items-center gap-2">
                                        <div className="w-32 aspect-[3/4] overflow-hidden rounded-xl bg-black">
                                            {images[previewIndex] && (
                                                <img 
                                                    src={convertFileSrc(images[previewIndex])} 
                                                    className="w-full h-full object-cover"
                                                    alt={`Preview page ${previewIndex + 1}`}
                                                />
                                            )}
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Page {previewIndex + 1}</span>
                                            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-tighter">OF {totalPages}</span>
                                        </div>
                                    </div>
                                    {/* Arrow */}
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-neutral-900 border-r border-b border-white/10 rotate-45" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Cinematic Slider */}
                        <div 
                            ref={barRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => { setHoverProgress(null); setPreviewIndex(null); }}
                            onClick={handleClick}
                            className="relative h-20 flex items-center cursor-pointer"
                        >
                            {/* The Line */}
                            <div className="absolute inset-x-0 h-[2px] bg-white/10 rounded-full transition-all duration-500 group-hover:h-1 shadow-inner">
                                {/* Current Progress */}
                                <motion.div 
                                    className="absolute inset-y-0 left-0 bg-accent shadow-[0_0_20px_var(--color-accent-glow)] rounded-full z-10"
                                    initial={false}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                />
                                {/* Hover Indicator */}
                                {hoverProgress !== null && (
                                    <div 
                                        className="absolute inset-y-0 left-0 bg-white/20 rounded-full z-0 transition-all duration-100"
                                        style={{ width: `${hoverProgress}%` }}
                                    />
                                )}
                            </div>

                            {/* Current Page Bubble (Only on hover of group) */}
                            <motion.div
                                className="absolute top-0 px-3 py-1 bg-accent text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -translate-y-2"
                                style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
                            >
                                {currentIndex + 1}
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
