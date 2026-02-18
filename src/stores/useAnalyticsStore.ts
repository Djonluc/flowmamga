import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AnalyticsState {
  totalTimeReading: number; // in seconds
  pagesRead: number;
  booksCompleted: number;
  sessions: number;
  lastSessionDate: string | null;
  currentStreak: number;
  longestStreak: number;
  dailyStats: Record<string, { time: number; pages: number }>;
  seriesTime: Record<string, number>; // seriesId -> seconds
  
  // Actions
  addReadingTime: (seconds: number, seriesId?: string) => void;
  incrementPagesRead: (count?: number) => void;
  incrementBooksCompleted: () => void;
  startSession: () => void;
  getLastSevenDays: () => { date: string; time: number; pages: number }[];
  getLastThirtyDays: () => { date: string; time: number; pages: number }[];
  getFavoriteSeries: () => string | null;
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
      longestStreak: 0,
      dailyStats: {},
      seriesTime: {},

      addReadingTime: (seconds, seriesId) => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => {
            const currentDay = state.dailyStats[today] || { time: 0, pages: 0 };
            const newSeriesTime = seriesId ? { ...state.seriesTime, [seriesId]: (state.seriesTime[seriesId] || 0) + seconds } : state.seriesTime;
            
            return {
                totalTimeReading: state.totalTimeReading + seconds,
                dailyStats: {
                    ...state.dailyStats,
                    [today]: {
                        ...currentDay,
                        time: currentDay.time + seconds
                    }
                },
                seriesTime: newSeriesTime
            };
        });
      },
      
      incrementPagesRead: (count = 1) => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => {
            const currentDay = state.dailyStats[today] || { time: 0, pages: 0 };
            return {
                pagesRead: state.pagesRead + count,
                dailyStats: {
                    ...state.dailyStats,
                    [today]: {
                        ...currentDay,
                        pages: currentDay.pages + count
                    }
                }
            };
        });
      },
      
      incrementBooksCompleted: () => set((state) => ({ booksCompleted: state.booksCompleted + 1 })),
      
      startSession: () => {
          const now = new Date();
          const today = now.toISOString().split('T')[0];
          const state = get();
          const lastDate = state.lastSessionDate;
          
          if (lastDate === today) return; 
          
          let streak = state.currentStreak;
          if (lastDate) {
              const yesterday = new Date(now);
              yesterday.setDate(now.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().split('T')[0];
              
              if (lastDate === yesterdayStr) {
                  streak++;
              } else {
                  streak = 1; 
              }
          } else {
              streak = 1; 
          }
          
          set({ 
              sessions: state.sessions + 1,
              lastSessionDate: today,
              currentStreak: streak,
              longestStreak: Math.max(state.longestStreak, streak)
          });
      },

      getLastSevenDays: () => {
          const { dailyStats } = get();
          const result = [];
          for (let i = 6; i >= 0; i--) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              const dateStr = d.toISOString().split('T')[0];
              const stats = dailyStats[dateStr] || { time: 0, pages: 0 };
              result.push({ date: dateStr, time: stats.time, pages: stats.pages });
          }
          return result;
      },

      getLastThirtyDays: () => {
          const { dailyStats } = get();
          const result = [];
          for (let i = 29; i >= 0; i--) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              const dateStr = d.toISOString().split('T')[0];
              const stats = dailyStats[dateStr] || { time: 0, pages: 0 };
              result.push({ date: dateStr, time: stats.time, pages: stats.pages });
          }
          return result;
      },

      getFavoriteSeries: () => {
          const { seriesTime } = get();
          let maxTime = 0;
          let favorite = null;
          for (const [id, time] of Object.entries(seriesTime)) {
              if (time > maxTime) {
                  maxTime = time;
                  favorite = id;
              }
          }
          return favorite;
      }
    }),
    {
      name: 'flowmanga-analytics',
    }
  )
);
