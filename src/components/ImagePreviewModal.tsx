import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Eye, Sparkles, Calendar } from 'lucide-react';
import { formatBytes } from '../lib/imageProcessor';

export interface PreviewImageData {
  title: string;
  url: string;
  originalUrl?: string;
  format?: string;
  size?: number;
  originalSize?: number;
  width?: number;
  height?: number;
  savingsPercentage?: number;
  timestamp?: number;
}

interface ImagePreviewModalProps {
  data: PreviewImageData | null;
  onClose: () => void;
  onDownload?: (data: PreviewImageData) => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ data, onClose, onDownload }) => {
  if (!data || !data.url) return null;

  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const handleDownload = () => {
    if (onDownload) {
      onDownload(data);
      return;
    }

    const a = document.createElement('a');
    a.href = data.url;
    const ext = data.format ? (data.format === 'jpeg' ? 'jpg' : data.format) : 'png';
    const baseName = data.title.substring(0, data.title.lastIndexOf('.')) || data.title;
    a.download = `${baseName}_preview.${ext}`;
    a.click();
  };

  return (
    <div
      id="image-preview-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="image-preview-modal-card"
        className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div id="preview-modal-header" className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 id="preview-image-title" className="text-base font-bold text-slate-100 truncate">
                {data.title}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Previsualización en Alta Resolución</span>
                {data.format && (
                  <span className="px-2 py-0.5 bg-slate-800 text-teal-300 rounded text-[10px] uppercase font-bold border border-slate-700">
                    {data.format}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom Controls */}
            <div id="preview-zoom-controls" className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition-colors cursor-pointer"
                title="Alejar Zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-400 px-1.5">{Math.round(zoomLevel * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition-colors cursor-pointer"
                title="Acercar Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-700 transition-colors cursor-pointer"
                title="Restablecer Zoom (100%)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Cerrar Previsualización"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Stats Bar */}
        <div id="preview-stats-bar" className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-950/70 border-b border-slate-800 text-xs">
          {data.size !== undefined && (
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Tamaño Archivo</span>
              <strong className="text-emerald-400 text-sm font-mono">{formatBytes(data.size)}</strong>
            </div>
          )}

          {data.originalSize !== undefined && (
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Tamaño Original</span>
              <strong className="text-slate-300 text-sm font-mono">{formatBytes(data.originalSize)}</strong>
            </div>
          )}

          {data.savingsPercentage !== undefined && (
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Ahorro de Espacio</span>
              <strong className="text-emerald-400 text-sm font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                -{data.savingsPercentage}%
              </strong>
            </div>
          )}

          {data.timestamp && (
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Fecha de Conversión</span>
              <strong className="text-slate-300 text-xs font-mono flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-slate-500" />
                {new Date(data.timestamp).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
            </div>
          )}

          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex items-center justify-between col-span-2 sm:col-span-1">
            <span className="text-slate-400 text-[10px]">Descargar Imagen</span>
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Guardar</span>
            </button>
          </div>
        </div>

        {/* Viewport Stage */}
        <div
          id="preview-stage"
          className="relative flex-1 min-h-[380px] md:min-h-[480px] bg-slate-950 overflow-auto flex items-center justify-center p-6 select-none"
        >
          {/* Checkered Background for Transparency */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, #090d16 1px)`,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 10px 10px',
            }}
          />

          <div
            className="relative transition-transform duration-100 flex items-center justify-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <img
              src={data.url}
              alt={data.title}
              className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl border border-slate-800/80"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div id="preview-modal-footer" className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Usa los controles superiores para ajustar el zoom ({Math.round(zoomLevel * 100)}%).</span>
          <span className="text-slate-500 font-mono">OptiWebP Image Viewer</span>
        </div>
      </div>
    </div>
  );
};
