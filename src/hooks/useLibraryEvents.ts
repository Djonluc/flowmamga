import { useEffect } from 'react';
import { useLibraryStore } from '../stores/useLibraryStore';

export const useLibraryEvents = () => {
  const { libraryPath, setBooks } = useLibraryStore();

  useEffect(() => {
    if (!libraryPath || !window.electron?.onLibraryUpdate) {
      console.log('Running in browser mode - Electron APIs not available');
      return;
    }

    const handleUpdate = () => {
        console.log('Library update detected, refreshing...');
        window.electron.scanLibrary(libraryPath).then(setBooks);
    };

    const unsubscribe = window.electron.onLibraryUpdate(handleUpdate);
    return () => {
        if (unsubscribe) unsubscribe();
    };
  }, [libraryPath, setBooks]); // books removed from dependency
};
