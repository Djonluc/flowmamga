
import { useSettingsStore } from '../stores/useSettingsStore';
import { useReadingStore } from '../stores/useReadingStore';
import { BookOpen, MonitorPlay, ArrowDown, Camera, Keyboard, Sliders, X } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export const ControlPanel = () => {
  const { 
    readingMode, setReadingMode, 
    theme, setTheme,
    readingDirection, setReadingDirection,
    gapSize, setGapSize,
    ambientVolume, setAmbientVolume,
    isSettingsOpen, toggleSettings,
    fitMode, setFitMode,
    autoCrop, toggleAutoCrop,
    brightness, setBrightness,
    contrast, setContrast,
    saturation, setSaturation,
    toggleShortcuts
  } = useSettingsStore();
  
  const { images } = useReadingStore();

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          className="fixed bottom-6 right-6 w-85 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl z-50 text-white flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Settings</h3>
            <div className="flex gap-2">
                <button
                    onClick={() => alert("Screenshot captured! (Mock)")}
                    className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                    title="Take Screenshot"
                >
                    <Camera size={16} />
                </button>
                <button
                    onClick={toggleShortcuts}
                    className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                    title="Keyboard Shortcuts (?)"
                >
                    <Keyboard size={16} />
                </button>
                <button
                    onClick={toggleSettings}
                    className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
          </div>

          <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
            {/* Theme & Volume always visible */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Theme</span>
                    <div className="flex gap-1.5">
                        {(['dark', 'light', 'oled', 'paper', 'cyberpunk'] as const).map((t) => (
                            <button 
                                key={t}
                                onClick={() => setTheme(t)} 
                                className={`w-6 h-6 rounded-full border border-white/10 transition-transform hover:scale-110 ${theme === t ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}
                                style={{ background: t === 'dark' ? '#222' : t === 'light' ? '#fff' : t === 'oled' ? '#000' : t === 'paper' ? '#f5f5dc' : '#0ff' }}
                                title={t}
                            />
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex justify-between">
                        <span>Ambience</span>
                        <span>{Math.round(ambientVolume * 100)}%</span>
                    </label>
                    <input 
                    type="range" min="0" max="1" step="0.05"
                    value={ambientVolume}
                    onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                    className="w-full accent-white h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>

            {/* Reading Settings - only if in reader */}
            {images.length > 0 ? (
                <div className="space-y-6 pt-4 border-t border-white/10">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Reading Mode</label>
                        <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-lg">
                            {(['vertical', 'horizontal', 'single', 'slideshow'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setReadingMode(mode)}
                                    className={clsx(
                                        "flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-colors",
                                        readingMode === mode ? "bg-white text-black shadow-sm" : "hover:bg-white/5 text-neutral-300"
                                    )}
                                >
                                    {mode === 'vertical' && <ArrowDown size={12} />}
                                    {mode === 'horizontal' && <BookOpen size={12} className="rotate-90" />}
                                    {mode === 'single' && <BookOpen size={12} />}
                                    {mode === 'slideshow' && <MonitorPlay size={12} />}
                                    <span className="capitalize">{mode}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Fit Mode</label>
                        <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-lg">
                            {(['width', 'height', 'original'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setFitMode(mode)}
                                    className={clsx(
                                        "py-1.5 rounded-md text-[10px] font-medium transition-colors capitalize",
                                        fitMode === mode ? "bg-white text-black shadow-sm" : "hover:bg-white/5 text-neutral-300"
                                    )}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    {readingMode === 'vertical' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Gap Size: {gapSize}px</label>
                                <input 
                                    type="range" min="0" max="100" value={gapSize} 
                                    onChange={(e) => setGapSize(Number(e.target.value))}
                                    className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
                                />
                            </div>
                            
                            <div className="space-y-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-tight">Auto-Scroll</label>
                                    <button 
                                        onClick={useSettingsStore.getState().toggleAutoScrolling}
                                        className={clsx(
                                            "px-3 py-1 rounded-full text-[10px] font-bold transition-all",
                                            useSettingsStore.getState().isAutoScrolling 
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" 
                                                : "bg-white/10 text-neutral-400"
                                        )}
                                    >
                                        {useSettingsStore.getState().isAutoScrolling ? 'ACTIVE' : 'START'}
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-neutral-500">
                                        <span>Scroll Speed</span>
                                        <span>{useSettingsStore.getState().autoScrollSpeed}px</span>
                                    </div>
                                    <input 
                                        type="range" min="0.5" max="10" step="0.5" 
                                        value={useSettingsStore.getState().autoScrollSpeed} 
                                        onChange={(e) => useSettingsStore.getState().setAutoScrollSpeed(Number(e.target.value))}
                                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {readingMode === 'single' && (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Direction</label>
                            <div className="flex bg-white/5 p-1 rounded-lg">
                                <button
                                    onClick={() => setReadingDirection('ltr')}
                                    className={clsx(
                                        "flex-1 py-1.5 rounded-md text-[10px] font-medium transition-colors",
                                        readingDirection === 'ltr' ? "bg-white text-black" : "hover:bg-white/5 text-neutral-300"
                                    )}
                                >
                                    LTR
                                </button>
                                <button
                                    onClick={() => setReadingDirection('rtl')}
                                    className={clsx(
                                        "flex-1 py-1.5 rounded-md text-[10px] font-medium transition-colors",
                                        readingDirection === 'rtl' ? "bg-white text-black" : "hover:bg-white/5 text-neutral-300"
                                    )}
                                >
                                    RTL
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                <Sliders size={12} /> Image Adjustment
                            </div>
                            <button 
                                onClick={toggleAutoCrop}
                                className={clsx(
                                    "px-2 py-1 rounded text-[10px] font-bold transition-colors",
                                    autoCrop ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-neutral-500'
                                )}
                            >
                                AUTO-CROP {autoCrop ? 'ON' : 'OFF'}
                            </button>
                        </div>
                        
                        {[
                            { label: 'Brightness', val: brightness, set: setBrightness, min: 0.5, max: 1.5 },
                            { label: 'Contrast', val: contrast, set: setContrast, min: 0.5, max: 1.5 },
                            { label: 'Saturation', val: saturation, set: setSaturation, min: 0, max: 2 },
                        ].map((s) => (
                            <div key={s.label} className="space-y-1">
                                <div className="flex justify-between text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
                                    <span>{s.label}</span>
                                    <span>{Math.round(s.val * 100)}%</span>
                                </div>
                                <input 
                                    type="range" min={s.min} max={s.max} step="0.05"
                                    value={s.val}
                                    onChange={(e) => s.set(parseFloat(e.target.value))}
                                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="py-8 text-center border-t border-white/10">
                    <p className="text-xs text-neutral-500 italic">Open a book to see reading controls</p>
                </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
