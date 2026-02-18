import { useSettingsStore } from '../stores/useSettingsStore';
import { useReadingStore } from '../stores/useReadingStore';
import { Search, Command, LayoutGrid, SlidersHorizontal } from 'lucide-react';

export const TopBar = () => {
    const { activeView } = useSettingsStore();
    const { images } = useReadingStore();

    // Don't show global top bar in reader mode if it has its own
    // However, V3 spec says Reader UI overhaul has its own top bar logic.
    // For now, let's make it flexible.
    if (images.length > 0) return null;

    return (
        <div className="h-16 border-b border-white/5 bg-background/40 backdrop-blur-3xl flex items-center justify-between px-10 sticky top-0 z-30 no-drag">
            <div className="flex items-center gap-4">
                <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500 italic">
                    {activeView === 'home' ? 'Core Dashboard' : `${activeView} Environment`.toUpperCase()}
                </h1>
            </div>

            <div className="flex items-center gap-6">
                {/* Search Trigger (Visual for now, logic in pages) */}
                <div className="relative group">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-hover:text-blue-400 transition-colors" />
                    <input 
                        type="text"
                        placeholder="Search anything..."
                        className="bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs w-64 focus:outline-none focus:bg-white/10 focus:border-blue-500/30 transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-neutral-500 font-bold uppercase tracking-tighter">
                        <Command size={10} />
                        <span>K</span>
                    </div>
                </div>

                <div className="h-4 w-px bg-white/10" />

                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 transition-colors">
                        <SlidersHorizontal size={18} />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 transition-colors">
                        <LayoutGrid size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
