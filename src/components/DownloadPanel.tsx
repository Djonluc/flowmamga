import { useDownloadStore } from '../stores/useDownloadStore';
import { motion } from 'framer-motion';
import { X, Play, Pause, Trash, Check, AlertTriangle } from 'lucide-react';
import { type DownloadJob } from '../types';

export const DownloadPanel = ({ onClose }: { onClose: () => void }) => {
    const { queue, pauseJob, resumeJob, removeJob, activeJobId, clearCompleted } = useDownloadStore();

    // Group jobs by status or just list them?
    // Let's list active first, then queued.
    // Completed last.
    
    // Sort function?
    const sortedQueue = [...queue].sort((a, b) => {
        if (a.status === 'downloading') return -1;
        if (b.status === 'downloading') return 1;
        if (a.status === 'queued' && b.status !== 'queued') return -1;
        return 0;
    });

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-24 right-6 w-96 max-h-[600px] bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 text-white"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm">
                <h3 className="font-bold text-lg">Downloads</h3>
                <div className="flex gap-2">
                    <button 
                        onClick={clearCompleted}
                        className="p-2 hover:bg-slate-800 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
                        title="Clear Completed"
                    >
                        Clear All
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-hide space-y-2">
                {sortedQueue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                        <Check size={48} className="mb-4 opacity-20" />
                        <p>All caught up!</p>
                    </div>
                ) : (
                    sortedQueue.map((job) => (
                        <JobItem 
                            key={job.id} 
                            job={job} 
                            isActive={job.id === activeJobId}
                            onPause={() => pauseJob(job.id)}
                            onResume={() => resumeJob(job.id)}
                            onRemove={() => removeJob(job.id)}
                        />
                    ))
                )}
            </div>
            
            {/* Footer Status */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex justify-between">
                <span>{queue.length} items</span>
                <span>{queue.filter(j => j.status === 'downloading').length} downloading</span>
            </div>
        </motion.div>
    );
};

const JobItem = ({ job, isActive, onPause, onResume, onRemove }: { 
    job: DownloadJob; 
    isActive: boolean;
    onPause: () => void;
    onResume: () => void;
    onRemove: () => void;
}) => {
    const isCompleted = job.status === 'completed';
    const isPaused = job.status === 'paused';
    const isFailed = job.status === 'failed';

    return (
        <div className={`relative p-3 rounded-xl border transition-all ${
            isActive ? 'bg-blue-500/10 border-blue-500/30' : 
            isCompleted ? 'bg-green-500/5 border-green-500/20' :
            'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80'
        }`}>
            <div className="flex gap-3">
                {/* Cover Interface fallback */}
                <div className="w-12 h-16 bg-slate-700 rounded-md overflow-hidden shrink-0">
                    {job.coverUrl ? (
                         // eslint-disable-next-line @next/next/no-img-element
                        <img src={job.coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">?</div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate text-white">{job.title}</h4>
                    <div className="flex items-center text-xs text-slate-400 mt-1 mb-2">
                        {isCompleted && <span className="text-green-400 flex items-center gap-1"><Check size={12} /> Completed</span>}
                        {isFailed && <span className="text-red-400 flex items-center gap-1"><AlertTriangle size={12} /> Failed</span>}
                        {isPaused && <span className="text-yellow-400 flex items-center gap-1"><Pause size={12} /> Paused</span>}
                        {isActive && <span className="text-blue-400 animate-pulse">Downloading...</span>}
                        {!isActive && !isCompleted && !isFailed && !isPaused && <span>Queued</span>}
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                        <motion.div 
                            className={`h-full rounded-full ${
                                isCompleted ? 'bg-green-500' :
                                isFailed ? 'bg-red-500' :
                                isPaused ? 'bg-yellow-500' :
                                'bg-blue-500'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${job.progress}%` }}
                            transition={{ ease: "linear" }}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 justify-center">
                    {!isCompleted && (
                        <button 
                            onClick={isActive ? onPause : onResume}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors"
                        >
                            {isActive ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                    )}
                    <button 
                        onClick={onRemove}
                        className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-500 transition-colors"
                    >
                        <Trash size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
