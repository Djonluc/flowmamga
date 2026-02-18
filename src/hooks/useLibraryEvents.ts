import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useLibraryStore } from '../stores/useLibraryStore';
import { useVideoStore } from '../stores/useVideoStore';
import { useReadingStore } from '../stores/useReadingStore';
import { useSettingsStore } from '../stores/useSettingsStore';

export const useLibraryEvents = () => {
  const { addMangaFolder } = useLibraryStore();
  const { addFolder } = useVideoStore();
  const { openFolder } = useReadingStore();
  const { setActiveView } = useSettingsStore();

  useEffect(() => {
    let unlistenOpenPath: (() => void) | undefined;

    const setupListeners = async () => {
      unlistenOpenPath = await listen<string>('open-path', async (event) => {
        const path = event.payload;
        console.log('[Native] Received open-path:', path);

        try {
          const lowerPath = path.toLowerCase();
          const isVideo = lowerPath.endsWith('.mp4') || lowerPath.endsWith('.mkv') || lowerPath.endsWith('.avi') || lowerPath.endsWith('.webm');

          if (isVideo) {
              const parentPath = path.includes('\\') ? path.substring(0, path.lastIndexOf('\\')) : path;
              await addFolder(parentPath);
              setActiveView('videos');
          } else {
              // Assume manga folder or archive
              await addMangaFolder(path);
              setActiveView('library');
              // Automatically open if it's a specific folder/archive
              await openFolder(path);
          }
        } catch (err) {
          console.error('[Native] Failed to auto-import path:', err);
        }
      });
    };

    setupListeners();

    return () => {
      if (unlistenOpenPath) unlistenOpenPath();
    };
  }, [addMangaFolder, addFolder, openFolder, setActiveView]);
};
