import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { Trash2, Folder } from 'lucide-react';

export const DownloadSettings = () => {
    const { 
        downloadPath, 
        setDownloadPath, 
    } = useSettingsStore();

    const handleBrowseDownloads = async () => {
        try {
            const selected = await openDialog({
                directory: true,
                multiple: false,
                defaultPath: downloadPath || undefined
            });
            if (selected && typeof selected === 'string') {
                setDownloadPath(selected);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-8">
            <section className="space-y-4">
                <h4 className="text-white font-black uppercase tracking-widest text-xs border-b border-white/10 pb-2">
                    Storage Configuration
                </h4>
                
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
                            <Folder size={20} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider">Download Directory</span>
                            <span className="text-white text-sm font-medium truncate opacity-80" title={downloadPath || 'Default (Library)'}>
                                {downloadPath || 'Same as Library'}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={handleBrowseDownloads}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-colors whitespace-nowrap"
                    >
                        Change
                    </button>
                </div>
            </section>

             <section className="space-y-4">
                <h4 className="text-white font-black uppercase tracking-widest text-xs border-b border-white/10 pb-2">
                    Maintenance
                </h4>
                
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between px-6 py-8">
                    <div className="flex flex-col gap-1">
                        <span className="text-white font-bold uppercase tracking-wide">Clear Download Cache</span>
                        <span className="text-neutral-500 text-xs">Removes temporary files. Does not delete chapters.</span>
                    </div>
                    <button 
                        className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                        onClick={() => {
                            if (confirm('Clear temporary download cache?')) {
                                // Logic to clear cache would go here
                            }
                        }}
                    >
                        <Trash2 size={16} />
                        Clear Cache
                    </button>
                </div>
            </section>
        </div>
    );
};
