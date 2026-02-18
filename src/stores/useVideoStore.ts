import { create } from 'zustand';
import { getDb } from '../services/db';

export interface Video {
  id: string;
  folderId: string;
  filePath: string;
  title: string;
  duration: number;
  resolution?: string;
  thumbnailPath?: string;
  lastPosition?: number;
}

export interface VideoFolder {
  id: string;
  path: string;
  name: string;
  shuffleEnabled: boolean;
  repeatMode: 'off' | 'one' | 'all';
  videos: Video[];
}

interface VideoState {
  folders: VideoFolder[];
  
  // Player Runtime State (In-Memory)
  queue: Video[];
  currentVideo: Video | null;
  isPlaying: boolean;
  volume: number;
  playbackRate: number;
  
  // Actions
  loadFromDb: () => Promise<void>;
  playVideo: (video: Video, folder?: VideoFolder) => void;
  nextVideo: () => void;
  prevVideo: () => void;
  togglePlay: (playing?: boolean) => void;
  setVolume: (vol: number) => void;
  setPlaybackRate: (rate: number) => void;
  updateVideoProgress: (videoId: string, time: number) => Promise<void>;
  addFolder: (path: string) => Promise<void>;
  toggleShuffle: () => Promise<void>;
  toggleRepeat: () => Promise<void>;
}

export const useVideoStore = create<VideoState>((set, get) => ({
  folders: [],
  queue: [],
  currentVideo: null,
  isPlaying: false,
  volume: 1,
  playbackRate: 1,

  loadFromDb: async () => {
    const db = getDb();
    const folders = await db.select<any[]>('SELECT * FROM VideoFolders');
    const enrichedFolders: VideoFolder[] = [];

    for (const folder of folders) {
      const videos = await db.select<any[]>('SELECT * FROM Videos WHERE folderId = ?', [folder.id]);
      enrichedFolders.push({
        ...folder,
        shuffleEnabled: !!folder.shuffleEnabled,
        videos: videos.map(v => ({ 
            ...v, 
            duration: Number(v.duration),
            lastPosition: Number(v.lastPosition || 0) 
        }))
      });
    }

    set({ folders: enrichedFolders });
  },

  playVideo: (video, folder) => {
    const state = get();
    let newQueue = state.queue;

    if (folder) {
      if (folder.shuffleEnabled) {
         newQueue = [...folder.videos];
         for (let i = newQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
         }
      } else {
         newQueue = [...folder.videos];
      }
    }

    set({ 
        currentVideo: video, 
        queue: newQueue, 
        isPlaying: true 
    });
  },

  nextVideo: () => {
      const { queue, currentVideo, folders } = get();
      if (!currentVideo || queue.length === 0) return;

      const folder = folders.find(f => f.id === currentVideo.folderId);
      const repeatMode = folder?.repeatMode || 'off';

      const currentIndex = queue.findIndex(v => v.id === currentVideo.id);
      let nextIndex = currentIndex + 1;
      
      if (nextIndex >= queue.length) {
          if (repeatMode === 'all') {
              nextIndex = 0;
          } else {
              set({ isPlaying: false });
              return;
          }
      }

      set({ currentVideo: queue[nextIndex], isPlaying: true });
  },

  prevVideo: () => {
      const { queue, currentVideo, folders } = get();
      if (!currentVideo || queue.length === 0) return;

      const folder = folders.find(f => f.id === currentVideo.folderId);
      const repeatMode = folder?.repeatMode || 'off';

      const currentIndex = queue.findIndex(v => v.id === currentVideo.id);
      let prevIndex = currentIndex - 1;

      if (prevIndex < 0) {
           if (repeatMode === 'all') {
               prevIndex = queue.length - 1;
           } else {
               return;
           }
      }
      
      set({ currentVideo: queue[prevIndex], isPlaying: true });
  },

  togglePlay: (playing) => set((state) => ({ isPlaying: playing ?? !state.isPlaying })),
  
  setVolume: (volume) => set({ volume }),
  
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  
  updateVideoProgress: async (videoId, time) => {
    const db = getDb();
    try {
        await db.execute('UPDATE Videos SET lastPosition = ? WHERE id = ?', [time, videoId]);
    } catch (err) {
        console.error('[VideoStore] Failed to save progress:', err);
    }
  },

  addFolder: async (path: string) => {
    const { invoke } = await import('@tauri-apps/api/core');
    const db = getDb();
    
    try {
      const results: any[] = await invoke('scan_video_folder', { path });
      const folderId = path; // Using path as unique ID for now
      const folderName = path.split(/[/\\]/).pop() || 'Unknown';

      // 1. Insert Folder
      await db.execute(
        'INSERT OR IGNORE INTO VideoFolders (id, name, path) VALUES (?, ?, ?)',
        [folderId, folderName, path]
      );

      // 2. Insert Videos
      for (const v of results) {
        await db.execute(
          'INSERT OR IGNORE INTO Videos (id, folderId, filePath, title) VALUES (?, ?, ?, ?)',
          [v.id, folderId, v.file_path, v.title]
        );
      }

      // 3. Refresh Store
      await get().loadFromDb();
      
    } catch (err) {
      console.error('[VideoStore] Failed to add folder:', err);
      throw err;
    }
  },

  toggleShuffle: async () => {
      const state = get();
      if (!state.currentVideo) return;
      const db = getDb();

      const folderId = state.currentVideo.folderId;
      const folder = state.folders.find(f => f.id === folderId);
      if (!folder) return;

      const newShuffleState = !folder.shuffleEnabled;

      // Update DB
      // Note: SQLite boolean is 0 or 1
      await db.execute('UPDATE VideoFolders SET shuffleEnabled = ? WHERE id = ?', [newShuffleState ? 1 : 0, folderId]);

      // Update Local State optimized (optimistic UI possible, but we'll reload or patch)
      // Patching local folders
      const updatedFolders = state.folders.map(f => 
          f.id === folderId ? { ...f, shuffleEnabled: newShuffleState } : f
      );

      set({ folders: updatedFolders });
  },

  toggleRepeat: async () => {
      const state = get();
      if (!state.currentVideo) return;
      const db = getDb();

      const folderId = state.currentVideo.folderId;
      const folder = state.folders.find(f => f.id === folderId);
      if (!folder) return;

      const modes: ('off' | 'one' | 'all')[] = ['off', 'all', 'one'];
      const nextMode = modes[(modes.indexOf(folder.repeatMode) + 1) % modes.length];

      // Update DB
      await db.execute('UPDATE VideoFolders SET repeatMode = ? WHERE id = ?', [nextMode, folderId]);

      // Update Local State
      const updatedFolders = state.folders.map(f => 
          f.id === folderId ? { ...f, repeatMode: nextMode } : f
      );

      set({ folders: updatedFolders });
  }
}));

