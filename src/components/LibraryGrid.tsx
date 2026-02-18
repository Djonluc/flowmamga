import { useEffect, useState } from 'react';
import { useLibraryStore } from '../stores/useLibraryStore';
import { useReadingStore } from '../stores/useReadingStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { FolderOpen, PlusCircle, Search, Grid, List, LayoutGrid, Clock, Library as LibraryIcon, Plus, Tag, Edit2, Trash2 } from 'lucide-react';
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

export const LibraryGrid = () => {
  const { series, addMangaFolder, loadFromDb, isLoading, setLoading } = useLibraryStore();
  const { openFolder } = useReadingStore();
  const { libraryViewMode, libraryDensity, setLibraryViewMode } = useSettingsStore();

  const [isDragging, setIsDragging] = useState(false);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagManagerItem, setTagManagerItem] = useState<{ id: string, tags: string[] } | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [renameItem, setRenameItem] = useState<{ id: string, title: string } | null>(null);
  const [activeMenu, setActiveMenu] = useState<{ x: number, y: number, item: any } | null>(null);

  useEffect(() => {
    loadFromDb();
  }, [loadFromDb]);

  const allSeries = series;
  const selectedSeries = allSeries.find(s => s.id === selectedSeriesId);
  
  const rawItems = selectedSeries ? selectedSeries.books : allSeries;
  const displayItems = rawItems.filter(item => 
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!selectedTag || ('books' in item && (item as any).tags && (item as any).tags.includes(selectedTag)))
  );

  const { renameSeries, deleteSeries } = useLibraryStore();

  const handleAction = async (action: 'tag' | 'rename' | 'delete', item: any) => {
      setActiveMenu(null);
      if (action === 'tag') {
          setTagManagerItem({ id: item.id, tags: item.tags || [] });
      } else if (action === 'rename') {
          setRenameItem({ id: item.id, title: item.title });
      } else if (action === 'delete') {
          if (confirm(`Are you sure you want to delete "${item.title}"? This cannot be undone.`)) {
              await deleteSeries(item.id);
              toast.success('Series deleted');
          }
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        setLoading(true);
        try {
            toast.info('Use the Import button to select folders directly for now.');
        } catch (err) {
            console.error('[Library] Drop error', err);
        } finally {
            setLoading(false);
        }
    }
  };

  const handleSelectLibrary = async () => {
    const selected = await openDialog({
        directory: true,
        multiple: false
    });
    
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
    } else {
      await handleOpenBook(item);
    }
  };

  const handleOpenBook = async (book: any) => {
    console.log('[Tauri] Opening book at path:', book.path);
    await openFolder(book.path, book.seriesId, book.id); 
  };

//   const handleRefresh = async () => {
//      setLoading(true);
//      await loadFromDb();
//      setLoading(false);
//   };

  return (
    <div className="h-full relative overflow-hidden">
      <AnimatePresence mode="wait">
        {selectedSeriesId ? (
          <MangaDetails 
            key="details"
            seriesId={selectedSeriesId} 
            onBack={() => setSelectedSeriesId(null)} 
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
                                onClick={() => setShowImportModal(true)}
                                className="p-6 rounded-[24px] bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left group"
                            >
                                <PlusCircle size={24} className="text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                                <span className="block text-white font-black uppercase text-xs tracking-widest">Add Series</span>
                                <span className="text-[10px] text-neutral-500 font-bold uppercase mt-1">Manual Import</span>
                            </button>
                            <button 
                                 onClick={handleSelectLibrary}
                                 className="p-6 rounded-[24px] bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all text-left group"
                            >
                                <FolderOpen size={24} className="text-white mb-3 group-hover:scale-110 transition-transform" />
                                <span className="block text-white font-black uppercase text-xs tracking-widest">Link Root</span>
                                <span className="text-[10px] text-blue-100/60 font-bold uppercase mt-1">Auto-Scanner</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            ) : (
                <div 
                    className="h-full p-4 overflow-hidden flex flex-col relative"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                   {isDragging && (
                     <div className="absolute inset-0 z-50 bg-blue-500/20 backdrop-blur-sm border-4 border-blue-500 border-dashed m-4 rounded-xl flex items-center justify-center pointer-events-none">
                        <div className="bg-neutral-900/80 p-6 rounded-2xl text-white transform scale-110">
                            <FolderOpen size={48} className="mx-auto mb-2 text-blue-400" />
                            <h3 className="text-xl font-bold">Drop Folder to Open</h3>
                        </div>
                     </div>
                   )}

                    {/* COLLECTION ROOT HEADER */}
                    <div className="flex flex-col gap-6 mb-8 px-8 pt-6 z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-4xl font-black tracking-tighter text-white leading-none uppercase italic">
                                    My <span className="text-accent">Archive</span>
                                </h2>
                                <p className="text-neutral-500 font-black text-[10px] uppercase tracking-[0.3em] mt-3 px-1 flex items-center gap-2">
                                    <span className="w-8 h-px bg-neutral-800" />
                                    {displayItems.length} SERIES INDEXED
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* View Controls */}
                                <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5 gap-1">
                                    <button 
                                        onClick={() => setLibraryViewMode('grid')}
                                        className={clsx("p-2 rounded-lg transition-all", libraryViewMode === 'grid' ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white")}
                                        title="Grid View"
                                    >
                                        <LayoutGrid size={18} />
                                    </button>
                                    <button 
                                        onClick={() => setLibraryViewMode('shelf')}
                                        className={clsx("p-2 rounded-lg transition-all", libraryViewMode === 'shelf' ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white")}
                                        title="Shelf View"
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

                        {/* Quick Filters Row */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                            <div className="relative max-w-xs w-64 group mr-4">
                                <input 
                                    type="text"
                                    placeholder="Find series..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 px-10 text-xs focus:outline-none focus:bg-white/[0.07] focus:border-accent/30 transition-all font-bold"
                                />
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-600" />
                            </div>

                            <button
                                onClick={() => setSelectedTag(null)}
                                className={clsx(
                                    "flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                                    !selectedTag ? "bg-accent border-accent text-white shadow-lg shadow-accent/20" : "bg-white/5 border-white/5 text-neutral-500 hover:text-white hover:bg-white/10"
                                )}
                            >
                                All Archive
                            </button>
                            
                            <div className="w-px h-4 bg-white/10 mx-2" />

                            {['Reading', 'Recently Added', 'Completed', 'Dropped', 'Plan to Read'].map(filter => (
                                <button
                                    key={filter}
                                    className="flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/5 text-neutral-500 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 relative min-h-0">
                        {isLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10 rounded-xl">
                                 <div className="flex flex-col items-center gap-4">
                                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                      <p className="text-white font-medium">Scanning folders...</p>
                                 </div>
                            </div>
                        ) : displayItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <FolderOpen size={48} className="text-neutral-700 mb-4" />
                                <h3 className="text-xl font-bold text-neutral-400">No Comics Found</h3>
                            </div>
                        ) : libraryViewMode === 'shelf' ? (
                            <ShelfView allSeries={displayItems} onOpenItem={handleOpenItem} />
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
            onClose={() => {
                setTagManagerItem(null);
                loadFromDb(); 
            }}
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

      <AnimatePresence>
          {activeMenu && (
              <div className="fixed inset-0 z-[100]" onClick={() => setActiveMenu(null)}>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    style={{ left: activeMenu.x, top: activeMenu.y }}
                    className="absolute bg-neutral-900 border border-white/10 rounded-xl shadow-2xl py-2 min-w-[180px] backdrop-blur-xl"
                  >
                      <button 
                        onClick={() => handleAction('tag', activeMenu.item)}
                        className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-white hover:bg-white/10 transition-colors"
                      >
                          <Tag size={16} className="text-blue-400" />
                          Manage Tags
                      </button>
                      <button 
                        onClick={() => handleAction('rename', activeMenu.item)}
                        className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-white hover:bg-white/10 transition-colors"
                      >
                          <Edit2 size={16} className="text-purple-400" />
                          Rename Series
                      </button>
                      <div className="h-px bg-white/5 my-1" />
                      <button 
                        onClick={() => handleAction('delete', activeMenu.item)}
                        className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                          <Trash2 size={16} />
                          Delete Series
                      </button>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};
