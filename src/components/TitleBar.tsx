import { Minus, Square, X } from 'lucide-react';

export const TitleBar = () => {
  return (
    <div className="h-8 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-2 select-none drag-region relative z-50">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-neutral-400 px-2">FlowManga</span>
      </div>
      
      <div className="flex items-center no-drag">
        {/* Only show window controls in Electron */}
        {window.electron && (
            <>
                <button 
                onClick={() => window.electron.minimize()}
                className="p-1.5 hover:bg-neutral-800 rounded-md text-neutral-400 hover:text-white transition-colors"
                >
                <Minus size={14} />
                </button>
                <button 
                onClick={() => window.electron.maximize()}
                className="p-1.5 hover:bg-neutral-800 rounded-md text-neutral-400 hover:text-white transition-colors"
                >
                <Square size={12} />
                </button>
                <button 
                onClick={() => window.electron.close()}
                className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-md text-neutral-400 transition-colors"
                >
                <X size={14} />
                </button>
            </>
        )}
      </div>
    </div>
  );
};
