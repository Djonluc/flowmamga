import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type DownloadJob } from '../types';

interface DownloadState {
    queue: DownloadJob[];
    activeJobId: string | null;
    isProcessing: boolean;

    addJob: (job: Omit<DownloadJob, 'status' | 'progress' | 'downloadedChapters'>) => void;
    removeJob: (id: string) => void;
    pauseJob: (id: string) => void;
    resumeJob: (id: string) => void;
    updateJobProgress: (id: string, progress: number, downloadedChapters?: number) => void;
    updateJobStatus: (id: string, status: DownloadJob['status']) => void;
    startNextJob: () => Promise<void>;
    retryJob: (id: string) => void;
    clearCompleted: () => void;
}

export const useDownloadStore = create<DownloadState>()(
    persist(
        (set, get) => ({
            queue: [],
            activeJobId: null,
            isProcessing: false,

            addJob: (jobData) => {
                const newJob: DownloadJob = {
                    ...jobData,
                    status: 'queued',
                    progress: 0,
                    downloadedChapters: 0,
                };
                
                // Add to queue
                set((state) => ({ queue: [...state.queue, newJob] }));

                // Auto-start if idle
                const { isProcessing, activeJobId } = get();
                if (!isProcessing && !activeJobId) {
                    get().startNextJob();
                }
            },

            removeJob: (id) => {
                set((state) => ({
                    queue: state.queue.filter(job => job.id !== id),
                    activeJobId: state.activeJobId === id ? null : state.activeJobId
                }));
                // If we removed the active job, try starting next
                if (get().activeJobId === null) {
                    get().startNextJob();
                }
            },

            pauseJob: (id) => {
                set((state) => ({
                    queue: state.queue.map(job => 
                        job.id === id ? { ...job, status: 'paused' } : job
                    ),
                    activeJobId: state.activeJobId === id ? null : state.activeJobId
                }));
                // If paused active, start next
                if (get().activeJobId === null) {
                    get().startNextJob();
                }
            },

            resumeJob: (id) => {
                set((state) => ({
                    queue: state.queue.map(job => 
                        job.id === id ? { ...job, status: 'queued' } : job
                    )
                }));
                // Auto-trigger queue check
                const { isProcessing, activeJobId } = get();
                if (!isProcessing && !activeJobId) {
                    get().startNextJob();
                }
            },

            retryJob: (id) => {
                set((state) => ({
                    queue: state.queue.map(job => 
                        job.id === id ? { ...job, status: 'queued', progress: 0 } : job
                    )
                }));
                const { isProcessing, activeJobId } = get();
                if (!isProcessing && !activeJobId) {
                    get().startNextJob();
                }
            },

            updateJobProgress: (id, progress, downloadedChapters) => {
                set((state) => ({
                    queue: state.queue.map(job => 
                        job.id === id ? { 
                            ...job, 
                            progress, 
                            downloadedChapters: downloadedChapters !== undefined ? downloadedChapters : job.downloadedChapters 
                        } : job
                    )
                }));
            },

            updateJobStatus: (id, status) => {
                set((state) => ({
                    queue: state.queue.map(job => 
                        job.id === id ? { ...job, status } : job
                    ),
                    // If job finished, clear active
                    activeJobId: (status === 'completed' || status === 'failed') && state.activeJobId === id ? null : state.activeJobId
                }));
            },

            clearCompleted: () => {
                 set((state) => ({
                    queue: state.queue.filter(job => job.status !== 'completed')
                }));
            },

            startNextJob: async () => {
                const { queue, activeJobId, isProcessing } = get();
                if (isProcessing || activeJobId) return;

                // Find next queued job
                const nextJob = queue.find(j => j.status === 'queued');
                if (!nextJob) return;

                set({ activeJobId: nextJob.id, isProcessing: true });
                
                // Update Status
                get().updateJobStatus(nextJob.id, 'downloading');

                // Dynamic Import Service to avoid cycles
                try {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const { DownloadService } = await import('../services/DownloadService');
                    await DownloadService.processJob(nextJob);
                } catch (error) {
                    console.error('Job failed', error);
                    get().updateJobStatus(nextJob.id, 'failed');
                } finally {
                    set({ isProcessing: false, activeJobId: null });
                    // Recursive call to process next
                    get().startNextJob();
                }
            }
        }),
        {
            name: 'download-storage', // Persistence key
        }
    )
);
