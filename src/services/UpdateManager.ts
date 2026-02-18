import { useLibraryStore } from '../stores/useLibraryStore';
import { useDownloadStore } from '../stores/useDownloadStore';
import { ScraperService } from './ScraperService';
import { readTextFile } from '@tauri-apps/plugin-fs';

export class UpdateManager {
    static async checkForUpdates(seriesId: string) {
        const library = useLibraryStore.getState();
        const series = library.series.find(s => s.id === seriesId);
        if (!series) return 0;

        console.log(`[UpdateManager] Checking updates for ${series.title}...`);

        try {
            // 1. Load Metadata
            let metadata;
            try {
                const content = await readTextFile(`${series.path}/metadata.json`);
                metadata = JSON.parse(content);
            } catch (e) {
                console.warn(`[UpdateManager] No metadata found for ${series.id}`);
                return 0;
            }

            if (!metadata.source?.mangaId || metadata.source.provider !== 'mangadex') {
               console.log(`[UpdateManager] Skipping non-mangadex series: ${series.title}`);
               return 0; 
            }

            // 2. Fetch Remote Feed
            const remoteFeed = await ScraperService.getChapterFeed(metadata.source.mangaId);
            
            // 3. Determine Highest Local Chapter
            const localChapters = series.books.map(b => {
                const num = parseFloat(b.meta.chapter || '0');
                return isNaN(num) ? 0 : num;
            });
            const maxLocal = Math.max(0, ...localChapters);

            console.log(`[UpdateManager] Max Local: ${maxLocal}. Remote Feed: ${remoteFeed.length} chapters.`);

            // 4. Find Missing Chapters
            const missingChapters = remoteFeed.filter(remote => {
                const remoteNum = parseFloat(remote.attributes.chapter || '0');
                return remoteNum > maxLocal && !isNaN(remoteNum);
            });

            if (missingChapters.length === 0) {
                console.log(`[UpdateManager] ${series.title} is up to date.`);
                return 0;
            }

            console.log(`[UpdateManager] Found ${missingChapters.length} new chapters for ${series.title}`);

            // 5. Queue Download Job
            const updateJob: any = {
                id: `${metadata.source.mangaId}-update-${Date.now()}`,
                title: `Update: ${series.title}`,
                coverUrl: series.cover || undefined,
                totalChapters: missingChapters.length,
                metadata: {
                    ...metadata,
                    lastChecked: new Date().toISOString(),
                },
                chapterList: missingChapters, 
                path: series.path
            };

            useDownloadStore.getState().addJob(updateJob);
            return missingChapters.length;

        } catch (error) {
            console.error(`[UpdateManager] Failed to update ${series.title}:`, error);
            return -1;
        }
    }

    static async checkAllTracked() {
        const library = useLibraryStore.getState();
        // Since we don't have 'tracked' in DB yet, we can check all mangadex ones
        // Or strictly ones with `metadata.tracked = true`. 
        // Checking file IO for every series is heavy.
        // For now, let's just loop all series that look like mangadex?
        // Or maybe just let user trigger specific ones.
        // User asked for "Background Auto Check".
        // Ideally we upgrade DB to store `tracked` flag.
        
        // Let's iterate all series and try to read metadata (chunked/throttled).
        for (const series of library.series) {
            await this.checkForUpdates(series.id);
            // Throttle
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}
