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

// TODO: Implement real scraping using Cheerio in Tauri Rust backend
// The previous implementation was a placeholder and has been disabled for stability.

export async function fetchFromMangaKawaii(mangaUrl: string): Promise<WebManga | null> {
  console.warn('MangaKawaii scraper not yet implemented');
  return null;
}

export async function fetchFromWebtoons(seriesUrl: string): Promise<WebManga | null> {
  console.warn('Webtoons scraper not yet implemented');
  return null;
}

export async function fetchFromMangaMirai(mangaUrl: string): Promise<WebManga | null> {
  console.warn('MangaMirai scraper not yet implemented');
  return null;
}

export async function fetchFromHitomi(galleryUrl: string): Promise<WebManga | null> {
  console.warn('Hitomi scraper not yet implemented');
  return null;
}

export async function fetchFromNHentai(galleryUrl: string): Promise<WebManga | null> {
    console.warn('nHentai scraper not yet implemented');
    return null;
}

export async function downloadChapterPages(chapterUrl: string, source: string): Promise<ChapterPage[]> {
  console.warn('Download not yet implemented');
  return [];
}

export function detectSource(url: string): string | null {
  if (url.includes('mangakawaii.io')) return 'MangaKawaii';
  if (url.includes('webtoons.com')) return 'Webtoons';
  if (url.includes('mangamirai.com')) return 'MangaMirai';
  if (url.includes('hitomi.la')) return 'Hitomi';
  if (url.includes('nhentai.net')) return 'nHentai';
  return null;
}

export async function fetchWebManga(url: string): Promise<WebManga | null> {
  console.warn('Web manga fetching temporarily disabled pending backend rewrite');
  return null;
}

export async function downloadManga(webManga: WebManga, outputPath: string): Promise<boolean> {
  console.warn('Download temporarily disabled');
  return false;
}
