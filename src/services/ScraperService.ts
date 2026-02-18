import { invoke } from '@tauri-apps/api/core';

export interface ScrapedImage {
    url: string;
    pageNumber: number;
}

interface SiteConfig {
    domain: string;
    imageSelector: string;
    imageAttr: string;
    containerSelector?: string;
    isVerticalWebtoon: boolean;
}

const siteConfigs: Record<string, SiteConfig> = {
    'namicomi.com': {
        domain: 'namicomi.com',
        imageSelector: 'img.page-image, img[src*="namicomi.com"], .viewer img, .reader img, .nc-viewer img, [data-role="reader"] img',
        imageAttr: 'src',
        containerSelector: '#viewer, .reader, .nc-viewer, [data-role="reader"], .page-list, div[class*="viewer"]',
        isVerticalWebtoon: true
    }
};

export interface ScrapeResult {
    images: ScrapedImage[];
    metadata?: {
        title?: string;
        coverUrl?: string;
        chapterTitle?: string;
        description?: string;
        mangaId?: string;
    };
}

export class ScraperService {
    static async scrapeChapter(url: string): Promise<ScrapeResult> {
        console.log(`[Scraper] Fetching ${url}...`);
        
        try {
            // 1. Fetch HTML via Rust Backend (Avoids CORS)
            const html = await invoke<string>('fetch_html', { url });
            const domain = new URL(url).hostname.replace('www.', '');

            // Specialized Strategy: MangaDex API (Official Support)
            if (domain.includes('mangadex.org')) {
                return await this.scrapeMangaDex(url);
            }
            
            // Specialized Strategy: NamiComi (Headless Series/Chapter)
            if (domain.includes('namicomi.com')) {
                 if (url.includes('/title/')) {
                     await this.scrapeNamiComi(url);
                     return { images: [] };
                 } else {
                     return await this.scrapeViaWindow(url);
                 }
            }

            // Specialized Strategy: Mangakakalot.gg (Static + Headless Fallback)
            if (domain.includes('mangakakalot.gg')) {
                if (url.includes('/manga/')) {
                    await this.scrapeMangaKakalotGG(url);
                    return { images: [] }; // Series scrape
                } else {
                    const images = await this.getKakalotChapterImages(url);
                    return { 
                        images: images.map((src, i) => ({ url: src, pageNumber: i + 1 })) 
                    };
                }
            }

            const config = siteConfigs[domain] || siteConfigs[Object.keys(siteConfigs).find(k => domain.includes(k)) || ''];

            const images: ScrapedImage[] = [];
            
            // Helper: checks if url looks like a content image
            const isContentImage = (src: string) => {
                return !src.includes('logo') && !src.includes('icon') && !src.includes('avatar') && (src.includes('uploads') || src.includes('chapter') || src.match(/\.(jpg|jpeg|png|webp)/i));
            };

            // Strategy A: Next.js Hydra Data (Often contains highest res)
            const nextDataRegex = /<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/;
            const nextDataMatch = html.match(nextDataRegex);
            
            if (nextDataMatch && nextDataMatch[1]) {
                try {
                    const jsonData = JSON.parse(nextDataMatch[1]);
                    console.log('[Scraper] Found Next.js Data');
                    
                    const findImagesInObject = (obj: any): string[] => {
                        let results: string[] = [];
                        if (!obj) return results;
                        
                        if (Array.isArray(obj)) {
                            obj.forEach(item => results = results.concat(findImagesInObject(item)));
                        } else if (typeof obj === 'object') {
                            if (obj.url && (typeof obj.url === 'string') && isContentImage(obj.url)) {
                                results.push(obj.url);
                            }
                            Object.keys(obj).forEach(key => {
                                results = results.concat(findImagesInObject(obj[key]));
                            });
                        }
                        return results;
                    };
                    
                    const foundUrls = findImagesInObject(jsonData);
                    foundUrls.forEach((inputUrl, index) => {
                         // Fix relative URLs from JSON
                         let fullUrl = inputUrl;
                         if (inputUrl.startsWith('/')) {
                             const origin = new URL(url).origin;
                             fullUrl = `${origin}${inputUrl}`;
                         }
                         images.push({ url: fullUrl, pageNumber: index + 1 });
                    });
                    
                } catch (e) {
                    console.error('[Scraper] Failed to parse Next.js data', e);
                }
            }
            
            // Strategy B: DOM Parsing (More robust than Regex)
            if (images.length === 0) {
                 console.log('[Scraper] Strategy A failed/empty. Using Site Config / DOM Strategy.');
                 
                 const parser = new DOMParser();
                 const doc = parser.parseFromString(html, 'text/html');
                 
                 let scope: Element | Document = doc;
                 if (config?.containerSelector) {
                     const container = doc.querySelector(config.containerSelector);
                     if (container) scope = container;
                 }

                 const selector = config?.imageSelector || 'img';
                 const imgElements = Array.from(scope.querySelectorAll(selector));

                 imgElements.forEach((img) => {
                     const element = img as HTMLImageElement;
                     // Logic: Check config attr -> src -> data-src
                     let src = config?.imageAttr ? element.getAttribute(config.imageAttr) : null;
                     if (!src || src.trim() === '') src = element.getAttribute('src');
                     if (!src || src.trim() === '') src = element.getAttribute('data-src');
                     if (!src || src.trim() === '') src = element.getAttribute('data-lazy-src');
                     if (!src || src.trim() === '') src = element.getAttribute('data-original');
                     if (!src || src.trim() === '') src = element.getAttribute('data-lazy');

                     if (src && isContentImage(src)) {
                         // Resolve relative URLs
                         if (src.startsWith('/')) {
                             const origin = new URL(url).origin;
                             src = `${origin}${src}`;
                         } else if (!src.startsWith('http')) {
                             // Handle weird relative paths or protocol relative
                             if (src.startsWith('//')) {
                                 src = `https:${src}`;
                             }
                         }

                         images.push({ url: src, pageNumber: images.length + 1 });
                     }
                 });
            }
            
            // Remove duplicates
            const uniqueImages = Array.from(new Map(images.map(item => [item.url, item])).values());
            
            if (uniqueImages.length === 0) {
                 console.log('[Scraper] Strategies A & B failed. Attempting Strategy C: Hidden Window...');
                 return await this.scrapeViaWindow(url);
            }

            return { images: uniqueImages };
            
        } catch (error) {
            console.error('[Scraper] Error:', error);
            throw error;
        }
    }

    static sanitizeFilename(name: string): string {
        return name
            .replace(/[/\?%*:|"<>]/g, '_')
            .trim()
            .slice(0, 100);
    }

    static async getMangaDetails(mangaId: string): Promise<{ title: string; description: string; author?: string; tags: string[]; coverUrl?: string }> {
        const res = await fetch(`https://api.mangadex.org/manga/${mangaId}?includes[]=cover_art&includes[]=author&includes[]=artist`);
        if (!res.ok) throw new Error('Failed to fetch manga details');

        const json = await res.json();
        const attrs = json.data.attributes;

        // Prefer English, fallback to first available
        const titleObj = attrs.title;
        const title = titleObj.en || titleObj[Object.keys(titleObj)[0]] || 'Untitled';

        const descObj = attrs.description;
        const description = descObj?.en || descObj?.[Object.keys(descObj)[0]] || 'No description available';

        const authorRel = json.data.relationships.find((r: any) => r.type === 'author' || r.type === 'artist');
        const author = authorRel?.attributes?.name;

        const tags = attrs.tags.map((t: any) => t.attributes.name.en).filter(Boolean);

        const coverRel = json.data.relationships.find((r: any) => r.type === 'cover_art');
        const fileName = coverRel?.attributes?.fileName;
        const coverUrl = fileName ? `https://uploads.mangadex.org/covers/${mangaId}/${fileName}` : undefined;

        return { title, description, author, tags, coverUrl };
    }

    static async getChapterFeed(mangaId: string): Promise<any[]> {
        const allChapters: any[] = [];
        let offset = 0;
        const limit = 100;

        while (true) {
            const feedUrl = `https://api.mangadex.org/manga/${mangaId}/feed?` +
                `translatedLanguage[]=en&limit=${limit}&offset=${offset}&` +
                `order[chapter]=asc&` +
                `includes[]=scanlation_group`;

            const res = await fetch(feedUrl);
            if (!res.ok) throw new Error('Failed to fetch chapter feed');
            
            const feed = await res.json();
            if (feed.result !== 'ok' || !feed.data?.length) break;

            allChapters.push(...feed.data);
            offset += limit;

            if (offset >= feed.total) break;
        }

        console.log(`[Scraper] Fetched ${allChapters.length} chapters total (Ascending)`);
        return allChapters;
    }

    private static async scrapeMangaDex(inputUrl: string): Promise<ScrapeResult> {
        console.log('[Scraper] Handling MangaDex URL:', inputUrl);

        const mangaIdMatch = inputUrl.match(/mangadex\.org\/title\/([a-f0-9-]{36})/);
        const chapterIdMatch = inputUrl.match(/mangadex\.org\/chapter\/([a-f0-9-]{36})/);

        let chapterId: string | null = null;
        let resultMetadata: ScrapeResult['metadata'] = undefined;

        try {
            if (chapterIdMatch) {
                chapterId = chapterIdMatch[1];
                const chapRes = await fetch(`https://api.mangadex.org/chapter/${chapterId}?includes[]=manga`);
                const chapData = await chapRes.json();
                
                const mangaRel = chapData.data.relationships.find((r: any) => r.type === 'manga');
                if (mangaRel) {
                    const mId = mangaRel.id;
                    const { title, description, coverUrl } = await this.getMangaDetails(mId);
                    
                    const chapterAttribs = chapData.data.attributes;
                    const chapterNum = chapterAttribs.chapter;
                    const chapTitle = chapterAttribs.title ? `: ${chapterAttribs.title}` : '';
                    
                    resultMetadata = {
                        title: title,
                        coverUrl: coverUrl,
                        description: description,
                        mangaId: mId,
                        chapterTitle: `Chapter ${chapterNum}${chapTitle}`
                    };
                }
            } else if (mangaIdMatch) {
                const mId = mangaIdMatch[1];
                const { title, description, coverUrl } = await this.getMangaDetails(mId);
                const feed = await this.getChapterFeed(mId);

                if (feed.length > 0) {
                    // Default to latest chapter for the preview (last in ascending list)
                    const latestChapter = feed[feed.length - 1];
                    chapterId = latestChapter.id;
                    const chapterAttribs = latestChapter.attributes;
                    const chapterNum = chapterAttribs.chapter;
                    const chapTitle = chapterAttribs.title ? `: ${chapterAttribs.title}` : '';
                    
                    resultMetadata = {
                        title: title,
                        coverUrl: coverUrl,
                        description: description,
                        mangaId: mId,
                        chapterTitle: `Chapter ${chapterNum}${chapTitle}`
                    };
                } else {
                    throw new Error('No English chapters found on MangaDex for this series.');
                }
            } else {
                throw new Error('Invalid MangaDex URL format.');
            }

            // Fetch image server info
            const atHomeRes = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`);
            const atHome = await atHomeRes.json();

            if (atHome.result !== 'ok') {
                throw new Error('Failed to get chapter server: ' + atHome.result);
            }

            const { baseUrl, chapter } = atHome;
            const imageUrls = chapter.data.map((file: string, index: number) => ({
                url: `${baseUrl}/data/${chapter.hash}/${file}`,
                pageNumber: index + 1
            }));

            console.log(`[MangaDex] Found ${imageUrls.length} pages`);
            return {
                images: imageUrls,
                metadata: resultMetadata
            };

        } catch (error) {
            console.error('[MangaDex Scraper] Error:', error);
            throw error;
        }
    }

    private static async scrapeViaWindow(url: string): Promise<ScrapeResult> {
         console.log('[Scraper] Using Rust Headless Scraper...');
         try {
             const imageUrls = await invoke<string[]>('scrape_images_headless', { url });
             
             if (!imageUrls || imageUrls.length === 0) {
                 throw new Error('Headless scraper found no images.');
             }

             console.log(`[Scraper] Found ${imageUrls.length} images via Headless Chrome`);
             
             return { 
                 images: imageUrls.map((src, i) => ({
                    url: src,
                    pageNumber: i + 1
                 }))
             };
         } catch (e) {
             console.error('[Scraper] Headless scrape failed:', e);
             throw new Error(`Headless scrape failed: ${(e as any).toString()}`);
         }
    }
    static async scrapeNamiComi(seriesUrl: string): Promise<void> {
        console.log('[Scraper] Handling NamiComi series:', seriesUrl);

        try {
            // 1. Fetch Series Metadata
            const { title, description, cover_url, chapter_links } = await invoke<{
                title: string;
                description: string;
                cover_url: string;
                chapter_links: string[];
            }>('scrape_series_headless', { url: seriesUrl });

            if (!chapter_links || chapter_links.length === 0) {
                throw new Error('No chapters found on series page');
            }

            // 2. Setup Directory
            const safeTitle = this.sanitizeFilename(title || 'Untitled');
            const { appDataDir, join } = await import('@tauri-apps/api/path');
            const { mkdir, writeTextFile, exists, readTextFile } = await import('@tauri-apps/plugin-fs');
            
            const baseDir = await appDataDir();
            const mangaDir = await join(baseDir, 'manga', safeTitle); // Flat structure: manga/Title/chXXX_pageYYY.jpg

            if (!(await exists(mangaDir))) {
                await mkdir(mangaDir, { recursive: true });
            }

            // 3. Download Cover
            let coverFile = 'cover.jpg';
            if (cover_url) {
                const coverPath = await join(mangaDir, 'cover.jpg');
                try {
                    await invoke('download_image', { url: cover_url, filePath: coverPath });
                } catch (e) {
                    console.error('Failed to download cover:', e);
                }
            }

            // 4. Update/Create Metadata
            const metaPath = await join(mangaDir, 'metadata.json');
            let meta: any = {
                title,
                description,
                source: 'namicomi.com',
                seriesUrl,
                coverFile,
                chapters: [], 
                chapterBoundaries: {}
            };

            if (await exists(metaPath)) {
                try {
                    const existing = JSON.parse(await readTextFile(metaPath));
                    meta = { ...existing, ...meta }; // Merge, keeping existing fields like bookmarks
                } catch (e) { /* ignore */ }
            }
            
            // Map chapters (NamiComi usually lists Newest First -> Reverse for storage if we want 1..N order)
            // But we want to match the source's chapter numbers if possible. 
            // The links usually contain the data. For now, we'll index 1..N based on total count oldest->newest.
            
            // Reverse links to get Oldest -> Newest
            const sortedLinks = [...chapter_links].reverse();
            
            // Update metadata chapters list
            meta.chapters = sortedLinks.map((url, i) => ({
                number: i + 1,
                url: url,
                id: url.split('/').pop() // Use slug as ID
            }));
            
            await writeTextFile(metaPath, JSON.stringify(meta, null, 2));

            // 5. User Selection UI (Simulated: Requesting All or Latest)
            // For now, let's download the *latest* 3 chapters by default to test, or ALL?
            // The user asked to "select number of chapters". Since we lack a UI callback here,
            // we'll default to downloading ALL for now, or maybe just log and do one.
            // Let's implement the loop for ALL but check consistency.
            
            // Logic: Iterate recursively
            let globalPageIndex = 1;
            
            // Determine starting page index if we are appending? 
            // For flat structure, we need disjoint ranges. 
            // If we are 'updating', we should check existing boundaries.
            
            // Let's stick to the user's plan: "Download in asc order"
            
            const chaptersToDownload = sortedLinks; // All of them
            console.log(`[Scraper] Queuing ${chaptersToDownload.length} chapters...`);

            // We need to manage concurrency. Sequential for safety.
            for (let i = 0; i < chaptersToDownload.length; i++) {
                const chUrl = chaptersToDownload[i];
                const chapterNum = i + 1; // 1-based index (Oldest = 1)
                const paddedCh = chapterNum.toString().padStart(3, '0');
                
                // key for boundaries
                const chKey = chapterNum.toString();

                if (meta.chapterBoundaries && meta.chapterBoundaries[chKey]) {
                    console.log(`[Scraper] Skipping Chapter ${chapterNum} (already exists)`);
                    globalPageIndex = meta.chapterBoundaries[chKey].end + 1;
                    continue;
                }

                console.log(`[Scraper] Scraping Chapter ${chapterNum}: ${chUrl}`);
                try {
                    // Use existing headless scraper for images
                    const images = await this.scrapeViaWindow(chUrl);
                    
                    if (!images || !images.images.length) continue;

                    const chStart = globalPageIndex;
                    
                    // Download images
                    await Promise.all(images.images.map(async (img, idx) => {
                        const paddedIdx = (idx + 1).toString().padStart(3, '0');
                        const ext = img.url.match(/\.(jpg|jpeg|png|webp)/i)?.[0] || '.jpg';
                        const filename = `ch${paddedCh}_page${paddedIdx}${ext}`;
                        const filePath = await join(mangaDir, filename);
                        
                        await invoke('download_image', { url: img.url, filePath });
                    }));
                    
                    globalPageIndex += images.images.length;
                    
                    // Update boundaries immediately
        } catch (e) {
            console.error('[Scraper] NamiComi failed:', e);
            throw e;
        }
    }

        } catch (e) {
            console.error('[Scraper] NamiComi failed:', e);
            throw e;
        }
    }

    static async scrapeMangaKakalotGG(seriesUrl: string) {
        console.log('[Scraper] Handling MangaKakalot.gg series via Headless (Rust):', seriesUrl);

        // We can reuse the NamiComi "headless series" logic here because
        // `invoke('scrape_series_headless')` now smartly handles multiple domains in Rust.
        // But we want to store source as 'mangakakalot.gg'.

        // 1. Fetch Series Metadata Headless-First
        try {
             // Reusing the same method map as NamiComi but with 'mangakakalot' flavor
             const { title, description, cover_url, chapter_links } = await invoke<{
                title: string;
                description: string;
                cover_url: string;
                chapter_links: string[];
            }>('scrape_series_headless', { url: seriesUrl });

            if (!chapter_links || chapter_links.length === 0) {
                // If headless also empty, maybe fallback to static? But user said static is 403.
                throw new Error('No chapters found via headless scraper.');
            }

            // 2. Setup Directory
            const safeTitle = this.sanitizeFilename(title || 'Untitled');
            const { appDataDir, join } = await import('@tauri-apps/api/path');
            const { mkdir, writeTextFile, exists, readTextFile } = await import('@tauri-apps/plugin-fs');
            
            const baseDir = await appDataDir();
            const mangaDir = await join(baseDir, 'manga', safeTitle);

            if (!(await exists(mangaDir))) {
                await mkdir(mangaDir, { recursive: true });
            }

            // 3. Download Cover
            let coverFile = 'cover.jpg';
            if (cover_url) {
                const coverPath = await join(mangaDir, 'cover.jpg');
                try {
                    await invoke('download_image', { url: cover_url, filePath: coverPath });
                } catch (e) {
                    console.error('Failed to download cover:', e);
                }
            }

            // 4. Metadata
            const metaPath = await join(mangaDir, 'metadata.json');
            let meta: any = {
                title,
                description,
                source: 'mangakakalot.gg',
                seriesUrl,
                coverFile,
                chapters: [],
                chapterBoundaries: {}
            };

            if (await exists(metaPath)) {
                try {
                    const existing = JSON.parse(await readTextFile(metaPath));
                    meta = { ...existing, ...meta };
                } catch (e) { /* ignore */ }
            }

            // Mangakakalot often has oldest-last. Reverse to match canonical 1..N
            // If the Rust script didn't reverse it, we check order.
            // Usually we want Oldest = 1.
            let sortedLinks = [...chapter_links];
            // Heuristic: If first chapter URL looks like "chapter-1" and last is "chapter-100", it's asc.
            // If reversed (newest first), reverse it.
            // Most sites serve Newest First.
            sortedLinks.reverse(); 

            meta.chapters = sortedLinks.map((url, i) => ({
                number: i + 1,
                url: url,
                id: url.split('/').pop()
            }));

            await writeTextFile(metaPath, JSON.stringify(meta, null, 2));

            // 5. Headless Chapter Download
            console.log(`[Scraper] Downloading ${sortedLinks.length} chapters...`);
            let globalPageIndex = 1;

            for (let i = 0; i < sortedLinks.length; i++) {
                const chUrl = sortedLinks[i];
                const chapterNum = i + 1;
                const paddedCh = chapterNum.toString().padStart(3, '0');
                const chKey = chapterNum.toString();

                if (meta.chapterBoundaries && meta.chapterBoundaries[chKey]) {
                    globalPageIndex = meta.chapterBoundaries[chKey].end + 1;
                    continue;
                }

                console.log(`[Scraper] Headless Scraping Chapter ${chapterNum}: ${chUrl}`);
                try {
                    // Start with Headless immediately
                    const images = await this.scrapeViaWindow(chUrl);
                    
                    if (!images || !images.images.length) {
                        console.warn(`[Scraper] Chapter ${chapterNum} empty.`);
                        continue;
                    }

                    const chStart = globalPageIndex;
                    
                    await Promise.all(images.images.map(async (img, idx) => {
                        const paddedIdx = (idx + 1).toString().padStart(3, '0');
                        const ext = img.url.match(/\.(jpg|jpeg|png|webp)/i)?.[0] || '.jpg';
                        const filename = `ch${paddedCh}_page${paddedIdx}${ext}`;
                        const filePath = await join(mangaDir, filename);

                        await invoke('download_image', { url: img.url, filePath });
                    }));

                    globalPageIndex += images.images.length;
                    
                    if (!meta.chapterBoundaries) meta.chapterBoundaries = {};
                    meta.chapterBoundaries[chKey] = { start: chStart, end: globalPageIndex - 1 };
                    await writeTextFile(metaPath, JSON.stringify(meta, null, 2));

                } catch (e) {
                    console.error(`[Scraper] Failed chapter ${chapterNum}:`, e);
                }
            }
            console.log('[Scraper] Mangakakalot download complete.');

        } catch (err) {
            console.error('[Scraper] Headless series fetch failed:', err);
            throw err;
        }
    }

    static async getKakalotChapterImages(chapterUrl: string): Promise<string[]> {
        let html: string;
        try {
            const response = await fetch(chapterUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                    'Referer': 'https://www.mangakakalot.gg/'
                }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            html = await response.text();
        } catch (err) {
            console.warn('[MangaKakalot] Chapter static fetch failed, trying headless...', err);
            // Fallback to existing headless method
            const result = await this.scrapeViaWindow(chapterUrl);
            return result.images.map(img => img.url);
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const images: string[] = [];
        const imgEls = doc.querySelectorAll('.reading-content img, #readerarea img, .chapter-content img, img[data-src]');
        
        imgEls.forEach(img => {
            let src = img.getAttribute('data-src') || img.getAttribute('src') || '';
            if (src && (src.match(/\.(jpg|jpeg|png|webp)/i))) {
                if (src.startsWith('/')) src = 'https:' + src; // Should ideally check base, but usually absolute or root-relative
                if (src.startsWith('//')) src = 'https:' + src;
                images.push(src);
            }
        });

        if (images.length === 0) {
            console.warn('[MangaKakalot] No images found statically. Trying headless...');
             const result = await this.scrapeViaWindow(chapterUrl);
             return result.images.map(img => img.url);
        }

    }
}

