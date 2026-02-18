import { useSettingsStore } from '../stores/useSettingsStore';
import { useDownloadStore } from '../stores/useDownloadStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Trash2, RotateCcw, Download } from 'lucide-react';

export const DownloadPanel = () => {
    const { isDownloadPanelOpen, toggleDownloadPanel } = useSettingsStore();
    const { queue, activeJobIds, pauseJob, resumeJob, removeJob, retryJob } = useDownloadStore();

    const activeJobs = queue.filter(job => activeJobIds.includes(job.id));
    const queuedJobs = queue.filter(job => !activeJobIds.includes(job.id) && job.status === 'queued');
    const failedJobs = queue.filter(job => job.status === 'failed');
    // We filter out completed unless we want a history, but user asked for "Next in Queue"
    
    return (
        <AnimatePresence>
            {isDownloadPanelOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleDownloadPanel}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-80 bg-neutral-900 border-l border-white/10 shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-neutral-900/50 backdrop-blur-md">
                            <div className="flex items-center gap-2">
                                <Download size={16} className="text-blue-500" />
                                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Downloads</h2>
                            </div>
                            <button 
                                onClick={toggleDownloadPanel}
                                className="p-1.5 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                            
                            {/* Empty State */}
                            {queue.length === 0 && (
                                <div className="text-center py-10 opacity-50 space-y-2">
                                    <Download size={32} className="mx-auto text-neutral-600" />
                                    <p className="text-xs text-neutral-500 font-medium">No downloads active</p>
                                </div>
                            )}

                            {/* Active Downloads */}
                            {activeJobs.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-2">Active</h3>
                                    {activeJobs.map(job => (
                                        <div key={job.id} className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-2">
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <h4 className="text-xs font-bold text-white line-clamp-1">{job.title}</h4>
                                                    <p className="text-[10px] text-neutral-400">{job.chapterList.length} Chapters</p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => pauseJob(job.id)} className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-yellow-400">
                                                        <Pause size={12} />
                                                    </button>
                                                    <button onClick={() => removeJob(job.id)} className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-red-400">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* Progress Bar */}
                                            <div className="space-y-1">
                                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${job.progress}%` }}
                                                        className="h-full bg-blue-500"
                                                    />
                                                </div>
                                                <div className="flex justify-between text-[9px] text-neutral-500 font-medium font-mono">
                                                    <span>{job.downloadedChapters} / {job.totalChapters} items</span>
                                                    <span>{Math.round(job.progress)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                             {/* Failed Downloads */}
                             {failedJobs.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-red-400 tracking-widest mb-2">Failed</h3>
                                    {failedJobs.map(job => (
                                        <div key={job.id} className="bg-red-500/5 rounded-xl p-3 border border-red-500/20 flex justify-between items-center group">
                                            <div>
                                                <h4 className="text-xs font-bold text-red-200 line-clamp-1">{job.title}</h4>
                                                <p className="text-[10px] text-red-400/70">Download failed</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => retryJob(job.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded text-red-400">
                                                    <RotateCcw size={12} />
                                                </button>
                                                <button onClick={() => removeJob(job.id)} className="p-1.5 hover:bg-red-500/10 rounded text-red-400/50 hover:text-red-400">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             )}

                            {/* Queue */}
                            {queuedJobs.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-2">Next in Queue ({queuedJobs.length})</h3>
                                    {queuedJobs.map(job => (
                                        <div key={job.id} className="bg-white/5 rounded-xl p-3 border border-white/5 flex justify-between items-center group hover:border-white/10 transition-colors">
                                           <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                                                <h4 className="text-xs font-bold text-neutral-300 line-clamp-1">{job.title}</h4>
                                                <p className="text-[10px] text-neutral-500">{job.chapterList.length} Chapters • Queued</p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 {/* If paused, show Play */}
                                                {job.status === 'paused' ? (
                                                    <button onClick={() => resumeJob(job.id)} className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-green-400">
                                                        <Play size={12} />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => pauseJob(job.id)} className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-yellow-400">
                                                        <Pause size={12} />
                                                    </button>
                                                )}
                                                <button onClick={() => removeJob(job.id)} className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-red-400">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
