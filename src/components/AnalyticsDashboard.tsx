import { useAnalyticsStore } from '../stores/useAnalyticsStore';
import { motion } from 'framer-motion';
import { Clock, BookOpen, Flame, Calendar, Book } from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';

export const AnalyticsDashboard = () => {
    const { totalTimeReading, pagesRead, booksCompleted, currentStreak, sessions } = useAnalyticsStore();
    const { theme } = useSettingsStore();

    // Format time
    const hours = Math.floor(totalTimeReading / 3600);
    const minutes = Math.floor((totalTimeReading % 3600) / 60);
    
    const stats = [
        { label: 'Reading Time', value: `${hours}h ${minutes}m`, icon: <Clock size={24} className="text-blue-400" /> },
        { label: 'Pages Read', value: pagesRead.toLocaleString(), icon: <BookOpen size={24} className="text-green-400" /> },
        { label: 'Current Streak', value: `${currentStreak} Days`, icon: <Flame size={24} className="text-orange-500" /> },
        { label: 'Books Completed', value: booksCompleted, icon: <Book size={24} className="text-purple-400" /> },
        { label: 'Total Sessions', value: sessions, icon: <Calendar size={24} className="text-pink-400" /> },
    ];

    return (
        <div className="flex flex-col h-full w-full p-8 overflow-y-auto custom-scrollbar">
            <motion.h2 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-8"
            >
                Reading Analytics
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-6 rounded-2xl border border-white/5 backdrop-blur-md shadow-xl
                            ${theme === 'oled' ? 'bg-neutral-900/50' : 'bg-white/5'}
                        `}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-neutral-400 text-sm font-medium uppercase tracking-wider">{stat.label}</span>
                            <div className="p-2 bg-white/5 rounded-full">{stat.icon}</div>
                        </div>
                        <div className="text-3xl font-bold text-white">{stat.value}</div>
                    </motion.div>
                ))}
            </div>

            {/* Placeholder for Chart */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 p-8 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md flex items-center justify-center flex-col h-64 text-neutral-500"
            >
                <div className="w-full h-full bg-gradient-to-t from-blue-500/10 to-transparent rounded-lg flex items-end justify-around pb-4 px-4 gap-2">
                     {/* Fake bar chart */}
                     {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                         <div key={i} className="w-full bg-blue-500/30 rounded-t-md hover:bg-blue-500/50 transition-colors relative group" style={{ height: `${h}%` }}>
                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">Day {i+1}</div>
                         </div>
                     ))}
                </div>
                <p className="mt-4 text-xs uppercase tracking-widest">Activity Trend (Last 7 Days)</p>
            </motion.div>
        </div>
    );
};
