import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AnalyticsState { // Added interface definition
  totalTimeReading: number; // in seconds
  pagesRead: number;
  booksCompleted: number;
  sessions: number;
  lastSessionDate: string | null;
  currentStreak: number;
  
  // Actions
  addReadingTime: (seconds: number) => void;
  incrementPagesRead: (count?: number) => void;
  incrementBooksCompleted: () => void;
  startSession: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      totalTimeReading: 0,
      pagesRead: 0,
      booksCompleted: 0,
      sessions: 0,
      lastSessionDate: null,
      currentStreak: 0,

      addReadingTime: (seconds) => set((state) => ({ totalTimeReading: state.totalTimeReading + seconds })),
      
      incrementPagesRead: (count = 1) => set((state) => ({ pagesRead: state.pagesRead + count })),
      
      incrementBooksCompleted: () => set((state) => ({ booksCompleted: state.booksCompleted + 1 })),
      
      startSession: () => {
          const now = new Date();
          const today = now.toISOString().split('T')[0];
          const lastDate = get().lastSessionDate;
          
          if (lastDate === today) return; // Already logged today
          
          let streak = get().currentStreak;
          if (lastDate) {
              const yesterday = new Date(now);
              yesterday.setDate(now.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().split('T')[0];
              
              if (lastDate === yesterdayStr) {
                  streak++;
              } else {
                  streak = 1; // broken streak
              }
          } else {
              streak = 1; // first session
          }
          
          set((state) => ({ 
              sessions: state.sessions + 1,
              lastSessionDate: today,
              currentStreak: streak
          }));
      }
    }),
    {
      name: 'flowmanga-analytics',
    }
  )
);
