import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useReadingStore } from '../stores/useReadingStore';
import { useAnalyticsStore } from '../stores/useAnalyticsStore';
import { VerticalReader } from './readers/VerticalReader';
import { SinglePageReader } from './readers/SinglePageReader';
import { SlideshowReader } from './readers/SlideshowReader';
import { HorizontalReader } from './readers/HorizontalReader';

export const Reader = () => {
  const { readingMode } = useSettingsStore();
  const { startSession, addReadingTime, incrementPagesRead } = useAnalyticsStore();
  const currentIndex = useReadingStore(state => state.currentIndex);
  const prevIndexRef = useRef(currentIndex);

  useEffect(() => {
      startSession();
      
      const timer = setInterval(() => {
          if (document.hasFocus()) {
              addReadingTime(1);
          }
      }, 1000);

      return () => clearInterval(timer);
  }, []);

  useEffect(() => {
      if (currentIndex !== prevIndexRef.current) {
          incrementPagesRead(1);
          prevIndexRef.current = currentIndex;
      }
  }, [currentIndex]);

  switch (readingMode) {
    case 'vertical':
      return <VerticalReader />;
    case 'horizontal': // New mapping
      return <HorizontalReader />;
    case 'single':
      return <SinglePageReader />;
    case 'slideshow':
        return <SlideshowReader />;
    default:
      return <VerticalReader />;
  }
};
