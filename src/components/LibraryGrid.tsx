
import { useState } from 'react';

import { useLibraryStore, type Series } from '../stores/useLibraryStore';
import { useReadingStore } from '../stores/useReadingStore';
import { FolderOpen, Compass, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { ShelfView } from './library/ShelfView';
import { useMetadataStore } from '../stores/useMetadataStore';
import { toast } from './Toast';
import { detectSource, fetchWebManga, downloadChapterPages } from '../utils/webScrapers';
import { ImportModal } from './ImportModal';

export const LibraryGrid = () => {
  const { libraryPaths, series, addLibraryPath, addWebLink, setSeries, setLoading, addToRecent, isLoading, webLinks } = useLibraryStore();
  const { openFolder } = useReadingStore();
  const { getMetadata, setMetadata } = useMetadataStore();

  const [isDragging, setIsDragging] = useState(false);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Convert web links to series format and merge with local series
  const webSeries: Series[] = webLinks.map((url, index) => {
    const metadata = getMetadata(url);
    const chapters = metadata?.chapters || [];
    
    return {
      id: `web-${index}-${url}`,
      title: metadata?.title || new URL(url).hostname,
      cover: metadata?.coverUrl || null,
      books: Array.isArray(chapters) ? chapters.map((ch: any) => ({
        path: ch.url,
        title: ch.title,
        cover: metadata?.coverUrl || null,
        meta: {
          chapter: ch.number?.toString() || '1',
          title: ch.title,
        }
      })) : []
    };
  });

  // Merge local and web series
  const allSeries = [...series, ...webSeries];
  const selectedSeries = allSeries.find(s => s.id === selectedSeriesId);
  const displayItems = selectedSeries ? selectedSeries.books : allSeries;

  // Drag & Drop Handlers
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

    if (window.electron && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        // @ts-ignore
        const droppedPath = file.path;
        
        if (droppedPath) {
            setLoading(true);
            try {
                const images = await window.electron.readFolder(droppedPath);
                if (images && images.length > 0) {
                    openFolder(droppedPath, images);
                } else {
                    addLibraryPath(droppedPath);
                    await handleRefresh();
                }
            } catch (err) {
                console.error("Drop failed", err);
            } finally {
                setLoading(false);
            }
        }
    }
  };

  const handleSelectLibrary = async () => {
    if (!window.electron) {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      const demoSeries = [
        {
          id: 'demo_solo',
          title: 'Solo Leveling',
          cover: 'https://m.media-amazon.com/images/I/71s+pM+-DQL._AC_UF1000,1000_QL80_.jpg',
          books: [
            {
                path: 'demo-series-1-c1',
                title: 'Solo Leveling - Ch 1',
                cover: 'https://m.media-amazon.com/images/I/71s+pM+-DQL._AC_UF1000,1000_QL80_.jpg',
                meta: { series: 'Solo Leveling', chapter: '1', group: 'Demo' }
            }
          ]
        }
      ];
      addLibraryPath('Demo Library');
      setSeries(demoSeries);
      setLoading(false);
      return;
    }
    
    try {
      const path = await window.electron.openFolder();
      if (path) {
        addLibraryPath(path);
        await handleRefresh();
      }
    } catch (e) {
      console.error('[Library] Error in handleSelectLibrary', e);
    }
  };

  const handleAddWebLink = async (url: string) => {
    if (!url) return;
    
    toast.info('Fetching manga metadata...');
    
    try {
      const source = detectSource(url);
      if (!source) {
        toast.error('Unsupported website. Please use MangaDex, Webtoons, MangaMirai, Hitomi, or nHentai.');
        return;
      }
      
      const webManga = await fetchWebManga(url);
      if (!webManga) {
        toast.error('Failed to fetch manga data');
        return;
      }
      
      // Save web manga data to metadata store
      setMetadata(url, {
        title: webManga.title,
        coverUrl: webManga.coverUrl,
        description: webManga.description,
        chapters: webManga.chapters as any // Store full chapter data
      });
      
      // Add URL to webLinks
      addWebLink(url);
      
      toast.success(`Added ${webManga.title} to library!`);
    } catch (error) {
      console.error('Error fetching web manga:', error);
      toast.error('Failed to add web manga');
    }
  };

  const handleOpenItem = async (item: any) => {
    if ('books' in item) {
      // It's a series
      setSelectedSeriesId(item.id);
    } else {
      // It's a book/chapter
      await handleOpenBook(item);
    }
  };

  const handleOpenBook = async (book: any) => {
    addToRecent(book);

    if (book.path.startsWith('http')) {
        // Handle web book
        setLoading(true);
        try {
            const source = detectSource(book.path) || 'nHentai'; // Fallback or detect from series
            const pages = await downloadChapterPages(book.path, source);
            if (pages && pages.length > 0) {
                openFolder(book.path, pages.map((p: any) => p.imageUrl));
            } else {
                toast.error("Failed to load web pages");
            }
        } catch (error) {
            console.error("Failed to open web book", error);
            toast.error("Error loading web content");
        } finally {
            setLoading(false);
        }
        return;
    }

    if (!window.electron) {
        openFolder(book.path, []);
        return;
    }

    try {
      setLoading(true);
      const images = await window.electron.readFolder(book.path);
      if (images && images.length > 0) {
        openFolder(book.path, images);
      } else {
        alert("No images found in this folder.");
      }
    } catch (error) {
       console.error("[Library] Failed to read folder", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (window.electron && libraryPaths.length > 0) {
      setLoading(true);
      try {
          const allSeries = [];
          for (const path of libraryPaths) {
              const scanned = await window.electron.scanLibrary(path);
              allSeries.push(...scanned);
          }
          // Simple de-duplication of series by ID
          const uniqueSeries = Array.from(new Map(allSeries.map(item => [item.id, item])).values());
          setSeries(uniqueSeries);
      } catch (err) {
          console.error("Refresh failed", err);
      } finally {
          setLoading(false);
      }
    }
  };

  if (libraryPaths.length === 0 && webLinks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
        <h2 className="text-3xl font-bold bg-gradient-to-br from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Welcome to FlowManga
        </h2>
        <p className="text-neutral-400">Import manga from your computer or web sources to get started.</p>
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-full hover:scale-105 transition-transform active:scale-95 shadow-xl shadow-purple-500/20"
        >
          <PlusCircle size={24} /> Import Manga
        </button>
      </div>
    );
  }

  return (
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

        <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-4">
                {selectedSeriesId && (
                    <button
                        onClick={() => setSelectedSeriesId(null)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all border border-white/5 text-sm"
                    >
                        <Compass size={16} className="rotate-180" />
                        <span>Libray</span>
                    </button>
                )}
                <h2 className="text-xl font-bold text-white">
                    {selectedSeries ? selectedSeries.title : 'My Library'}
                </h2>
            </div>

            <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                  title="Refresh Library"
                >
                    <motion.div whileTap={{ rotate: 180 }}><Compass size={20} /></motion.div>
                </button>
                <button 
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg"
                    title="Import Manga"
                >
                    <PlusCircle size={18} />
                    <span>Import</span>
                </button>
            </div>
        </div>
      
      <div className="flex-1 relative">
        {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10 rounded-xl">
                 <div className="flex flex-col items-center gap-4">
                     <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                     <p className="text-white font-medium">Scanning folders...</p>
                 </div>
            </div>
        ) : displayItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-neutral-900/50 rounded-xl border border-dashed border-neutral-800">
                <FolderOpen size={48} className="text-neutral-700 mb-4" />
                <h3 className="text-xl font-bold text-neutral-400">No Comics Found</h3>
                <p className="text-neutral-600 max-w-sm">
                    We couldn't find any image folders or series in your linked locations. 
                </p>
            </div>
        ) : (
            <ShelfView allSeries={displayItems} onOpenItem={handleOpenItem} />
        )}
        </div>
        
        {/* Import Modal */}
        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportFolder={handleSelectLibrary}
          onImportWeb={handleAddWebLink}
        />
    </div>
  );
};
