import { useEffect } from 'react';
import { useReadingStore } from '../stores/useReadingStore';

export const usePreloader = (windowSize: number = 3) => {
    const { images, currentIndex } = useReadingStore();

    useEffect(() => {
        if (images.length === 0) return;

        const preloadImage = (src: string) => {
            const img = new Image();
            img.src = src.startsWith('http') ? src : `media:///${src}`;
        };

        // Determine range to preload
        // We want to preload:
        // - Next 'windowSize' images
        // - Previous 1 image (for quick back navigation)
        
        const start = Math.max(0, currentIndex - 1);
        const end = Math.min(images.length - 1, currentIndex + windowSize);

        for (let i = start; i <= end; i++) {
            if (i === currentIndex) continue; // Already rendered
            preloadImage(images[i]);
        }
    }, [currentIndex, images, windowSize]);
};
