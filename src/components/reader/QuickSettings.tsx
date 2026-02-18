import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, ScrollText, BookOpen, Play, Maximize, Minimize, Settings, X, Plus, Minus } from 'lucide-react';
import { useReaderStore } from '../../stores/useReaderStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import clsx from 'clsx';

export const QuickSettings = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { 
        mode, setMode, 
        autoScroll, setAutoScroll, 
        scrollSpeed, setScrollSpeed,
        slideshowDelay, setSlideshowDelay,
        slideshowActive, setSlideshowActive
    } = useReaderStore();
    
    const { isFullscreen, toggleFullScreenAction, toggleSettings } = useSettingsStore();

    const handleSpeedChange = (delta: number) => {
        setScrollSpeed(Math.max(10, Math.min(500, scrollSpeed + delta)));
    };

    const handleDelayChange = (delta: number) => {
        setSlideshowDelay(Math.max(1000, Math.min(20000, slideshowDelay + delta)));
    };

    return (
        <div className="fixed bottom-12 right-12 z-[60] pointer-events-auto">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute bottom-20 right-0 w-72 bg-neutral-900/90 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 shadow-[0_32px_128px_rgba(0,0,0,0.8)] space-y-8"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em]">Reader Core Settings</h3>
                            <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-white transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Mode Toggles */}
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'vertical', icon: ScrollText, label: 'Scroll' },
                                { id: 'single', icon: BookOpen, label: 'Single' },
                                { id: 'slideshow', icon: Play, label: 'Auto' },
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setMode(m.id as any)}
                                    className={clsx(
                                        "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300",
                                        mode === m.id 
                                            ? "bg-accent border-accent text-white shadow-lg shadow-accent/20" 
                                            : "bg-white/5 border-white/5 text-neutral-500 hover:bg-white/10"
                                    )}
                                >
                                    <m.icon size={20} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">{m.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Contextual Sliders */}
                        <div className="space-y-6 pt-2">
                            {mode === 'vertical' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Scroll Speed</span>
                                            <span className="text-[9px] font-black text-accent uppercase tracking-widest">{Math.round(scrollSpeed)} PPS</span>
                                        </div>
                                        <button 
                                            onClick={() => setAutoScroll(!autoScroll)}
                                            className={clsx(
                                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                                autoScroll ? "bg-accent text-white" : "bg-white/10 text-neutral-400"
                                            )}
                                        >
                                            {autoScroll ? 'Active' : 'Standby'}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => handleSpeedChange(-10)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"><Minus size={14} /></button>
                                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div 
                                                className="h-full bg-accent"
                                                initial={false}
                                                animate={{ width: `${(scrollSpeed / 500) * 100}%` }}
                                            />
                                        </div>
                                        <button onClick={() => handleSpeedChange(10)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"><Plus size={14} /></button>
                                    </div>
                                </div>
                            )}

                            {mode === 'slideshow' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Frame Delay</span>
                                            <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">{(slideshowDelay / 1000).toFixed(1)}s</span>
                                        </div>
                                        <button 
                                            onClick={() => setSlideshowActive(!slideshowActive)}
                                            className={clsx(
                                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                                slideshowActive ? "bg-purple-500 text-white" : "bg-white/10 text-neutral-400"
                                            )}
                                        >
                                            {slideshowActive ? 'Running' : 'Paused'}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => handleDelayChange(-500)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"><Minus size={14} /></button>
                                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div 
                                                className="h-full bg-purple-500"
                                                initial={false}
                                                animate={{ width: `${(slideshowDelay / 20000) * 100}%` }}
                                            />
                                        </div>
                                        <button onClick={() => handleDelayChange(500)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"><Plus size={14} /></button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* System Quick Actions */}
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                             <button 
                                onClick={toggleFullScreenAction}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all group"
                             >
                                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                                <span className="text-[9px] font-black uppercase tracking-widest">Screen</span>
                             </button>
                             <button 
                                onClick={toggleSettings}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all group"
                             >
                                <Settings size={16} />
                                <span className="text-[9px] font-black uppercase tracking-widest">System</span>
                             </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 border border-white/10 backdrop-blur-3xl",
                    isOpen ? "bg-accent text-white rotate-90" : "bg-black/60 text-neutral-400 hover:text-white"
                )}
            >
                {isOpen ? <X size={24} /> : <Settings2 size={24} />}
            </motion.button>
        </div>
    );
};
