import { create } from 'zustand';
import { ScraperService, type ScrapedImage, type ScrapeResult } from '../services/ScraperService';
import { open } from '@tauri-apps/plugin-dialog';
import { useSettingsStore } from './useSettingsStore';

interface ScraperState {
    url: string;
    isScraping: boolean;
    isDownloading: boolean;
    scrapedImages: ScrapedImage[];
    metadata: ScrapeResult['metadata'] & { author?: string, tags?: string[] } | null;
    chapterFeed: any[];
    selectedChapterKeys: string[]; 
    estimatedSize: string; // Dynamic Size Estimation
    progress: number;
    error: string | null;
    downloadPath: string | null;
    failedCount: number;
    
    setUrl: (url: string) => void;
    scrape: () => Promise<void>;
    download: () => Promise<void>;
    setSelectedChapters: (keys: string[]) => void;
    reset: () => void;
}

export const useScraperStore = create<ScraperState>((set, get) => ({
    url: '',
    isScraping: false,
    isDownloading: false,
    scrapedImages: [],
    metadata: null,
    chapterFeed: [],
    selectedChapterKeys: [],
    estimatedSize: '0 MB',
    progress: 0,
    error: null,
    downloadPath: null,
    failedCount: 0,
    
    setUrl: (url) => set({ url, error: null }),
    
    scrape: async () => {
        const { url } = get();
        if (!url) return;
        
        set({ isScraping: true, error: null, scrapedImages: [], metadata: null, chapterFeed: [], selectedChapterKeys: [] });
        
        try {
            const result = await ScraperService.scrapeChapter(url);
            
            // If it's MangaDex and we have a mangaId, fetch the feed
            let feed: any[] = [];
            if (result.metadata?.mangaId) {
                feed = await ScraperService.getChapterFeed(result.metadata.mangaId);
            }

            // Smart Selection: Check Library for existing chapters
            let defaultSelection: string[] = [];
            
            // Get Library State
            const { useLibraryStore } = await import('./useLibraryStore');
            const librarySeries = useLibraryStore.getState().series.find(s => s.id === result.metadata?.mangaId);
            
            if (feed.length > 0) {
                if (librarySeries) {
                    // Create set of existing chapter identifiers (numbers)
                    // Note: Library 'books' have 'meta.chapter' (string)
                    const existingChapterNums = new Set(librarySeries.books.map(b => b.meta.chapter));
                    
                    // Filter feed for chapters NOT in library
                    // We match by chapter number attribute
                    const newChapters = feed.filter(c => !existingChapterNums.has(c.attributes.chapter));
                    
                    if (newChapters.length > 0) {
                        // Select all NEW chapters? Or just the latest new one?
                        // User usually wants to download "the updates".
                        // Let's select ALL new chapters by default if it's an update.
                        // But if it's a huge list, maybe just the latest?
                        // "Download new chapters?" usually implies "catch up".
                        // Let's select the *latest* new chapter by default to be safe/conservative,
                        // or maybe the last 3? 
                        // Let's stick to: "Select the latest one that is missing"
                         defaultSelection = [newChapters[newChapters.length - 1].id];
                    } else {
                        // All downloaded? Select nothing? Or just standard latest behavior?
                        // Select nothing implies "Up to date".
                        defaultSelection = [];
                    }
                } else {
                    // New Series: Default to latest (end of list)
                    defaultSelection = [feed[feed.length - 1].id];
                }
            }

            set({ 
                scrapedImages: result.images, 
                metadata: result.metadata as any,
                chapterFeed: feed,
                selectedChapterKeys: defaultSelection,
                isScraping: false 
            });
            
            get().setSelectedChapters(defaultSelection);
        } catch (err) {
            set({ 
                error: (err as Error).message || 'Failed to scrape URL',
                isScraping: false 
            });
        }
    },

    setSelectedChapters: (keys) => {
        const { chapterFeed } = get();
        const selected = chapterFeed.filter(c => keys.includes(c.id));
        
        // Estimate: ~400KB per page, average 25 pages per chapter
        // Or better: count pages if we have them (MangaDex has data length in some contexts but not feed)
        // Let's assume 10MB per chapter.
        const estMB = selected.length * 10;
        const sizeStr = estMB > 1024 ? `${(estMB / 1024).toFixed(1)} GB` : `${estMB} MB`;
        
        set({ selectedChapterKeys: keys, estimatedSize: sizeStr });
    },
    
    download: async () => {
        const { scrapedImages, metadata, chapterFeed, selectedChapterKeys } = get();
        if (!metadata || (scrapedImages.length === 0 && selectedChapterKeys.length === 0)) return;
        
        // 1. Get or Pick Base Directory (Centralized Library)
        let libraryPath = useSettingsStore.getState().libraryPath;
        if (!libraryPath) {
            const selectedDir = await open({
                directory: true,
                multiple: false,
                title: 'Select your Main Manga Library folder',
            });
            
            if (!selectedDir || Array.isArray(selectedDir)) {
                return;
            }
            libraryPath = selectedDir;
            useSettingsStore.getState().setLibraryPath(libraryPath);
        }
        
        set({ downloadPath: libraryPath });

        // 2. Prepare Data
        const safeTitle = ScraperService.sanitizeFilename(metadata.title || 'Unknown');
        const mangaRoot = `${libraryPath}/${safeTitle}`;
        
        const chaptersToDownload = chapterFeed.filter(c => selectedChapterKeys.includes(c.id));
        
        // Handle Manual Chapter (Scraped directly without feed)
        if (chaptersToDownload.length === 0 && scrapedImages.length > 0) {
                chaptersToDownload.push({ 
                id: 'manual', 
                attributes: { chapter: metadata.chapterTitle || '1' },
                isManual: true,
                images: scrapedImages // Pass the scraped images directly
                });
        }

        // 3. Queue Job
        const { useDownloadStore } = await import('./useDownloadStore');
        
        // Enhance Metadata for Tracking
        const trackingMetadata = {
            ...metadata,
            source: {
                provider: 'mangadex', // TODO: Detect provider if multi-source
                url: get().url, // Capture current URL
                mangaId: metadata.mangaId
            },
            tracked: true,
            autoUpdate: true,
            lastChecked: new Date().toISOString()
        };

        useDownloadStore.getState().addJob({
            id: `${metadata.mangaId || Math.random().toString(36).substr(2, 9)}`,
            title: metadata.title || 'Unknown Series',
            coverUrl: metadata.coverUrl,
            totalChapters: chaptersToDownload.length,
            metadata: trackingMetadata,
            chapterList: chaptersToDownload,
            path: mangaRoot
        });

        // 4. Reset & Notify
        set({
            isDownloading: false,
            scrapedImages: [], // Clear memory
            metadata: null,
            chapterFeed: [],
            selectedChapterKeys: [],
            error: null
        });
        
        // Optional: Trigger UI notification here if we had a toast system
    },
    
    reset: () => set({ 
        url: '', 
        isScraping: false, 
        isDownloading: false, 
        scrapedImages: [], 
        metadata: null,
        chapterFeed: [],
        selectedChapterKeys: [],
        estimatedSize: '0 MB',
        progress: 0, 
        error: null,
        downloadPath: null,
        failedCount: 0
    }),
}));
