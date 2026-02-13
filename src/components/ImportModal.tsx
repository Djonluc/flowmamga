import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderOpen, Globe } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportFolder: () => void;
  onImportWeb: (url: string) => void;
}

export function ImportModal({ isOpen, onClose, onImportFolder, onImportWeb }: ImportModalProps) {
  const [mode, setMode] = useState<'choose' | 'web'>('choose');
  const [webUrl, setWebUrl] = useState('');

  const handleClose = () => {
    setMode('choose');
    setWebUrl('');
    onClose();
  };

  const handleWebSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (webUrl.trim()) {
      onImportWeb(webUrl.trim());
      handleClose();
    }
  };

  const handleFolderClick = () => {
    onImportFolder();
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-neutral-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md mx-4 pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">
                  {mode === 'choose' ? 'Import Manga' : 'Add Web Manga'}
                </h2>
                <button
                  onClick={handleClose}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              {mode === 'choose' ? (
                <div className="p-6 space-y-4">
                  <p className="text-sm text-neutral-400 mb-6">
                    Choose how you want to add manga to your library
                  </p>
                  
                  {/* Local Folder Option */}
                  <button
                    onClick={handleFolderClick}
                    className="w-full p-4 bg-neutral-800 hover:bg-neutral-700 border border-white/10 rounded-lg transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                        <FolderOpen size={24} className="text-blue-400" />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-bold text-white">Local Folder</h3>
                        <p className="text-sm text-neutral-400">Import from your computer</p>
                      </div>
                    </div>
                  </button>

                  {/* Web Link Option */}
                  <button
                    onClick={() => setMode('web')}
                    className="w-full p-4 bg-gradient-to-r from-purple-600/10 to-pink-600/10 hover:from-purple-600/20 hover:to-pink-600/20 border border-purple-500/20 rounded-lg transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                        <Globe size={24} className="text-purple-400" />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-bold text-white">Web Source</h3>
                        <p className="text-sm text-neutral-400">MangaDex, Webtoons, nHentai, etc.</p>
                      </div>
                    </div>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleWebSubmit} className="p-6 space-y-4">
                  <p className="text-sm text-neutral-400">
                    Enter a URL from MangaDex, Webtoons, MangaMirai, Hitomi, or nHentai
                  </p>
                  
                  <input
                    type="text"
                    value={webUrl}
                    onChange={(e) => setWebUrl(e.target.value)}
                    placeholder="https://mangadex.org/title/..."
                    autoFocus
                    className="w-full px-4 py-3 bg-neutral-800 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('choose')}
                      className="flex-1 px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={!webUrl.trim()}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
