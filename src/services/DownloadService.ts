import { invoke } from '@tauri-apps/api/core';
import { writeTextFile, mkdir } from '@tauri-apps/plugin-fs';
import { type DownloadJob } from '../types';
import { useDownloadStore } from '../stores/useDownloadStore';

export class DownloadService {
    
    // Main Worker Function
    static async processJob(job: DownloadJob) {
        const store = useDownloadStore.getState();
        const { metadata, chapterList, path: mangaRoot } = job;
        let totalDownloaded = job.downloadedChapters || 0;

        try {
            // 1. Prepare Root Skeleton
            await mkdir(mangaRoot, { recursive: true });
            await mkdir(`${mangaRoot}/chapters`, { recursive: true });

            // 2. Cover Logic (Idempotent)
            if (metadata.coverUrl && !metadata.coverFile) {
                try {
                    const coverPath = `${mangaRoot}/cover.jpg`;
                    await invoke('download_image', {
                        url: metadata.coverUrl,
                        filePath: coverPath 
                    });
                    metadata.coverFile = 'cover.jpg';
                    // Update job metadata in store just in case we pause/resume
                    // (Actually we don't update job payload in store easily, but that's fine for now)
                } catch (e) {
                    console.warn(`[Download] Cover download failed: ${e}`);
                }
            }

            // 3. Initial Metadata Write
            await this.writeMetadata(mangaRoot, metadata, job.totalChapters);

            // 4. Determine Remaining Chapters
            // We rely on `downloadedChapters` to skip completed ones if implementing resume at chapter level
            // Ideally `chapterList` is ordered.
            const remainingChapters = chapterList.slice(totalDownloaded);

            for (const chapter of remainingChapters) {
                // Check Paused State
                if (useDownloadStore.getState().queue.find(j => j.id === job.id)?.status === 'paused') {
                    console.log(`[Download] Job ${job.id} paused.`);
                    return; 
                }

                try {
                    await this.downloadChapter(chapter, mangaRoot, job.id);
                    totalDownloaded++;
                    
                    // Update Progress
                    const progress = Math.min(100, Math.round((totalDownloaded / job.totalChapters) * 100));
                    store.updateJobProgress(job.id, progress, totalDownloaded);
                    
                } catch (err) {
                    console.error(`[Download] Failed chapter ${chapter.id}`, err);
                    // Continue to next chapter? Or fail job?
                    // User probably wants to continue best-effort.
                }
            }

            // 5. Finalize
            await this.writeMetadata(mangaRoot, metadata, job.totalChapters);
            store.updateJobStatus(job.id, 'completed');
            
            // Register with Library
            import('../stores/useLibraryStore').then(({ useLibraryStore }) => {
                 useLibraryStore.getState().scanLibrary(); 
            });

        } catch (error) {
            console.error(`[Download] Job ${job.id} failed:`, error);
            store.updateJobStatus(job.id, 'failed');
            // Do not re-throw, we handled it.
        }
    }

    private static async downloadChapter(chapter: any, mangaRoot: string, jobId: string) {
        // 1. Folder Name Logic
        let chapterNumStr = chapter.attributes?.chapter || '1';
        let chapterFolder = chapterNumStr.padStart(3, '0');
        
        // Sanitization mirroring ScraperService
        if (!chapterFolder.includes('.') && chapterFolder.length < 3) {
             chapterFolder = chapterFolder.padStart(3, '0');
        } else if (!isNaN(parseFloat(chapterNumStr))) {
             if (chapterNumStr.indexOf('.') === -1) {
                 chapterFolder = chapterNumStr.padStart(3, '0');
             }
        }
        
        const chapterDir = `${mangaRoot}/chapters/${chapterFolder}`;
        await mkdir(chapterDir, { recursive: true });

        // 2. Fetch/Prepare Pages
        let images: { url: string; pageNumber: number }[] = [];
        
        if (chapter.isManual && chapter.images) {
            // Manual Scrape (passed images)
            images = chapter.images;
        } else {
            // Mangadex API
            try {
                const chapRes = await fetch(`https://api.mangadex.org/at-home/server/${chapter.id}`);
                const atHome = await chapRes.json();
                if (atHome.result === 'ok') {
                    const { baseUrl, chapter: chData } = atHome;
                    images = chData.data.map((file: string, index: number) => ({
                        url: `${baseUrl}/data/${chData.hash}/${file}`,
                        pageNumber: index + 1
                    }));
                } else {
                    throw new Error(`Mangadex API Error: ${atHome.result}`);
                }
            } catch (e) {
                console.error("Failed to fetch chapter data", e);
                throw e;
            }
        }

        if (images.length === 0) return;

        // 3. Download Pages (Concurrency: 3)
        const concurrency = 3;
        const chunks = [];
        for (let i = 0; i < images.length; i += concurrency) {
            chunks.push(images.slice(i, i + concurrency));
        }

        for (const chunk of chunks) {
            // Check pause between chunks
             if (useDownloadStore.getState().queue.find(j => j.id === jobId)?.status === 'paused') {
                 throw new Error("Job Paused"); // Interrupt chapter
             }

            await Promise.all(chunk.map(async (img) => {
                const fileName = `${img.pageNumber.toString().padStart(3, '0')}.jpg`;
                const filePath = `${chapterDir}/${fileName}`;
                try {
                    // Check if exists first? Overwrite for now.
                    await invoke('download_image', {
                        url: img.url,
                        filePath: filePath,
                    });
                } catch (e) {
                    console.error(`Failed to download ${fileName}`, e);
                    // Single page failure shouldn't fail whole chapter?
                }
            }));
        }
    }

    private static async writeMetadata(mangaRoot: string, metadata: any, totalChapters: number) {
         try {
             // Calculate highest chapter from the current job's list if available
             // This is a heuristic; ideally we scan the folder or DB
             // But for now, let's rely on the metadata passed which should be latest from scraper
             
             const safeMeta = {
                title: metadata.title || 'Unknown Series',
                displayTitle: metadata.displayTitle || metadata.title,
                description: metadata.description || '',
                author: metadata.author || 'Unknown',
                tags: metadata.tags || [],
                mangaId: metadata.mangaId || 'local',
                coverFile: metadata.coverFile,
                
                // Tracking Fields
                source: metadata.source || { provider: 'mangadex', mangaId: metadata.mangaId },
                tracked: metadata.tracked ?? false,
                autoUpdate: metadata.autoUpdate ?? false,
                lastChecked: metadata.lastChecked || new Date().toISOString(),
                
                lastDownloadedChapter: metadata.lastDownloadedChapter, // Should be updated by processJob?

                totalChapters: totalChapters,
                version: 2.1,
                downloadedAt: metadata.downloadedAt || new Date().toISOString() // Preserve original if passed
            };
            
            await writeTextFile(`${mangaRoot}/metadata.json`, JSON.stringify(safeMeta, null, 2));
         } catch (e) {
             console.error("Failed to write metadata", e);
         }
    }
}
