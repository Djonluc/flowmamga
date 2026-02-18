import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Volume2, X, MonitorPlay, CloudRain, Coffee, Wind, Zap } from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useReaderStore } from '../stores/useReaderStore'; // Import Reader Store
import clsx from 'clsx';

export const AmbientControlPanel = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { 
        selectedAmbientSound, setSelectedAmbientSound,
        ambientVolume, setAmbientVolume 
    } = useSettingsStore();
    
    // Subscribe to Reader States for auto-hide
    const { autoScroll, slideshowActive } = useReaderStore();
    const isActive = autoScroll || slideshowActive;

    // Auto-close when active
    useEffect(() => {
        if (isActive) setIsOpen(false);
    }, [isActive]);

    const sounds = [
        { id: 'none', icon: X, label: 'Off' },
        { id: 'lofi', icon: MonitorPlay, label: 'Lofi' },
        { id: 'rain', icon: CloudRain, label: 'Rain' },
        { id: 'cafe', icon: Coffee, label: 'Cafe' },
        { id: 'wind', icon: Wind, label: 'Wind' },
        { id: 'space', icon: Zap, label: 'Space' },
    ] as const;

    return (
        <AnimatePresence>
            {!isActive && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="fixed bottom-6 left-6 z-[60] flex flex-col items-start gap-4 pointer-events-auto"
                >
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                                className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl mb-2 w-64"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Soundscape</span>
                                        <span className="text-xs font-mono text-blue-400">{Math.round(ambientVolume * 100)}%</span>
                                    </div>

                                    <input 
                                        type="range" min="0" max="1" step="0.05"
                                        value={ambientVolume}
                                        onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                                        className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-500"
                                    />

                                    <div className="grid grid-cols-3 gap-2">
                                        {sounds.map((s) => (
                                            <button
                                                key={s.id}
                                                onClick={() => setSelectedAmbientSound(s.id)}
                                                className={clsx(
                                                    "flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border",
                                                    selectedAmbientSound === s.id
                                                        ? "bg-blue-600/20 border-blue-500/50 text-blue-400"
                                                        : "bg-white/5 border-transparent text-neutral-500 hover:bg-white/10 hover:text-neutral-300"
                                                )}
                                            >
                                                <s.icon size={16} />
                                                <span className="text-[9px] font-bold uppercase tracking-wider">{s.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={clsx(
                            "p-3 rounded-full border shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2",
                            isOpen || selectedAmbientSound !== 'none'
                                ? "bg-blue-600 border-blue-400 text-white shadow-blue-500/20"
                                : "bg-black/60 border-white/10 text-neutral-400 hover:text-white backdrop-blur-md"
                        )}
                    >
                        {selectedAmbientSound !== 'none' ? (
                            <div className="flex items-center gap-2">
                                <Volume2 size={20} className={selectedAmbientSound !== 'none' ? "animate-pulse" : ""} />
                                <span className="text-xs font-bold uppercase tracking-wider hidden md:block">
                                    {selectedAmbientSound}
                                </span>
                            </div>
                        ) : (
                            <Music size={20} />
                        )}
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
