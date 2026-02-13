import { useEffect } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useReadingStore } from '../stores/useReadingStore';

export const ShortcutsManager = () => {
    const { toggleHud, setHudVisibility, setReadingMode, toggleShortcuts, toggleSettings, toggleAutoScrolling, toggleLibraryViewMode } = useSettingsStore();
    const { nextPage, prevPage } = useReadingStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if input is active
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === '?') {
                toggleShortcuts();
                return;
            }

            if (e.key === ',') {
                toggleSettings();
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'a':
                    toggleAutoScrolling();
                    break;
                case 'l':
                    toggleLibraryViewMode();
                    break;
                case 'f':
                    useSettingsStore.getState().toggleFullScreenAction();
                    break;
                case 'h':
                    toggleHud();
                    break;
                case 'escape':
                    // If fullscreen, browser handles it.
                    // If HUD is hidden, show it.
                    if (useSettingsStore.getState().isShortcutsOpen) toggleShortcuts();
                    else if (useSettingsStore.getState().isSettingsOpen) toggleSettings();
                    else if (useSettingsStore.getState().isFullscreen) useSettingsStore.getState().toggleFullScreenAction();
                    else setHudVisibility(true);
                    break;
                // Reading Mode Toggles
                case 'v':
                    setReadingMode('vertical');
                    break;
                case 'p': // Page / Single
                    setReadingMode('single');
                    break;
                case 's': // Slideshow
                    setReadingMode('slideshow');
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleHud, setHudVisibility, setReadingMode, toggleShortcuts, toggleSettings, nextPage, prevPage]);

    return null;
};
