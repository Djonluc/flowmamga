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
}

