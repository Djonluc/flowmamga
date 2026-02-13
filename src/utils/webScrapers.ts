// Web scraper utilities for manga/comic websites
// Supports direct reading and downloading from various sources

export interface ChapterPage {
  pageNumber: number;
  imageUrl: string;
}

export interface Chapter {
  id: string;
  title: string;
  number: number;
  url: string;
  releaseDate?: string;
}

export interface WebManga {
  id: string;
  title: string;
  url: string;
  coverUrl?: string;
  description?: string;
  chapters: Chapter[];
  source: string;
}

// MangaKawaii scraper
export async function fetchFromMangaKawaii(mangaUrl: string): Promise<WebManga | null> {
  try {
    // Note: This requires a backend proxy or CORS bypass
    const response = await fetch(mangaUrl);
    const html = await response.text();
    
    // Parse HTML to extract manga info
    // This is a simplified example - actual implementation needs proper HTML parsing
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const title = titleMatch ? titleMatch[1] : 'Unknown';
    
    return {
      id: mangaUrl,
      title,
      url: mangaUrl,
      chapters: [], // Would parse chapter list from HTML
      source: 'MangaKawaii',
    };
  } catch (error) {
    console.error('MangaKawaii fetch error:', error);
    return null;
  }
}

// Webtoons scraper
export async function fetchFromWebtoons(seriesUrl: string): Promise<WebManga | null> {
  try {
    // Webtoons has a more structured API we can use
    const seriesId = seriesUrl.match(/titleNo=(\d+)/)?.[1];
    if (!seriesId) return null;
    
    // Webtoons API endpoint (unofficial)
    const apiUrl = `https://www.webtoons.com/en/episodeList?titleNo=${seriesId}`;
    
    return {
      id: seriesId,
      title: 'Webtoon Series',
      url: seriesUrl,
      chapters: [],
      source: 'Webtoons',
    };
  } catch (error) {
    console.error('Webtoons fetch error:', error);
    return null;
  }
}

// MangaMirai scraper
export async function fetchFromMangaMirai(mangaUrl: string): Promise<WebManga | null> {
  try {
    const response = await fetch(mangaUrl);
    const html = await response.text();
    
    return {
      id: mangaUrl,
      title: 'MangaMirai Series',
      url: mangaUrl,
      chapters: [],
      source: 'MangaMirai',
    };
  } catch (error) {
    console.error('MangaMirai fetch error:', error);
    return null;
  }
}

// Hitomi scraper
export async function fetchFromHitomi(galleryUrl: string): Promise<WebManga | null> {
  try {
    const galleryId = galleryUrl.match(/\/(\d+)\.html/)?.[1];
    if (!galleryId) return null;
    
    // Hitomi has a JSON API
    const apiUrl = `https://ltn.hitomi.la/galleries/${galleryId}.js`;
    
    return {
      id: galleryId,
      title: 'Hitomi Gallery',
      url: galleryUrl,
      chapters: [],
      source: 'Hitomi',
    };
  } catch (error) {
    console.error('Hitomi fetch error:', error);
    return null;
  }
}

// nHentai scraper
export async function fetchFromNHentai(galleryUrl: string): Promise<WebManga | null> {
  try {
    const galleryId = galleryUrl.match(/\/g\/(\d+)/)?.[1];
    if (!galleryId) return null;
    
    // nHentai API
    const apiUrl = `https://nhentai.net/api/gallery/${galleryId}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      id: galleryId,
      title: data.title?.english || data.title?.japanese || 'Unknown',
      url: galleryUrl,
      coverUrl: `https://t.nhentai.net/galleries/${data.media_id}/cover.${data.images.cover.t === 'j' ? 'jpg' : 'png'}`,
      chapters: [{
        id: galleryId,
        title: 'Full Gallery',
        number: 1,
        url: galleryUrl,
      }],
      source: 'nHentai',
    };
  } catch (error) {
    console.error('nHentai fetch error:', error);
    return null;
  }
}

// Download chapter pages
export async function downloadChapterPages(chapterUrl: string, source: string): Promise<ChapterPage[]> {
  const pages: ChapterPage[] = [];
  
  try {
    switch (source.toLowerCase()) {
      case 'nhentai': {
        const galleryId = chapterUrl.match(/\/g\/(\d+)/)?.[1];
        if (!galleryId) break;
        
        const apiUrl = `https://nhentai.net/api/gallery/${galleryId}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        data.images.pages.forEach((page: any, index: number) => {
          const ext = page.t === 'j' ? 'jpg' : page.t === 'p' ? 'png' : 'gif';
          pages.push({
            pageNumber: index + 1,
            imageUrl: `https://i.nhentai.net/galleries/${data.media_id}/${index + 1}.${ext}`,
          });
        });
        break;
      }
      
      case 'hitomi': {
        const galleryId = chapterUrl.match(/\/(\d+)\.html/)?.[1];
        if (!galleryId) break;
        
        // Hitomi requires more complex logic to construct image URLs
        // This is a simplified version
        break;
      }
      
      default:
        console.warn(`Downloading from ${source} not yet implemented`);
    }
  } catch (error) {
    console.error('Chapter download error:', error);
  }
  
  return pages;
}

// Detect source from URL
export function detectSource(url: string): string | null {
  if (url.includes('mangakawaii.io')) return 'MangaKawaii';
  if (url.includes('webtoons.com')) return 'Webtoons';
  if (url.includes('mangamirai.com')) return 'MangaMirai';
  if (url.includes('hitomi.la')) return 'Hitomi';
  if (url.includes('nhentai.net')) return 'nHentai';
  return null;
}

// Universal web manga fetcher
export async function fetchWebManga(url: string): Promise<WebManga | null> {
  const source = detectSource(url);
  if (!source) {
    console.error('Unknown manga source:', url);
    return null;
  }
  
  switch (source) {
    case 'MangaKawaii':
      return fetchFromMangaKawaii(url);
    case 'Webtoons':
      return fetchFromWebtoons(url);
    case 'MangaMirai':
      return fetchFromMangaMirai(url);
    case 'Hitomi':
      return fetchFromHitomi(url);
    case 'nHentai':
      return fetchFromNHentai(url);
    default:
      return null;
  }
}

// Download entire manga/gallery
export async function downloadManga(webManga: WebManga, outputPath: string): Promise<boolean> {
  try {
    for (const chapter of webManga.chapters) {
      const pages = await downloadChapterPages(chapter.url, webManga.source);
      
      // Save pages to output path
      // This would require electron/node.js file system access
      console.log(`Downloaded ${pages.length} pages for ${chapter.title}`);
    }
    
    return true;
  } catch (error) {
    console.error('Manga download error:', error);
    return false;
  }
}
