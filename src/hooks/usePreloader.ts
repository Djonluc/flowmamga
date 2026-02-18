import { useEffect } from 'react';
import { useReadingStore } from '../stores/useReadingStore';
import { convertFileSrc } from '@tauri-apps/api/core';

export const usePreloader = (windowSize: number = 3) => {
    const { images, currentIndex } = useReadingStore();

    useEffect(() => {
        if (images.length === 0) return;

        const preloadImage = (src: string) => {
            const img = new Image();
            img.src = src.startsWith('http') ? src : convertFileSrc(src);
        };

        // Preload Window: Current + next few
        const start = currentIndex;
        const end = Math.min(images.length - 1, currentIndex + windowSize);

        for (let i = start; i <= end; i++) {
            preloadImage(images[i]);
        }

        // Cleanup/Unload logic would go here if we were managing a custom cache,
        // but browsers handle image GC pretty well. 
        // We focus on ensuring the NEXT few are hot in memory.
    }, [currentIndex, images, windowSize]);
};
