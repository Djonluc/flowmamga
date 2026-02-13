import { useEffect, useRef, useState } from 'react';
import { useReadingStore } from '../../stores/useReadingStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { ZoomIn, ZoomOut, Maximize, Play, Pause } from 'lucide-react';
import { SmartImage } from '../SmartImage';

export const VerticalReader = () => {
  const { images } = useReadingStore();
  const { gapSize, isAutoScrolling, autoScrollSpeed, toggleAutoScrolling } = useSettingsStore();
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(null);

  // Simple zoom controls
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const handleFitWidth = () => setScale(1);

  // Auto-scroll logic
  useEffect(() => {
    const scroll = () => {
      if (containerRef.current && isAutoScrolling) {
        containerRef.current.scrollTop += autoScrollSpeed;
        
        // Stop if we reach the end
        if (containerRef.current.scrollTop + containerRef.current.clientHeight >= containerRef.current.scrollHeight) {
          toggleAutoScrolling();
          return;
        }
      }
      requestRef.current = requestAnimationFrame(scroll);
    };

    if (isAutoScrolling) {
      requestRef.current = requestAnimationFrame(scroll);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isAutoScrolling, autoScrollSpeed, toggleAutoScrolling]);

  return (
    <div className="w-full h-full relative group">
      {/* Floating Controls (Fade in on hover) */}
      <div className="absolute top-4 right-8 flex flex-col gap-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-2 rounded-lg backdrop-blur-sm border border-white/10">
        <button 
          onClick={toggleAutoScrolling} 
          className={`p-2 rounded transition-colors ${isAutoScrolling ? 'bg-blue-600' : 'hover:bg-white/20'} text-white`} 
          title={isAutoScrolling ? "Pause Auto-scroll" : "Start Auto-scroll"}
        >
          {isAutoScrolling ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <div className="h-px bg-white/10 mx-1" />
        <button onClick={handleZoomIn} className="p-2 hover:bg-white/20 rounded text-white" title="Zoom In">
          <ZoomIn size={20} />
        </button>
        <button onClick={handleZoomOut} className="p-2 hover:bg-white/20 rounded text-white" title="Zoom Out">
          <ZoomOut size={20} />
        </button>
        <button onClick={handleFitWidth} className="p-2 hover:bg-white/20 rounded text-white" title="Fit Width">
          <Maximize size={20} />
        </button>
      </div>

      <div 
        ref={containerRef}
        className="w-full h-full overflow-y-auto overflow-x-hidden flex flex-col items-center custom-scrollbar pb-20 select-none"
        style={{ gap: `${gapSize}px` }}
        onWheel={() => {
            if (isAutoScrolling) toggleAutoScrolling();
        }}
      >
        {images.map((imagePath, index) => (
          <SmartImage
            key={imagePath}
            src={imagePath.startsWith('http') ? imagePath : `media:///${imagePath}`}
            alt={`Page ${index + 1}`}
            className="shadow-2xl transition-all duration-200 ease-out origin-top border border-white/5"
            style={{ 
              maxWidth: useSettingsStore.getState().fitMode === 'width' ? `${100 * scale}%` : 'none',
              maxHeight: useSettingsStore.getState().fitMode === 'height' ? `${100 * scale}vh` : 'none',
              width: useSettingsStore.getState().fitMode === 'width' ? `${100 * scale}%` : 'auto',
              height: 'auto',
            }} 
          />
        ))}
      </div>
    </div>
  );
};
