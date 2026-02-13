
import { useEffect, useRef } from 'react';
import { useReadingStore } from '../stores/useReadingStore';
import { useAnalyticsStore } from '../stores/useAnalyticsStore';

export const useReadingAnalytics = () => {
    const { currentFolderPath, currentIndex } = useReadingStore();
    const { addReadingTime, incrementPagesRead, startSession } = useAnalyticsStore();
    
    // Track session start
    useEffect(() => {
        if (currentFolderPath) {
            startSession();
        }
    }, [currentFolderPath, startSession]);

    // Track pages read
    const lastIndexRef = useRef(currentIndex);
    useEffect(() => {
        if (currentFolderPath && currentIndex !== lastIndexRef.current) {
            incrementPagesRead(1);
            lastIndexRef.current = currentIndex;
        }
    }, [currentIndex, currentFolderPath, incrementPagesRead]);

    // Track time read
    useEffect(() => {
        if (!currentFolderPath) return;

        const interval = setInterval(() => {
            addReadingTime(10); // Log every 10 seconds
        }, 10000);

        return () => clearInterval(interval);
    }, [currentFolderPath, addReadingTime]);
};
