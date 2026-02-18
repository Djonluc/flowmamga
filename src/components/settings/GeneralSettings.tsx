import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { Folder, Shield } from 'lucide-react';

export const GeneralSettings = () => {
    const { 
        libraryPath, 
        setLibraryPath, 
    } = useSettingsStore();

    const handleBrowseLibrary = async () => {
        try {
            const selected = await openDialog({
                directory: true,
                multiple: false,
                defaultPath: libraryPath || undefined
            });
            if (selected && typeof selected === 'string') {
                setLibraryPath(selected);
                // Trigger rescan? Maybe warn user.
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-8">
            {/* Library Section */}
            <section className="space-y-4">
                <h4 className="text-white font-black uppercase tracking-widest text-xs border-b border-white/10 pb-2">
                    Library Management
                </h4>
                
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                            <Folder size={20} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider">Target Directory</span>
                            <span className="text-white text-sm font-medium truncate opacity-80" title={libraryPath || 'Not set'}>
                                {libraryPath || 'No directory selected'}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={handleBrowseLibrary}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-colors whitespace-nowrap"
                    >
                        Change
                    </button>
                </div>
            </section>

             {/* Safety */}
             <section className="space-y-4">
                <h4 className="text-white font-black uppercase tracking-widest text-xs border-b border-white/10 pb-2">
                    System
                </h4>
                
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                            <Shield size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider">Content Integrity</span>
                            <span className="text-neutral-500 text-[10px] font-medium">Verify file structure and permissions</span>
                        </div>
                    </div>
                    <button 
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-colors"
                        onClick={() => {
                            // Trigger safety check modal via store
                            // Ideally strictly typed in store
                        }}
                    >
                        Verify
                    </button>
                </div>
            </section>
        </div>
    );
};
