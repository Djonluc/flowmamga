import React from 'react';
import { motion } from 'framer-motion';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { Play, ArrowLeft, Clock, Library as LibraryIcon, User, RefreshCw, Trash2, Image as ImageIcon } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useLibraryStore, type Book } from '../../stores/useLibraryStore';
import { useReadingStore } from '../../stores/useReadingStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { UpdateManager } from '../../services/UpdateManager';
import { toast } from '../Toast';
import clsx from 'clsx';

interface MangaDetailsProps {
  seriesId: string;
  onBack: () => void;
}

export const MangaDetails: React.FC<MangaDetailsProps> = ({ seriesId, onBack }) => {
  const { series } = useLibraryStore();
  const { openFolder } = useReadingStore();
  const { setAmbientImage } = useSettingsStore();
  const [isDraggingCover, setIsDraggingCover] = React.useState(false);
  
  const selectedSeries = series.find(s => s.id === seriesId);

  // Derive cover
  const coverSrc = selectedSeries?.cover ? (selectedSeries.cover.startsWith('http') ? selectedSeries.cover : convertFileSrc(selectedSeries.cover)) : '';

  // Sync Ambient
  React.useEffect(() => {
      if (coverSrc) {
          setAmbientImage(coverSrc);
      }
      return () => setAmbientImage(null);
  }, [coverSrc, setAmbientImage]);

  if (!selectedSeries) return null;

  // Sort chapters numerically
  const sortedChapters = [...selectedSeries.books].sort((a, b) => {
    const numA = parseFloat(a.meta.chapter || '0');
    const numB = parseFloat(b.meta.chapter || '0');
    return numA - numB;
  });

  const handleChangeCover = async () => {
      try {
        const selected = await openDialog({
            multiple: false,
            filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp']}]
        });
        
        if (selected && typeof selected === 'string') {
            toast.info('Updating cover...');
            await useLibraryStore.getState().setSeriesCover(seriesId, selected);
            toast.success('Cover updated');
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to update cover');
      }
  };

  const handleRemoveCover = async () => {
      if (confirm('Remove this cover image?')) {
          try {
              await useLibraryStore.getState().removeSeriesCover(seriesId);
              toast.success('Cover removed');
          } catch (e) {
              console.error(e);
              toast.error('Failed to remove cover');
          }
      }
  };

  const handleReadChapter = async (targetBook: Book) => {
    // Generate the sequence of chapters for seamless reading
    const sequence = sortedChapters.map(b => ({ id: b.id, path: b.path, title: b.title }));
    await openFolder(targetBook.path, targetBook.seriesId, targetBook.id, sequence);
  };

  const handleStartFromBeginning = () => {
    if (sortedChapters.length > 0) {
      handleReadChapter(sortedChapters[0]);
    }
  };

  const handleContinueReading = () => {
    // Find last read book or default to latest with any progress
    const latestWithProgress = sortedChapters.filter(b => b.progress && b.progress.currentPage > 0).pop();
    if (latestWithProgress) {
      handleReadChapter(latestWithProgress);
    } else {
      handleStartFromBeginning();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col bg-[#080808] relative overflow-hidden"
    >
      {/* Local Ambient Removed in favor of Global */}

      {/* Top Bar Navigation */}
      <div className="z-30 p-8 flex items-center justify-between pointer-events-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-all text-xs font-black uppercase tracking-widest group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Archive
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar z-10 px-8 pb-32">
        <div className="max-w-7xl mx-auto">
          {/* MODERN LAYOUT: Top Section */}
          <div className="flex flex-col lg:flex-row gap-12 items-start pt-4">
            {/* Poster Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={clsx(
                  "group shrink-0 w-full lg:w-96 aspect-[2/3] rounded-[40px] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/10 relative transition-all",
                  isDraggingCover && "border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.3)] scale-105"
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingCover(true); }}
              onDragLeave={() => setIsDraggingCover(false)}
              onDrop={async (e) => {
                  e.preventDefault();
                  setIsDraggingCover(false);
                  const files = Array.from(e.dataTransfer.files);
                  if (files.length > 0) {
                      const file = files[0]; 
                      const filePath = (file as any).path; 
                      if (filePath) {
                          toast.info('Updating cover...');
                          await useLibraryStore.getState().setSeriesCover(seriesId, filePath);
                          toast.success('Cover updated');
                      } else {
                          toast.info('Please use the Change Cover button to select files.');
                      }
                  }
              }}
            >
              {coverSrc ? (
                <img src={coverSrc} alt={selectedSeries.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center gap-6">
                  <LibraryIcon size={64} className="text-neutral-700" />
                  <span className="text-xs font-black text-neutral-600 uppercase tracking-widest">Missing Cover Art</span>
                </div>
              )}

              {/* Cover Actions Overlay */}
              <div className={clsx(
                  "absolute inset-0 bg-black/60 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-sm pointer-events-none",
                  isDraggingCover ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto"
              )}>
                  {isDraggingCover ? (
                      <div className="flex flex-col items-center gap-2 text-blue-400">
                          <ImageIcon size={32} className="animate-bounce" />
                          <span className="font-black uppercase tracking-widest text-xs">Drop to Update</span>
                      </div>
                  ) : (
                    <>
                        <button 
                            onClick={handleChangeCover}
                            className="px-6 py-3 bg-white text-black rounded-full font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-xl"
                        >
                            <ImageIcon size={14} /> Change Cover
                        </button>
                        {selectedSeries.cover && (
                            <button 
                                onClick={handleRemoveCover}
                                className="px-6 py-3 bg-red-500/20 text-red-500 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-red-500/30 transition-colors flex items-center gap-2 border border-red-500/20"
                            >
                                <Trash2 size={14} /> Remove
                            </button>
                        )}
                    </>
                  )}
              </div>
            </motion.div>

            {/* Metadata Section */}
            <div className="flex-1 min-w-0 space-y-10">
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]">
                    CHAPTER ARCHIVE
                  </span>
                  {selectedSeries.tags.map(tag => (
                    <button 
                        key={tag} 
                        onClick={() => {
                            useLibraryStore.getState().setFilterGenre(tag);
                            onBack();
                        }}
                        className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-[0.9] break-words">
                    {selectedSeries.displayName}
                  </h1>
                  {selectedSeries.author && (
                    <div className="flex items-center gap-2 text-neutral-400 font-bold text-sm">
                      <User size={16} className="text-blue-500" />
                      <span className="uppercase tracking-widest">{selectedSeries.author}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-8 py-4 border-y border-white/5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Archive Size</span>
                    <span className="text-xl font-black text-white uppercase italic">{selectedSeries.books.length} VOLS</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Last Modified</span>
                    <span className="text-xl font-black text-white uppercase italic">{new Date(selectedSeries.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Progress</span>
                    <span className="text-xl font-black text-white uppercase italic">
                      {Math.floor((sortedChapters.filter(b => b.progress?.currentPage && b.progress.currentPage >= b.progress.totalPages - 1).length / sortedChapters.length) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Description / Synopsis */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Chronicle Overview</h3>
                <p className="text-neutral-400 leading-relaxed font-bold text-base max-w-3xl">
                  {selectedSeries.description || "No transmission log found in local metadata. Synchronization with source required for full synopsis retrieval."}
                </p>
              </div>

              {/* Desktop Actions */}
              <div className="hidden lg:flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white/5 rounded-[24px] p-1 border border-white/10">
                    <select 
                        className="bg-transparent text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 outline-none cursor-pointer [&>option]:bg-neutral-900"
                        onChange={(e) => {
                             (window as any).__updateLimit = Number(e.target.value);
                        }}
                        defaultValue="5"
                    >
                        <option value="1">Next 1</option>
                        <option value="5">Next 5</option>
                        <option value="10">Next 10</option>
                        <option value="0">All</option>
                    </select>

                    <button 
                    onClick={async () => {
                        const limit = (window as any).__updateLimit !== undefined ? (window as any).__updateLimit : 5;
                        toast.info(`Checking for updates (Limit: ${limit === 0 ? 'All' : limit})...`);
                        try {
                            const count = await UpdateManager.checkForUpdates(selectedSeries.id, limit);
                            if (count > 0) {
                                toast.success(`Queued ${count} new chapters!`);
                            } else if (count === 0) {
                                toast.info('Series is up to date');
                            } else {
                                toast.error('Update check failed');
                            }
                        } catch (e) {
                            toast.error('Error checking updates');
                        }
                    }}
                    className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-[20px] font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 flex items-center gap-3"
                    >
                    <RefreshCw size={18} />
                    <span>Update</span>
                    </button>
                </div>
                 <button 
                  onClick={handleContinueReading}
                  className="px-10 py-5 bg-white text-black rounded-[24px] font-black uppercase tracking-[0.2em] text-sm hover:bg-neutral-200 transition-all flex items-center gap-4 shadow-[0_20px_40px_rgba(255,255,255,0.05)] active:scale-95"
                >
                  <Play size={20} fill="currentColor" />
                  <span>Resume Mission</span>
                </button>
                <button 
                  onClick={handleStartFromBeginning}
                  className="px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-sm transition-all active:scale-95"
                >
                  Initialization
                </button>
              </div>
            </div>
          </div>

          {/* Chapters Section */}
          <div className="mt-20 space-y-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                Sector <span className="text-blue-500">Log</span>
              </h2>
              <div className="flex items-center gap-6">
                 <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                  Ordered Numerically
                 </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedChapters.map((book, idx) => {
                const isRead = book.progress && book.progress.currentPage >= book.progress.totalPages - 2;
                const percent = book.progress ? Math.floor((book.progress.currentPage / book.progress.totalPages) * 100) : 0;
                
                return (
                  <button
                    key={book.id}
                    onClick={() => handleReadChapter(book)}
                    className="group flex flex-col p-6 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 rounded-[28px] transition-all text-left relative overflow-hidden active:scale-98"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={clsx(
                        "px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest",
                        isRead ? "bg-blue-500 text-white" : "bg-white/10 text-neutral-400"
                      )}>
                        V.{book.meta.chapter || idx + 1}
                      </div>
                      {isRead && <Clock size={14} className="text-blue-400" />}
                    </div>
                    
                    <h4 className="text-white font-black uppercase italic text-sm group-hover:text-blue-400 transition-colors truncate mb-8">
                      {book.title}
                    </h4>

                    {/* Progress Bar Mini */}
                    <div className="mt-auto space-y-2">
                       <div className="flex items-center justify-between text-[9px] font-black uppercase text-neutral-500 tracking-widest">
                          <span>{percent}% Read</span>
                          <span>{book.progress?.totalPages || '?'} Pgs</span>
                       </div>
                       <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            className="h-full bg-blue-500"
                          />
                       </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM ACTIONS (Mobile-first perspective / Quick access) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-6 z-50 bg-gradient-to-t from-black via-black/80 to-transparent">
        <button 
          onClick={handleContinueReading}
          className="w-full py-5 bg-white text-black rounded-[24px] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-4 shadow-2xl active:scale-95"
        >
          <Play size={20} fill="currentColor" />
          <span>Resume Reading</span>
        </button>
      </div>
    </motion.div>
  );
};
