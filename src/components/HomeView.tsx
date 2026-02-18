import { useEffect, useState, useMemo } from 'react';
import { useLibraryStore } from '../stores/useLibraryStore';
import { useReadingStore } from '../stores/useReadingStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useVideoStore } from '../stores/useVideoStore';
import { motion } from 'framer-motion';
import { Play, Clock, Sparkles, PlusCircle, ArrowRight, Film } from 'lucide-react';
import { MangaCard } from './library/MangaCard';
import { Button } from './ui/Button';
import { convertFileSrc } from '@tauri-apps/api/core';

export const HomeView = () => {
    const { series, setLoading } = useLibraryStore();
    const { openFolder } = useReadingStore();
    const { currentVideo } = useVideoStore();
    const { setActiveView } = useSettingsStore();

    const [continueReading, setContinueReading] = useState<any[]>([]);

    useEffect(() => {
        loadRecentHistory();
    }, [series]);

    const loadRecentHistory = async () => {
        try {
            const { getDb } = await import('../services/db');
            const db = getDb();
            const history = await db.select<any[]>(`
                SELECT rp.*, c.title, s.coverPath as cover, c.filePath, s.title as seriesTitle
                FROM ReadingProgress rp
                JOIN Chapters c ON rp.chapterId = c.id
                JOIN Series s ON rp.seriesId = s.id
                ORDER BY rp.lastReadAt DESC
                LIMIT 12
            `);
            
            // Filter out completed items and limit to 6 for the V3 grid
            const activeReading = history.filter(item => {
                if (!item.totalPages || item.totalPages === 0) return true;
                return item.currentPage < item.totalPages;
            }).slice(0, 6);

            setContinueReading(activeReading);
        } catch (e) {
            console.error("Failed to load home history", e);
        }
    };

    const recentlyAdded = useMemo(() => {
        return [...series]
            .sort((a, b) => (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime()))
            .slice(0, 6);
    }, [series]);

    const handleOpenItem = async (item: any) => {
        if ('books' in item) {
            setActiveView('library');
        } else {
            try {
                setLoading(true);
                await openFolder(item.filePath || item.path, item.seriesId, item.chapterId || item.id);
            } catch (err) {
                console.error("Failed to open content", err);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="h-full overflow-y-auto no-scrollbar pb-24">
            {/* Hero Section */}
            <div className="relative h-[500px] w-full mb-12 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
                
                {/* Hero Background Image */}
                {series[0]?.cover ? (
                    <img 
                        src={convertFileSrc(series[0].cover)} 
                        className="w-full h-full object-cover blur-sm opacity-20 scale-110" 
                        alt="Hero background"
                    />
                ) : (
                    <div className="w-full h-full bg-accent/5 backdrop-blur-3xl" />
                )}

                <div className="absolute inset-0 z-20 flex flex-col justify-end p-16 max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-2 text-accent font-black text-[10px] uppercase tracking-[0.5em]">
                             <Sparkles size={14} /> SYSTEM STATUS: OPTIMAL
                        </div>
                        <h1 className="text-7xl md:text-9xl font-black text-white leading-none tracking-tighter uppercase italic">
                            Experience <br /> <span className="text-accent underline decoration-8 underline-offset-[12px] decoration-accent/30">Immersion</span>
                        </h1>
                        <p className="text-neutral-500 font-black max-w-xl text-xs leading-relaxed uppercase tracking-[0.2em] opacity-80">
                            Your curated archive of visual narratives. Seamlessly synchronized and enhanced with the all-new V3 core.
                        </p>
                        <div className="flex items-center gap-4 pt-6">
                            <Button size="lg" className="shadow-2xl shadow-accent/30 hover:scale-105" onClick={() => setActiveView('library')}>
                                <Play size={20} fill="currentColor" className="mr-2" /> Start Reading
                            </Button>
                            <Button variant="secondary" size="lg" className="bg-white/5 border-white/10 hover:bg-white/10" onClick={() => setActiveView('videos')}>
                                Watch Media
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Content Sections */}
            <div className="px-16 space-y-24">
                {/* Continue Reading */}
                {continueReading.length > 0 && (
                    <section className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-lg shadow-accent/5">
                                    <Clock size={20} />
                                </div>
                                <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Resume Session</h2>
                            </div>
                            <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-white font-black uppercase tracking-widest text-[10px]" onClick={() => setActiveView('library')}>
                                HISTORY <ArrowRight size={14} className="ml-2" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                            {continueReading.map((book) => (
                                <MangaCard 
                                    key={book.id} 
                                    item={book} 
                                    onClick={() => handleOpenItem(book)} 
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Recently Added */}
                <section className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shadow-lg shadow-purple-500/5">
                                <PlusCircle size={20} />
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Latest Indexing</h2>
                        </div>
                        <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-white font-black uppercase tracking-widest text-[10px]" onClick={() => setActiveView('library')}>
                            FULL ARCHIVE <ArrowRight size={14} className="ml-2" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                        {recentlyAdded.map((item) => (
                            <MangaCard 
                                key={item.id} 
                                item={item} 
                                onClick={() => handleOpenItem(item)} 
                                density="comfortable"
                            />
                        ))}
                        {recentlyAdded.length === 0 && (
                             <div className="col-span-full py-24 border-2 border-dashed border-white/5 rounded-[48px] flex flex-col items-center justify-center text-neutral-700 gap-6 bg-white/[0.01]">
                                <div className="w-20 h-20 rounded-[32px] bg-white/5 flex items-center justify-center">
                                    <PlusCircle size={40} className="opacity-20" />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="font-black uppercase tracking-[0.3em] text-xs">No media detected</p>
                                    <p className="text-[10px] font-bold text-neutral-800 uppercase tracking-widest">Link a source folder to begin</p>
                                </div>
                                <Button variant="secondary" size="md" onClick={() => setActiveView('library')}>Initialize Setup</Button>
                             </div>
                        )}
                    </div>
                </section>

                {/* Quick Video Section if currentVideo */}
                {currentVideo && (
                    <section className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/5">
                                <Film size={20} />
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Active Screening</h2>
                        </div>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            className="relative group cursor-pointer overflow-hidden rounded-[40px] border border-white/5 bg-neutral-900 aspect-[21/9] shadow-2xl"
                            onClick={() => setActiveView('videos')}
                        >
                            <img 
                                src={currentVideo.thumbnailPath ? convertFileSrc(currentVideo.thumbnailPath) : ''} 
                                className="w-full h-full object-cover opacity-40 group-hover:scale-105 group-hover:opacity-60 transition-all duration-1000"
                                alt="Video thumbnail"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
                            <div className="absolute inset-x-0 bottom-0 p-12 z-20 flex items-end justify-between">
                                <div className="space-y-2">
                                    <span className="text-red-500 font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> IN PROGRESS
                                    </span>
                                    <h3 className="text-4xl font-black text-white uppercase italic">{currentVideo.title}</h3>
                                    <p className="text-neutral-500 font-bold uppercase text-xs tracking-widest">{currentVideo.resolution} Stream • 02:45 remaining</p>
                                </div>
                                <div className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl shadow-white/20 transform group-hover:scale-110 transition-transform">
                                    <Play size={32} fill="currentColor" className="ml-1" />
                                </div>
                            </div>
                        </motion.div>
                    </section>
                )}

                {/* Categories / Genre Flow */}
                <section className="space-y-10 pb-20">
                     <div className="flex items-center gap-6">
                        <span className="text-neutral-700 font-black text-[10px] uppercase tracking-[0.5em] flex-shrink-0">Filter By Genre</span>
                        <div className="h-px bg-neutral-900 flex-1" />
                     </div>
                     <div className="flex flex-wrap gap-4">
                        {['Action', 'Adventure', 'Seinen', 'Shonen', 'Horror', 'Sci-Fi', 'Mystery', 'Slice of Life', 'Fantasy', 'Psychological', 'Thriller'].map(tag => (
                            <button 
                                key={tag}
                                className="px-8 py-4 rounded-[20px] bg-white/[0.02] border border-white/5 text-neutral-500 font-black text-[11px] uppercase tracking-[0.15em] hover:bg-accent hover:text-white hover:border-accent hover:shadow-2xl hover:shadow-accent/40 transition-all active:scale-95 duration-300"
                            >
                                {tag}
                            </button>
                        ))}
                     </div>
                </section>
            </div>
        </div>
    );
};
