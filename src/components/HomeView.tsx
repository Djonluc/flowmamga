import { useEffect, useState, useMemo } from 'react';
import { useLibraryStore } from '../stores/useLibraryStore';
import { useReadingStore } from '../stores/useReadingStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useVideoStore } from '../stores/useVideoStore';
import { motion } from 'framer-motion';
import { Clock, Sparkles, PlusCircle, Play, Film, Zap } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { FeaturedCarousel } from './home/FeaturedCarousel';
import { HorizontalRail } from './home/HorizontalRail';

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
            
            const activeReading = history.filter(item => {
                if (!item.totalPages || item.totalPages === 0) return true;
                return item.currentPage < item.totalPages;
            });

            setContinueReading(activeReading);
        } catch (e) {
            console.error("Failed to load home history", e);
        }
    };

    const recentlyAdded = useMemo(() => {
        return [...series]
            .sort((a, b) => (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime()))
            .slice(0, 12); // Increased for rail
    }, [series]);

    const recentlyUpdated = useMemo(() => {
        return [...series]
            .sort((a, b) => (new Date(b.updatedAt || 0).getTime()) - (new Date(a.updatedAt || 0).getTime()))
            .slice(0, 12);
    }, [series]);

    const discoveryItems = useMemo(() => {
        if (series.length < 5) return [];
        return [...series].sort(() => 0.5 - Math.random()).slice(0, 12);
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
        <div className="h-full overflow-y-auto no-scrollbar pb-32 bg-transparent">
            
            <FeaturedCarousel />

            <div className="space-y-16">
                {/* Continue Reading Rail */}
                {continueReading.length > 0 && (
                    <HorizontalRail 
                        title="Resume Session"
                        icon={<Clock size={20} />}
                        items={continueReading}
                        onItemClick={handleOpenItem}
                        onViewAll={() => setActiveView('library')}
                        accentColor="text-accent"
                    />
                )}

                {/* Recently Added Rail */}
                <HorizontalRail 
                    title="Recently Added"
                    icon={<PlusCircle size={20} />}
                    items={recentlyAdded}
                    onItemClick={async (item) => {
                         if ('books' in item) {
                            useLibraryStore.getState().setSelectedSeriesId(item.id);
                            setActiveView('library');
                        } else {
                            handleOpenItem(item);
                        }
                    }}
                    onViewAll={() => setActiveView('library')}
                    accentColor="text-purple-500"
                    emptyMessage="Link a source folder to populate your library."
                />

                {/* Discovery / Suggestions Rail */}
                {discoveryItems.length > 0 && (
                     <HorizontalRail 
                        title="Discover"
                        icon={<Sparkles size={20} />}
                        items={discoveryItems}
                        onItemClick={handleOpenItem}
                        accentColor="text-yellow-500"
                    />
                )}

                {/* Recently Updated Rail */}
                {recentlyUpdated.length > 0 && (
                    <HorizontalRail 
                        title="Recently Updated"
                        icon={<Zap size={20} />}
                        items={recentlyUpdated}
                        onItemClick={async (item) => {
                             if ('books' in item) {
                                useLibraryStore.getState().setSelectedSeriesId(item.id);
                                setActiveView('library');
                            } else {
                                handleOpenItem(item);
                            }
                        }}
                        onViewAll={() => setActiveView('library')}
                        accentColor="text-blue-500"
                    />
                )}

                {/* Active Video (Kept as specialized section) */}
                {currentVideo && (
                    <section className="px-16 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/5">
                                <Film size={20} />
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Active Screening</h2>
                        </div>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            className="relative group cursor-pointer overflow-hidden rounded-[40px] border border-white/5 bg-neutral-900 aspect-[21/9] shadow-2xl max-w-4xl"
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
                                    <p className="text-neutral-500 font-bold uppercase text-xs tracking-widest">{currentVideo.resolution} Stream</p>
                                </div>
                                <div className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl shadow-white/20 transform group-hover:scale-110 transition-transform">
                                    <Play size={32} fill="currentColor" className="ml-1" />
                                </div>
                            </div>
                        </motion.div>
                    </section>
                )}

                {/* Sources & Categories */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 px-16 pb-20">
                     {/* Supported Sources */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-lg shadow-orange-500/5">
                                <Zap size={20} />
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Active Transmitters</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => window.open('https://mangadex.org', '_blank')}
                                className="p-6 rounded-[32px] bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-all w-full"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[16px] bg-[#FF6740] p-3 shadow-xl shadow-orange-600/20 flex-shrink-0">
                                        <img src="https://mangadex.org/favicon.ico" className="w-full h-full object-contain brightness-200" alt="MangaDex" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-black text-white uppercase italic">MangaDex</h3>
                                        <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">Digital Library</p>
                                    </div>
                                </div>
                            </motion.button>
                        </div>
                    </section>

                    {/* Categories */}
                    <section className="space-y-8">
                         <div className="flex items-center gap-6">
                            <span className="text-neutral-700 font-black text-[10px] uppercase tracking-[0.5em] flex-shrink-0">Filter By Genre</span>
                            <div className="h-px bg-neutral-900 flex-1" />
                         </div>
                         <div className="flex flex-wrap gap-3">
                            {['Action', 'Adventure', 'Seinen', 'Shonen', 'Horror', 'Sci-Fi', 'Mystery', 'Slice of Life', 'Fantasy', 'Psychological', 'Thriller'].map(tag => (
                                <button 
                                    key={tag}
                                    onClick={() => {
                                        useLibraryStore.getState().setFilterGenre(tag);
                                        useSettingsStore.getState().setActiveView('library');
                                    }}
                                    className="px-6 py-3 rounded-[16px] bg-white/[0.02] border border-white/5 text-neutral-500 font-black text-[10px] uppercase tracking-[0.15em] hover:bg-accent hover:text-white hover:border-accent hover:shadow-xl hover:shadow-accent/30 transition-all active:scale-95 duration-200"
                                >
                                    {tag}
                                </button>
                            ))}
                         </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
