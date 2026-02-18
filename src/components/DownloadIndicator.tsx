import { useDownloadStore } from '../stores/useDownloadStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { DownloadPanel } from './DownloadPanel';

export const DownloadIndicator = () => {
    const { queue, activeJobIds } = useDownloadStore();
    const isProcessing = activeJobIds.length > 0;
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    // Filter interesting jobs (active or queued)
    const activeJobs = queue.filter(j => j.status === 'downloading' || j.status === 'queued');
    const completedJobs = queue.filter(j => j.status === 'completed');

    const totalActive = activeJobs.length;
    const currentJob = queue.find(j => j.id === activeJobIds[0]);
    
    // Auto-hide when empty? Or show icon always?
    // User requested "Downloads (2)" in sidebar/topbar.
    // Let's make a floating pill or sidebar item.
    // For now, a floating indicator bottom-right or top-right.
    
    if (queue.length === 0) return null;

    return (
        <>
            <motion.button
                layout
                onClick={() => setIsPanelOpen(true)}
                className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-2xl hover:bg-white/20 transition-colors group"
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
            >
                <div className="relative">
                    <Download className={`w-5 h-5 ${isProcessing ? 'animate-bounce' : 'text-gray-400'}`} />
                    {totalActive > 0 && (
                        <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                            {totalActive}
                        </span>
                    )}
                </div>

                <div className="flex flex-col items-start text-xs">
                    {currentJob ? (
                        <>
                            <span className="font-bold max-w-[120px] truncate">{currentJob.title}</span>
                            <div className="flex items-center gap-2 w-full">
                                <div className="h-1 flex-1 bg-white/20 rounded-full w-[80px] overflow-hidden">
                                    <motion.div 
                                        className="h-full bg-blue-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${currentJob.progress}%` }}
                                    />
                                </div>
                                <span className="opacity-70">{currentJob.progress.toFixed(0)}%</span>
                            </div>
                        </>
                    ) : (
                        <span className="font-medium text-gray-300">
                             {completedJobs.length > 0 ? 'Downloads Complete' : 'Downloads Queued'}
                        </span>
                    )}
                </div>
            </motion.button>

            <AnimatePresence>
                {isPanelOpen && <DownloadPanel onClose={() => setIsPanelOpen(false)} />}
            </AnimatePresence>
        </>
    );
};
