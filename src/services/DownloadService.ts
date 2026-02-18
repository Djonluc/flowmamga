import { invoke } from '@tauri-apps/api/core';
import { readTextFile, writeTextFile, mkdir } from '@tauri-apps/plugin-fs';
import { type DownloadJob } from '../types';

export class DownloadService {
    
    // Main Worker Function
    static async processJob(job: DownloadJob, store: any) {
        const { metadata, chapterList, path: mangaRoot } = job;
        let totalDownloaded = job.downloadedChapters || 0;
        
        // 1. Prepare Root
        await mkdir(mangaRoot, { recursive: true });

        // 2. Load Existing Metadata (Safe Update Logic)
        let existingMeta: any = {};
        try {
            const content = await readTextFile(`${mangaRoot}/metadata.json`);
            existingMeta = JSON.parse(content);
        } catch (e) {
            // New download or corrupted metadata, start fresh is acceptable here
            console.log(`[Download] No existing metadata found for ${metadata.title}, creating new.`);
        }

        // Merge Metadata (Prefer new remote metadata but keep local overrides if we were tracking them)
        const mergedMeta = {
            ...existingMeta,
            ...metadata,
            // Critical: Preserve existing chapters if they exist
            chapters: existingMeta.chapters || [],
            // Preserve total pages tracked locally
            totalPages: existingMeta.totalPages || 0
        };

        // Determine Global Index from Existing
        let globalIndex = mergedMeta.totalPages || 0;
        
        // Tracking strictly for this job's batch
        const newChaptersMetadata: any[] = [];

        try {
            // 3. Cover Logic
            if (metadata.coverUrl && !metadata.coverFile && !mergedMeta.coverFile) {
                try {
                    const coverPath = `${mangaRoot}/cover.jpg`;
                    await invoke('download_image', {
                        url: metadata.coverUrl,
                        filePath: coverPath 
                    });
                    mergedMeta.coverFile = 'cover.jpg';
                } catch (e) {
                    console.warn(`[Download] Cover download failed: ${e}`);
                }
            }

            // 4. Sequential Chapter Processing
            // Sort by chapter number to ensure we append in order
            const sortedChapters = [...chapterList].sort((a, b) => parseFloat(a.number || a.attributes?.chapter || '0') - parseFloat(b.number || b.attributes?.chapter || '0'));

             for (const chapter of sortedChapters) {
                // Check if chapter already exists in metadata to avoid duplicates (Idempotency)
                const chNum = chapter.number || chapter.attributes?.chapter || '1';
                const existingChapter = mergedMeta.chapters.find((c: any) => c.number === chNum);
                
                if (existingChapter) {
                    console.log(`[Download] Chapter ${chNum} already exists in metadata. Skipping download.`);
                    totalDownloaded++;
                     store.updateJobProgress(job.id, Math.min(100, Math.round((totalDownloaded / job.totalChapters) * 100)), totalDownloaded);
                    continue; 
                }

                // Check Paused State
                if (store.queue.find((j: any) => j.id === job.id)?.status === 'paused') {
                    console.log(`[Download] Job ${job.id} paused.`);
                    await this.writeMetadata(mangaRoot, mergedMeta); // Save what we have
                    return; 
                }

                try {
                    const startIndex = globalIndex;
                    
                    const pagesCount = await this.downloadChapterFlat(chapter, mangaRoot, job.id, store);
                    
                    if (pagesCount > 0) {
                        globalIndex += pagesCount;
                        const endIndex = globalIndex - 1;

                        const newChapterMeta = {
                            number: chNum,
                            startIndex,
                            endIndex,
                            fileName: `Chapter ${chNum}` // Optional friendly name
                        };

                        // Append to our working list AND the master list
                        newChaptersMetadata.push(newChapterMeta);
                        mergedMeta.chapters.push(newChapterMeta);
                        mergedMeta.totalPages = globalIndex;

                        // Periodically save metadata (e.g. every chapter) to prevent data loss on crash
                        await this.writeMetadata(mangaRoot, mergedMeta);
                    }

                    totalDownloaded++;
                    
                    // Update Progress
                    const progress = Math.min(100, Math.round((totalDownloaded / job.totalChapters) * 100));
                    store.updateJobProgress(job.id, progress, totalDownloaded);
                    
                } catch (err) {
                    console.error(`[Download] Failed chapter ${chapter.id}`, err);
                }
            }

            // 5. Finalize
            // Sort chapters in metadata to be sure
            mergedMeta.chapters.sort((a: any, b: any) => parseFloat(a.number) - parseFloat(b.number));
            
            await this.writeMetadata(mangaRoot, mergedMeta);
            store.updateJobStatus(job.id, 'completed');
            
            // Register with Library & Notify
            import('../stores/useLibraryStore').then(async ({ useLibraryStore }) => {
                 const { join } = await import('@tauri-apps/api/path');
                 // Ensure we use the correct cover file from metadata
                 const coverFile = mergedMeta.coverFile || 'cover.jpg';
                 const absoluteCoverPath = await join(mangaRoot, coverFile);

                 await useLibraryStore.getState().registerDownloadedSeries(
                     { ...mergedMeta, rootPath: mangaRoot, coverPath: absoluteCoverPath }, 
                     mergedMeta.chapters.map((ch: any) => ({
                         id: `${mergedMeta.mangaId}-${ch.number}`,
                         title: `Chapter ${ch.number}`,
                         chapterNumber: parseFloat(ch.number),
                         filePath: mangaRoot
                     }))
                 );
                 
                 const { emit } = await import('@tauri-apps/api/event');
                 await emit('library:updated');
            });

        } catch (error) {
            console.error(`[Download] Job ${job.id} failed:`, error);
            store.updateJobStatus(job.id, 'failed');
        }
    }

    private static async downloadChapterFlat(chapter: any, mangaRoot: string, jobId: string, store: any): Promise<number> {
        const chapterNum = chapter.number || chapter.attributes?.chapter || '1';
        const chPadded = parseFloat(chapterNum).toString().split('.')[0].padStart(3, '0');
        
        // 1. Fetch/Prepare Pages
        let images: { url: string; pageNumber: number }[] = [];
        
        if (chapter.isManual && chapter.images) {
            images = chapter.images;
        } else {
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
                // Don't throw logic error effectively skips channel
                return 0; 
            }
        }

        if (images.length === 0) return 0;

        // 2. Download Pages (Concurrency: 3)
        const concurrency = 3;
        const chunks = [];
        for (let i = 0; i < images.length; i += concurrency) {
            chunks.push(images.slice(i, i + concurrency));
        }

        for (const chunk of chunks) {
             if (store.queue.find((j: any) => j.id === jobId)?.status === 'paused') {
                 throw new Error("Job Paused");
             }

            await Promise.all(chunk.map(async (img) => {
                const pageIdx = images.indexOf(img);
                const pPadded = (pageIdx + 1).toString().padStart(3, '0');
                const fileName = `ch${chPadded}_p${pPadded}.jpg`;
                const filePath = `${mangaRoot}/${fileName}`;
                
                try {
                    await invoke('download_image', {
                        url: img.url,
                        filePath: filePath,
                    });
                } catch (e) {
                    console.error(`Failed to download ${fileName}`, e);
                }
            }));
        }

        return images.length;
    }

    private static async writeMetadata(mangaRoot: string, metadata: any) {
         try {
             // Ensure we are not losing data (redundant check but good for safety)
             if (!metadata.chapters || !Array.isArray(metadata.chapters)) {
                 console.error("[Download] Attempted to write metadata without chapters! Aborting write.");
                 return;
             }

             const safeMeta = {
                title: metadata.title || 'Unknown Series',
                description: metadata.description || '',
                author: metadata.author || '',
                artist: metadata.artist || '',
                tags: metadata.tags || [],
                status: metadata.status || 'unknown',
                source: metadata.source || 'mangadex',
                sourceUrl: metadata.sourceUrl || '',
                mangaId: metadata.mangaId || 'local',
                coverFile: metadata.coverFile || 'cover.jpg',
                totalPages: metadata.totalPages || 0,
                chapters: metadata.chapters, // This now includes ALL chapters (old + new)
                lastChecked: Math.floor(Date.now() / 1000),
                version: 3.0
            };
            
            await writeTextFile(`${mangaRoot}/metadata.json`, JSON.stringify(safeMeta, null, 2));
         } catch (e) {
             console.error("Failed to write metadata", e);
         }
    }
}
