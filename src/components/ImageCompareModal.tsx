import React, { useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ArrowRightLeft, Sparkles, Download } from 'lucide-react';
import { ImageItem } from '../types';
import { formatBytes } from '../lib/imageProcessor';

interface ImageCompareModalProps {
  item: ImageItem | null;
  onClose: () => void;
  onDownload: (item: ImageItem) => void;
}

export const ImageCompareModal: React.FC<ImageCompareModalProps> = ({ item, onClose, onDownload }) => {
  if (!item || !item.convertedUrl) return null;

  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0-100
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      handleMove(e.clientX);
    }
  };

  return (
    <div
      id="image-compare-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="image-compare-modal-card"
        className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div id="compare-modal-header" className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 id="compare-image-title" className="text-base font-bold text-slate-100 truncate max-w-md">
                {item.name}
              </h3>
              <p className="text-xs text-slate-400">
                Comparativa visual en tiempo real: Original vs. {item.convertedFormat?.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div id="zoom-controls" className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
              <button
                id="btn-zoom-out"
                onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
                className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700"
                title="Alejar"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-400 px-1">{Math.round(zoomLevel * 100)}%</span>
              <button
                id="btn-zoom-in"
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700"
                title="Acercar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                id="btn-zoom-reset"
                onClick={() => setZoomLevel(1)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-700"
                title="Restablecer Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Close Modal */}
            <button
              id="btn-close-modal"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div id="compare-stats-bar" className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-950/60 border-b border-slate-800 text-xs">
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block">Tamaño Original</span>
            <strong className="text-slate-200 text-sm font-mono">{formatBytes(item.originalSize)}</strong>
            <span className="text-[10px] text-slate-500 block">{item.originalWidth}x{item.originalHeight}px</span>
          </div>

          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block">Tamaño Optimizado</span>
            <strong className="text-emerald-400 text-sm font-mono">{formatBytes(item.convertedSize || 0)}</strong>
            <span className="text-[10px] text-emerald-500/80 block">{item.convertedWidth}x{item.convertedHeight}px</span>
          </div>

          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block">Reducción de Peso</span>
            <strong className="text-emerald-400 text-sm font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              -{item.savingsPercentage}%
            </strong>
            <span className="text-[10px] text-slate-500 block">Ahorro de espacio</span>
          </div>

          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block">Velocidad Proc.</span>
              <strong className="text-slate-300 text-xs font-mono">{item.conversionTimeMs} ms</strong>
            </div>
            <button
              id="btn-download-compare"
              onClick={() => onDownload(item)}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Guardar</span>
            </button>
          </div>
        </div>

        {/* Comparison Stage Viewport */}
        <div
          id="compare-stage"
          ref={containerRef}
          className="relative flex-1 min-h-[380px] md:min-h-[480px] bg-slate-950 overflow-hidden cursor-ew-resize select-none"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        >
          {/* Transparent Checkered Background Pattern for Alpha Transparency Testing */}
          <div
            id="checkerboard-bg"
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, #090d16 1px)`,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 10px 10px',
            }}
          />

          {/* Original Image (Left Side Layer) */}
          <div
            id="original-layer"
            className="absolute inset-0 flex items-center justify-center p-4 transition-transform duration-75"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <img
              src={item.originalPreviewUrl}
              alt="Original"
              className="max-h-full max-w-full object-contain pointer-events-none shadow-2xl rounded"
            />
            <span className="absolute top-4 left-4 bg-slate-900/80 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide backdrop-blur-sm shadow-md">
              Original ({item.originalType.replace('image/', '')})
            </span>
          </div>

          {/* Optimized WebP Image (Right Side Layer - Clipped) */}
          <div
            id="optimized-clipped-layer"
            className="absolute inset-0 flex items-center justify-center p-4 overflow-hidden transition-transform duration-75"
            style={{
              clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
              transform: `scale(${zoomLevel})`,
            }}
          >
            <img
              src={item.convertedUrl}
              alt="Optimizado WebP"
              className="max-h-full max-w-full object-contain pointer-events-none shadow-2xl rounded"
            />
            <span className="absolute top-4 right-4 bg-emerald-500/90 text-slate-950 font-black px-2.5 py-1 rounded-md text-xs uppercase tracking-wide backdrop-blur-sm shadow-md">
              Optimizado WebP (-{item.savingsPercentage}%)
            </span>
          </div>

          {/* Vertical Slider Split Handle */}
          <div
            id="slider-divider-line"
            className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 via-teal-300 to-emerald-500 cursor-ew-resize z-20 shadow-[0_0_15px_rgba(16,185,129,0.8)]"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-bold border-2 border-slate-900 flex items-center justify-center shadow-xl">
              <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Footer Guidance */}
        <div id="compare-modal-footer" className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Arrastra la barra vertical para comparar la nitidez pixel a pixel.</span>
          <span className="hidden sm:inline text-slate-500 font-mono">Formato WebP sin pérdida apreciable de calidad</span>
        </div>
      </div>
    </div>
  );
};
