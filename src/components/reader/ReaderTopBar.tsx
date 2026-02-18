import { useReadingStore } from '../../stores/useReadingStore';
import { useReaderStore } from '../../stores/useReaderStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { ArrowLeft, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export const ReaderTopBar = ({ visible, onBack }: { visible: boolean, onBack: () => void }) => {
    const { mode, autoScroll, setAutoScroll, scrollSpeed } = useReaderStore();
    const { isFullscreen } = useSettingsStore();
    const { currentFolderPath } = useReadingStore();

    const title = currentFolderPath ? currentFolderPath.split(/[\\/]/).pop() : 'Reading Session';

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between pointer-events-auto"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent -z-10" />

                    {/* LEFT: Back & Title */}
                    <div className="flex items-center gap-6 min-w-0">
                        <button 
                            onClick={onBack}
                            className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-3xl flex items-center justify-center text-white hover:bg-white/10 transition-all hover:scale-110 active:scale-95 border border-white/5 group"
                        >
                            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </button>

                        <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-[10px] font-black text-accent uppercase tracking-[0.4em] drop-shadow-sm">Viewing Archive</span>
                            <h1 className="text-2xl font-black text-white leading-tight truncate drop-shadow-2xl uppercase italic tracking-tighter">
                                {title}
                            </h1>
                        </div>
                    </div>

                    {/* RIGHT: Minimal Mode Indicator */}
                    <div className="flex items-center gap-3">
                         {/* Play Pill (Vertical Mode Only) */}
                         {mode === 'vertical' && (
                             <motion.button
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={() => setAutoScroll(!autoScroll)}
                                className={clsx(
                                    "px-6 py-2 rounded-full backdrop-blur-3xl border transition-all duration-300 flex items-center gap-3 group/pill",
                                    autoScroll 
                                        ? "bg-accent/20 border-accent/50 text-accent shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
                                        : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
                                )}
                             >
                                {autoScroll ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center">
                                    {autoScroll ? 'Playing' : 'Auto Scroll'}
                                    <span className="ml-3 px-2 py-0.5 rounded-md bg-white/5 text-[8px] opacity-60 group-hover/pill:opacity-100 transition-opacity">
                                        {Math.round(scrollSpeed)} PX/S
                                    </span>
                                </span>
                             </motion.button>
                         )}

                         <div className="px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-3xl">
                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                                {mode} <span className="text-white/20 mx-2">|</span> {isFullscreen ? 'Fullscreen' : 'Windowed'}
                            </span>
                         </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
