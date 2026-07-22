import React, { useState } from 'react';
import {
  History,
  Search,
  Trash2,
  Download,
  Sparkles,
  HardDrive,
  Calendar,
  CloudCheck,
  FileCheck2,
  TrendingDown,
  ArrowDown,
  Archive,
  Loader2,
  Eye
} from 'lucide-react';
import { HistoryRecord, StatsData, OutputFormat } from '../types';
import { formatBytes, createHistoryZip } from '../lib/imageProcessor';
import { ImagePreviewModal, PreviewImageData } from './ImagePreviewModal';

interface HistoryPanelProps {
  history: HistoryRecord[];
  stats: StatsData;
  onClearHistory: () => void;
  onDeleteRecord: (id: string) => void;
  onExportHistoryReport: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  stats,
  onClearHistory,
  onDeleteRecord,
  onExportHistoryReport,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<PreviewImageData | null>(null);

  const handleOpenPreview = (item: HistoryRecord) => {
    const imgUrl = item.dataUrl || item.thumbnailUrl;
    if (!imgUrl) return;

    setPreviewData({
      title: item.name,
      url: imgUrl,
      format: item.format,
      size: item.convertedSize,
      originalSize: item.originalSize,
      savingsPercentage: item.savingsPercentage,
      timestamp: item.timestamp,
    });
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFormat = filterFormat === 'all' || item.format === filterFormat;
    return matchesSearch && matchesFormat;
  });

  // Export Zip handler
  const handleExportZip = async () => {
    if (history.length === 0) return;
    setIsExportingZip(true);
    try {
      const recordsToExport = filteredHistory.length > 0 ? filteredHistory : history;
      const zipBlob = await createHistoryZip(recordsToExport);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `optiwebp_historial_imagenes_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al empaquetar archivo ZIP:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  // Single Item Download Handler
  const handleDownloadSingle = (item: HistoryRecord) => {
    const sourceUrl = item.dataUrl || item.thumbnailUrl;
    if (!sourceUrl) return;

    const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
    const ext = item.format === 'jpeg' ? 'jpg' : item.format;
    const fileName = `${baseName}_opt.${ext}`;

    const a = document.createElement('a');
    a.href = sourceUrl;
    a.download = fileName;
    a.click();
  };

  return (
    <div id="history-tab-content" className="space-y-6 animate-fadeIn">
      
      {/* Hero Analytics Cards */}
      <div id="history-stats-banner" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Espacio Ahorrado Total</span>
            <strong className="text-lg font-black text-emerald-400 font-mono">
              {formatBytes(stats.totalSavingsBytes)}
            </strong>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-teal-500/15 text-teal-400 rounded-xl border border-teal-500/20">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Imágenes Optimizadas</span>
            <strong className="text-lg font-black text-slate-100 font-mono">
              {stats.totalConverted} archivos
            </strong>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-cyan-500/15 text-cyan-400 rounded-xl border border-cyan-500/20">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Reducción Promedio</span>
            <strong className="text-lg font-black text-cyan-300 font-mono">
              -{stats.averageSavingsPercent}%
            </strong>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-blue-500/15 text-blue-400 rounded-xl border border-blue-500/20">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Ancho de Banda Ahorrado</span>
            <strong className="text-lg font-black text-blue-300 font-mono">
              {formatBytes(stats.totalBytesOriginal - stats.totalBytesConverted)}
            </strong>
          </div>
        </div>
      </div>

      {/* History Controls Bar */}
      <div id="history-controls-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en el historial de conversiones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
            />
          </div>

          {/* Format Filters & Clear History */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterFormat}
              onChange={(e) => setFilterFormat(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Todos los formatos</option>
              <option value="webp">WebP</option>
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="avif">AVIF</option>
            </select>

            {history.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleExportZip}
                  disabled={isExportingZip}
                  title="Descargar paquete .ZIP con las imágenes optimizadas y el reporte"
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-700 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  {isExportingZip ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  ) : (
                    <Archive className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                  <span>Descargar .ZIP</span>
                </button>

                <button
                  type="button"
                  onClick={onExportHistoryReport}
                  title="Descargar reporte estructurado en formato JSON"
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reporte JSON</span>
                </button>

                <button
                  type="button"
                  onClick={onClearHistory}
                  title="Borrar todo el historial de conversiones"
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-rose-500/30 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Borrar Historial</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* History Table / Card List */}
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl p-6">
            <History className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">Sin registros de conversión en el historial</p>
            <p className="text-xs text-slate-500 mt-1">
              Las conversiones procesadas aparecerán aquí registradas automáticamente con cifrado E2EE.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
              >
                {/* File Thumbnail & Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleOpenPreview(item)}
                    className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-emerald-400 group cursor-pointer transition-colors relative"
                    title="Hacer clic para previsualizar imagen"
                  >
                    {item.thumbnailUrl || item.dataUrl ? (
                      <>
                        <img src={item.thumbnailUrl || item.dataUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="w-4 h-4 text-emerald-400" />
                        </div>
                      </>
                    ) : (
                      item.format.toUpperCase()
                    )}
                  </button>

                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(item)}
                      className="text-xs font-bold text-slate-200 hover:text-emerald-400 truncate text-left block cursor-pointer transition-colors"
                      title="Previsualizar imagen"
                    >
                      {item.name}
                    </button>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      {new Date(item.timestamp).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Savings Metrics */}
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block">Original</span>
                    <span className="text-slate-400">{formatBytes(item.originalSize)}</span>
                  </div>

                  <ArrowDown className="w-3.5 h-3.5 text-slate-600 shrink-0" />

                  <div className="text-left">
                    <span className="text-slate-500 text-[10px] block">{item.format.toUpperCase()}</span>
                    <span className="text-emerald-400 font-bold">{formatBytes(item.convertedSize)}</span>
                  </div>

                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30">
                    -{item.savingsPercentage}%
                  </span>
                </div>

                {/* Action Buttons: Preview, Individual Download & Delete */}
                <div className="flex items-center gap-1 self-end sm:self-center">
                  {(item.dataUrl || item.thumbnailUrl) && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(item)}
                        className="p-1.5 text-slate-400 hover:text-teal-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800 hover:border-teal-500/40 cursor-pointer"
                        title="Previsualizar imagen"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(item)}
                        className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800 hover:border-emerald-500/40 cursor-pointer"
                        title="Descargar imagen optimizada"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => onDeleteRecord(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar registro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Render Image Preview Modal */}
      <ImagePreviewModal
        data={previewData}
        onClose={() => setPreviewData(null)}
      />
    </div>
  );
};
