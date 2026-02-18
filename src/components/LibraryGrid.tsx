import { useEffect, useState } from 'react';
import { useLibraryStore } from '../stores/useLibraryStore';
import { useReadingStore } from '../stores/useReadingStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { FolderOpen, PlusCircle, LayoutGrid, Library as LibraryIcon, Tag, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShelfView } from './library/ShelfView';
import { GridView } from './library/GridView';
import { TagManagerModal } from './library/TagManagerModal';
import { toast } from './Toast';
import { InputModal } from './InputModal';
import { ImportModal } from './ImportModal';
import { MangaDetails } from './library/MangaDetails';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import clsx from 'clsx';
import type { Series } from '../stores/useLibraryStore';
import { DeleteConfirmModal } from './library/DeleteConfirmModal';

export const LibraryGrid = () => {
    const { 
        series, addMangaFolder, loadFromDb, isLoading, setLoading,
        searchQuery, filterGenre, filterStatus, filterSource,
        selectedSeriesId,
        setSearchQuery, setFilterGenre, setFilterSource, setSelectedSeriesId,
        renameSeries, deleteSeries
    } = useLibraryStore();
    
    const { openFolder } = useReadingStore();
    const { libraryViewMode, libraryDensity, setLibraryViewMode, setLibraryDensity } = useSettingsStore();

    const [isDragging, setIsDragging] = useState(false);
    // const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null); // MOVED TO STORE
    const [showImportModal, setShowImportModal] = useState(false);
    
    // Modals
    const [tagManagerItem, setTagManagerItem] = useState<{ id: string, tags: string[] } | null>(null);
    const [renameItem, setRenameItem] = useState<{ id: string, title: string } | null>(null);
    const [activeMenu, setActiveMenu] = useState<{ x: number, y: number, item: any } | null>(null);
    const [deleteModalItem, setDeleteModalItem] = useState<{ id: string, title: string, count: number, isSeries: boolean } | null>(null);

    useEffect(() => {
        loadFromDb();
    }, [loadFromDb]);

    // --- Filtering Logic ---
    const getFilteredItems = () => {
        if (selectedSeriesId) {
            const selectedSeries = series.find(s => s.id === selectedSeriesId);
            if (!selectedSeries) return [];
            
            // Local filtering within a series (just search)
            return selectedSeries.books.filter(book => 
                book.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return series.filter(s => {
            const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (s.author && s.author.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const matchesGenre = !filterGenre || (s.tags && s.tags.includes(filterGenre));
            const matchesSource = !filterSource || s.source === filterSource;
            
            return matchesSearch && matchesGenre && matchesSource;
        });
    };

    const displayItems = getFilteredItems();
    const allTags = Array.from(new Set(series.flatMap(s => s.tags || []))).sort();

    const handleAction = async (action: 'tag' | 'rename' | 'delete', item: any) => {
        setActiveMenu(null);
        if (action === 'tag') {
            setTagManagerItem({ id: item.id, tags: item.tags || [] });
        } else if (action === 'rename') {
            setRenameItem({ id: item.id, title: item.title });
        } else if (action === 'delete') {
            const isSeries = 'books' in item;
            setDeleteModalItem({
                id: item.id,
                title: item.title,
                count: isSeries ? item.books.length : 1,
                isSeries
            });
        }
    };

    const handleMenuClick = (item: any, action?: 'rename' | 'delete' | 'tag', e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (action) {
            handleAction(action, item);
        } else if (e) {
            setActiveMenu({ x: e.clientX, y: e.clientY, item });
        }
    };

    // --- Import / Drag Drop ---
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => { setIsDragging(false); };
    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) toast.info('Use the Import button to select folders directly for now.');
    };

    const handleSelectLibrary = async () => {
        const selected = await openDialog({ directory: true, multiple: false });
        if (selected && typeof selected === 'string') {
            setLoading(true);
            try {
                await addMangaFolder(selected);
                toast.success('Library folder added!');
            } catch (e) {
                console.error('[Library] Error adding folder', e);
                toast.error('Failed to add folder');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAddWebLink = async (url: string) => {
        if (!url) return;
        toast.info('Web scraping is currently limited in local-first mode.');
    };

    const handleOpenItem = async (item: any) => {
        if ('books' in item) {
            setSelectedSeriesId(item.id);
            setSearchQuery(''); // Clear search when entering series
        } else {
            await handleOpenBook(item);
        }
    };

    const handleOpenBook = async (book: any) => {
        console.log('[Tauri] Opening book at path:', book.path);
        await openFolder(book.path, book.seriesId, book.id); 
    };

    return (
        <div className="h-full relative overflow-hidden">
            {/* ... existing render ... */}
            
            <AnimatePresence mode="wait">
                {selectedSeriesId ? (
                    <MangaDetails 
                        key="details"
                        seriesId={selectedSeriesId} 
                        onBack={() => {
                            setSelectedSeriesId(null);
                            setSearchQuery('');
                        }} 
                    />
                ) : (
                    <motion.div 
                        key="library"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col"
                    >
                        {series.length === 0 ? (
                            <EmptyState onImport={setShowImportModal} onLink={handleSelectLibrary} />
                        ) : (
                            <div 
                                className="h-full p-4 overflow-hidden flex flex-col relative"
                                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                            >
                                {isDragging && <DragOverlay />}

                                {/* HEADER & TOOLBAR */}
                                <div className="flex flex-col gap-6 mb-4 px-4 pt-2 z-10">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-4xl font-black tracking-tighter text-white leading-none uppercase italic">
                                                My <span className="text-accent">Archive</span>
                                            </h2>
                                            <div className="flex items-center gap-2 mt-2">
                                                 <p className="text-neutral-500 font-bold text-[10px] uppercase tracking-[0.2em]">
                                                    {series.length} Series
                                                </p>
                                                <div className="w-px h-3 bg-neutral-700" />
                                                <p className="text-neutral-500 font-bold text-[10px] uppercase tracking-[0.2em]">
                                                    {displayItems.length} Visible
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Density Toggle */}
                                            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5">
                                                 <button 
                                                    onClick={() => setLibraryDensity(libraryDensity === 'comfortable' ? 'compact' : 'comfortable')}
                                                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase text-neutral-400 hover:text-white"
                                                 >
                                                    {libraryDensity}
                                                 </button>
                                            </div>

                                            {/* View Mode */}
                                            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5 gap-1">
                                                <button 
                                                    onClick={() => setLibraryViewMode('grid')}
                                                    className={clsx("p-2 rounded-lg transition-all", libraryViewMode === 'grid' ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white")}
                                                >
                                                    <LayoutGrid size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => setLibraryViewMode('shelf')}
                                                    className={clsx("p-2 rounded-lg transition-all", libraryViewMode === 'shelf' ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white")}
                                                >
                                                    <LibraryIcon size={18} />
                                                </button>
                                            </div>

                                            <button 
                                                onClick={() => setShowImportModal(true)}
                                                className="h-[40px] px-6 bg-white text-black hover:bg-neutral-200 rounded-[12px] text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-white/5"
                                            >
                                                <PlusCircle size={16} />
                                                <span>Import</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* FILTER BAR using Store State */}
                                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                                        {/* Reset */}
                                        {(filterGenre || searchQuery) && (
                                            <button
                                                onClick={() => { setFilterGenre(null); setSearchQuery(''); }}
                                                className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-1"
                                            >
                                                <X size={12} /> Clear
                                            </button>
                                        )}

                                        {/* Genres */}
                                        <div className="flex items-center gap-2 px-2 border-l border-white/10">
                                            <span className="text-[10px] text-neutral-600 font-bold uppercase mr-1">Tags</span>
                                            {allTags.slice(0, 8).map(tag => (
                                                <button
                                                    key={tag}
                                                    onClick={() => setFilterGenre(filterGenre === tag ? null : tag)}
                                                    className={clsx(
                                                        "flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border",
                                                        filterGenre === tag 
                                                            ? "bg-accent border-accent text-white shadow-lg shadow-accent/20" 
                                                            : "bg-white/5 border-white/5 text-neutral-500 hover:text-white hover:bg-white/10"
                                                    )}
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                        
                                        {/* Sources */}
                                        <div className="flex items-center gap-2 px-2 border-l border-white/10">
                                            <span className="text-[10px] text-neutral-600 font-bold uppercase mr-1">Source</span>
                                            {['local', 'mangadex'].map(src => (
                                                <button
                                                    key={src}
                                                    onClick={() => setFilterSource(filterSource === src ? null : src)}
                                                    className={clsx(
                                                        "flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border",
                                                        filterSource === src 
                                                            ? "bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-500/20" 
                                                            : "bg-white/5 border-white/5 text-neutral-500 hover:text-white hover:bg-white/10"
                                                    )}
                                                >
                                                    {src}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 relative min-h-0">
                                    {isLoading ? (
                                        <LoadingDisplay />
                                    ) : displayItems.length === 0 ? (
                                        <NoResultsState />
                                    ) : libraryViewMode === 'shelf' ? (
                                        <ShelfView allSeries={displayItems as Series[]} onOpenItem={handleOpenItem} />
                                    ) : (
                                        <GridView 
                                            items={displayItems} 
                                            onOpenItem={handleOpenItem} 
                                            onMenuClick={handleMenuClick}
                                            density={libraryDensity} 
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <ImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImportFolder={handleSelectLibrary}
                onImportWeb={handleAddWebLink}
            />

            {tagManagerItem && (
                <TagManagerModal 
                    isOpen={true}
                    onClose={() => { setTagManagerItem(null); loadFromDb(); }}
                    seriesId={tagManagerItem.id}
                    initialTags={tagManagerItem.tags}
                />
            )}

            {renameItem && (
                <InputModal 
                    isOpen={true}
                    onClose={() => setRenameItem(null)}
                    title="Rename Series"
                    placeholder="New title..."
                    description={`Renaming: ${renameItem.title}`}
                    onSubmit={(newTitle) => {
                        renameSeries(renameItem.id, newTitle);
                        toast.success('Series renamed');
                    }}
                />
            )}

            <DeleteConfirmModal
                isOpen={!!deleteModalItem}
                onClose={() => setDeleteModalItem(null)}
                onConfirm={async () => {
                    if (deleteModalItem) {
                        try {
                            await deleteSeries(deleteModalItem.id);
                            toast.success('Deleted successfully');
                        } catch (e) {
                            toast.error('Failed to delete');
                        }
                        setDeleteModalItem(null);
                    }
                }}
                title={deleteModalItem?.title || ''}
                itemCount={deleteModalItem?.count}
                isSeries={deleteModalItem?.isSeries || false}
            />

            <ContextMenu activeMenu={activeMenu} onAction={handleAction} onClose={() => setActiveMenu(null)} />
        </div>
    );
};

// --- Subcomponents ---

const EmptyState = ({ onImport, onLink }: { onImport: (v: boolean) => void, onLink: () => void }) => (
    <div className="flex flex-col items-center justify-center h-full p-12 bg-black/40 backdrop-blur-md">
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full p-10 rounded-[48px] bg-white/[0.02] border border-white/5 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
        >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -z-10 animate-pulse" />
            
            <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-blue-600 to-purple-600 p-6 shadow-2xl shadow-blue-500/20 mb-8 transform -rotate-6">
                <FolderOpen size={48} className="text-white" />
            </div>

            <h1 className="text-4xl font-black text-white tracking-tight uppercase italic mb-4">
                Visual <span className="text-blue-500">Archive</span> Empty
            </h1>
            
            <p className="text-neutral-500 font-bold text-sm tracking-wide leading-relaxed mb-10 max-w-sm">
                Initialize your premium reading experience by linking your local manga collection or adding a digital stream.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <button 
                    onClick={() => onImport(true)}
                    className="p-6 rounded-[24px] bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left group"
                >
                    <PlusCircle size={24} className="text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                    <span className="block text-white font-black uppercase text-xs tracking-widest">Add Series</span>
                    <span className="text-[10px] text-neutral-500 font-bold uppercase mt-1">Manual Import</span>
                </button>
                <button 
                        onClick={onLink}
                        className="p-6 rounded-[24px] bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all text-left group"
                >
                    <FolderOpen size={24} className="text-white mb-3 group-hover:scale-110 transition-transform" />
                    <span className="block text-white font-black uppercase text-xs tracking-widest">Link Root</span>
                    <span className="text-[10px] text-blue-100/60 font-bold uppercase mt-1">Auto-Scanner</span>
                </button>
            </div>
        </motion.div>
    </div>
);

const DragOverlay = () => (
    <div className="absolute inset-0 z-50 bg-blue-500/20 backdrop-blur-sm border-4 border-blue-500 border-dashed m-4 rounded-xl flex items-center justify-center pointer-events-none">
        <div className="bg-neutral-900/80 p-6 rounded-2xl text-white transform scale-110">
            <FolderOpen size={48} className="mx-auto mb-2 text-blue-400" />
            <h3 className="text-xl font-bold">Drop Folder to Open</h3>
        </div>
    </div>
);

const LoadingDisplay = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10 rounded-xl">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-white font-medium">Scanning folders...</p>
            </div>
    </div>
);

const NoResultsState = () => (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <FolderOpen size={48} className="text-neutral-700 mb-4" />
        <h3 className="text-xl font-bold text-neutral-400">No Comics Found</h3>
        <p className="text-xs text-neutral-600 mt-2">Try adjusting your filters</p>
    </div>
);

const ContextMenu = ({ activeMenu, onAction, onClose }: { activeMenu: any, onAction: (a: any, i: any) => void, onClose: () => void }) => {
    if (!activeMenu) return null;
    return (
        <div className="fixed inset-0 z-[100]" onClick={onClose}>
            <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            style={{ left: activeMenu.x, top: activeMenu.y }}
            className="absolute bg-neutral-900 border border-white/10 rounded-xl shadow-2xl py-2 min-w-[180px] backdrop-blur-xl"
            >
                <button 
                onClick={() => onAction('tag', activeMenu.item)}
                className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-white hover:bg-white/10 transition-colors"
                >
                    <Tag size={16} className="text-blue-400" />
                    Manage Tags
                </button>
                <button 
                onClick={() => onAction('rename', activeMenu.item)}
                className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-white hover:bg-white/10 transition-colors"
                >
                    <Edit2 size={16} className="text-purple-400" />
                    Rename Series
                </button>
                <div className="h-px bg-white/5 my-1" />
                <button 
                onClick={() => onAction('delete', activeMenu.item)}
                className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <Trash2 size={16} />
                    Delete Series
                </button>
            </motion.div>
        </div>
    );
}
