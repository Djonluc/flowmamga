
import { useLibraryStore } from '../stores/useLibraryStore';
import { useReadingStore } from '../stores/useReadingStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { motion } from 'framer-motion';
import { Play, Clock, Library as LibraryIcon, ChevronRight, MonitorPlay } from 'lucide-react';
import { detectSource, downloadChapterPages } from '../utils/webScrapers';
import { DjonStNixSignature, DjonStNixLogo } from './branding';

export const HomeView = () => {
    const { series, recentBooks, addToRecent, setLoading } = useLibraryStore();
    const { openFolder } = useReadingStore();
    const { setActiveView } = useSettingsStore();

    const handleOpenBook = async (book: any) => {
        addToRecent(book);
        
        if (book.path.startsWith('http')) {
            setLoading(true);
            try {
                const source = detectSource(book.path) || 'nHentai';
                const pages = await downloadChapterPages(book.path, source);
                if (pages && pages.length > 0) {
                    openFolder(book.path, pages.map((p: any) => p.imageUrl));
                }
            } catch (err) {
                console.error("Failed to open web book", err);
            } finally {
                setLoading(false);
            }
            return;
        }

        if (!window.electron) return;
        try {
            setLoading(true);
            const images = await window.electron.readFolder(book.path);
            if (images && images.length > 0) {
                openFolder(book.path, images);
            }
        } catch (err) {
            console.error("Failed to open book", err);
        } finally {
            setLoading(false);
        }
    };

    // Prepare collage images from all books in available series
    const collageCovers = series
        .flatMap(s => s?.books || [])
        .filter(b => b?.cover)
        .slice(0, 24);

    return (
        <div className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar bg-neutral-950 text-white relative">
            {/* Hero Section with Collage Background */}
            <div className="relative h-[500px] w-full flex items-center justify-center overflow-hidden">
                {/* Collage Background */}
                <div className="absolute inset-0 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 p-2 opacity-20 blur-[2px] scale-105 pointer-events-none">
                    {collageCovers.map((book, i) => (
                        <div key={i} className="aspect-[2/3] bg-neutral-800 rounded overflow-hidden">
                            <img 
                                src={book.cover?.startsWith('http') ? book.cover : `media:///${book.cover}`} 
                                className="w-full h-full object-cover"
                                alt=""
                            />
                        </div>
                    ))}
                    {/* Fillers if not enough books */}
                    {Array.from({ length: Math.max(0, 24 - collageCovers.length) }).map((_, i) => (
                        <div key={`filler-${i}`} className="aspect-[2/3] bg-neutral-900/50 rounded" />
                    ))}
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-neutral-950/80 to-neutral-950" />

                {/* Hero Content */}
                <div className="relative z-10 text-center space-y-4 px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-2"
                    >
                        Welcome Back
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-8xl font-black tracking-tighter bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent drop-shadow-2xl"
                    >
                        Read Manga the Way It Was Meant to Feel.
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-neutral-400 text-lg max-w-2xl mx-auto font-medium"
                    >
                        FlowManga transforms your local collection into a cinematic, immersive reading experience.
                    </motion.p>
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center justify-center gap-4 pt-4"
                    >
                        <button 
                            onClick={() => setActiveView('library')}
                            className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2 shadow-xl shadow-white/5"
                        >
                            <LibraryIcon size={20} />
                            Go to Library
                        </button>
                        {recentBooks.length > 0 && (
                            <button 
                                onClick={() => handleOpenBook(recentBooks[0])}
                                className="px-8 py-3 bg-neutral-800 text-white font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2 border border-white/10"
                            >
                                <Play size={20} fill="currentColor" />
                                Resume Last
                            </button>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-8 py-12 space-y-16">
                
                {/* Recently Read Shelf */}
                {recentBooks.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-8 px-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Recently Read</h2>
                                    <p className="text-xs text-neutral-500">Pick up right where you left off</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setActiveView('library')}
                                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                            >
                                VIEW ALL <ChevronRight size={14} />
                            </button>
                        </div>

                        {/* Shelf UI */}
                        <div className="relative group">
                            {/* Shelf Base */}
                            <div className="absolute -bottom-4 left-0 right-0 h-4 bg-white/5 rounded-full blur-xl opacity-50" />
                            
                            <div className="flex gap-8 overflow-x-auto pb-8 pt-4 px-4 custom-scrollbar">
                                {recentBooks.map((book) => (
                                    <motion.div 
                                        key={book.path}
                                        whileHover={{ y: -10, scale: 1.05 }}
                                        onClick={() => handleOpenBook(book)}
                                        className="flex-shrink-0 w-48 cursor-pointer relative"
                                    >
                                        <div className="aspect-[2/3] bg-neutral-800 rounded-xl overflow-hidden shadow-2xl border border-white/5 group-hover:border-blue-500/50 transition-colors">
                                            {book.cover ? (
                                                <img 
                                                    src={book.cover.startsWith('http') ? book.cover : `media:///${book.cover}`} 
                                                    className="w-full h-full object-cover"
                                                    alt={book.title}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-neutral-600 bg-neutral-900">
                                                    <LibraryIcon size={48} />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                                <h3 className="text-sm font-bold text-white truncate drop-shadow-lg">{book.title}</h3>
                                                {book.meta?.chapter && (
                                                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mt-1">
                                                        Chapter {book.meta.chapter}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Feature Highlights */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <MonitorPlay size={24} />
                        </div>
                        <h3 className="text-xl font-bold">Reading Should Flow</h3>
                        <p className="text-sm text-neutral-500 leading-relaxed">
                            Switch between Vertical scroll, Page flip, or Slideshow mode. Auto-scroll with zero distractions.
                        </p>
                    </div>

                    <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <LibraryIcon size={24} />
                        </div>
                        <h3 className="text-xl font-bold">Built for Collectors</h3>
                        <p className="text-sm text-neutral-500 leading-relaxed">
                            Link multiple folders across your PC. All content appears in one merged, high-performance view.
                        </p>
                    </div>

                    <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-400">
                            <Clock size={24} />
                        </div>
                        <h3 className="text-xl font-bold">More Than Pages</h3>
                        <p className="text-sm text-neutral-500 leading-relaxed">
                            Watch the UI adapt to your page colors while listening to Rain, Lo-Fi, or Nature ambience.
                        </p>
                    </div>
                </section>

                {/* Roadmap Preview */}
                <section className="pt-12 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-8">
                         <div className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-widest">
                            The Roadmap
                        </div>
                        <h2 className="text-3xl font-black">Building the Future</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { phase: 'Phase 3', title: 'Smart Library Intelligence', note: 'AI metadata, auto volume grouping, and fuzzy search engine.', active: true },
                            { phase: 'Phase 4', title: 'Gamification Layer', note: 'Achievements, streak leaderboards, and unlockable UI themes.', active: false },
                            { phase: 'Phase 5', title: 'Ecosystem Expansion', note: 'Cloud sync, multi-device progress, and plugin system.', active: false },
                            { phase: 'Future', title: 'Wild Ideas', note: 'AI panel zoom, voice control, and reading clubs.', active: false },
                        ].map((p) => (
                            <div key={p.phase} className="p-6 rounded-2xl bg-neutral-900/50 border border-white/5 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-neutral-500 uppercase">{p.phase}</span>
                                    {p.active && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                                </div>
                                <h4 className="font-bold text-white">{p.title}</h4>
                                <p className="text-xs text-neutral-500">{p.note}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Creator Signature Section */}
                <section className="pt-16 pb-8 border-t border-white/5">
                    <div className="flex flex-col items-center gap-8">
                        <DjonStNixLogo className="opacity-80 hover:opacity-100 transition-opacity" />
                        <p className="text-xs text-neutral-500 text-center max-w-md">
                            FlowManga is crafted with passion for the manga community. 
                            Built using modern web technologies and designed for an immersive reading experience.
                        </p>
                    </div>
                </section>
            </div>

            {/* Floating Signature */}
            <DjonStNixSignature />
        </div>
    );
};
