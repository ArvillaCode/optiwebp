import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Sliders,
  Zap,
  Download,
  Trash2,
  CheckCircle2,
  FileImage,
  Sparkles,
  ArrowRightLeft,
  Cloud,
  Layers,
  Info,
  Maximize2,
  Lock,
  RefreshCw,
  ChevronDown,
  Eye
} from 'lucide-react';
import { OptimizationSettings, OutputFormat, CompressionPreset, ImageItem } from '../types';
import { processImage, createBatchZip, formatBytes } from '../lib/imageProcessor';
import { ImagePreviewModal, PreviewImageData } from './ImagePreviewModal';

interface ConverterProps {
  settings: OptimizationSettings;
  setSettings: (settings: OptimizationSettings) => void;
  items: ImageItem[];
  setItems: React.Dispatch<React.SetStateAction<ImageItem[]>>;
  onAddToHistory: (record: any) => void;
  onOpenCompare: (item: ImageItem) => void;
  onOpenCloudExport: (items: ImageItem[]) => void;
}

export const Converter: React.FC<ConverterProps> = ({
  settings,
  setSettings,
  items,
  setItems,
  onAddToHistory,
  onOpenCompare,
  onOpenCloudExport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [targetSizeInput, setTargetSizeInput] = useState<string>('');
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<PreviewImageData | null>(null);

  const handleOpenPreviewItem = (item: ImageItem) => {
    const url = item.convertedUrl || item.originalPreviewUrl;
    if (!url) return;

    setPreviewData({
      title: item.name,
      url: url,
      originalUrl: item.originalPreviewUrl,
      format: item.convertedFormat || item.originalType.replace('image/', ''),
      size: item.convertedSize || item.originalSize,
      originalSize: item.status === 'completed' ? item.originalSize : undefined,
      savingsPercentage: item.savingsPercentage,
    });
  };

  // Handle Preset Changes
  const handlePresetChange = (preset: CompressionPreset) => {
    let newSettings: OptimizationSettings = { ...settings, preset };
    switch (preset) {
      case 'web-fast':
        newSettings.quality = 75;
        newSettings.format = 'webp';
        newSettings.scalePercent = 85;
        break;
      case 'balanced':
        newSettings.quality = 82;
        newSettings.format = 'webp';
        newSettings.scalePercent = 100;
        break;
      case 'high-quality':
        newSettings.quality = 92;
        newSettings.format = 'webp';
        newSettings.scalePercent = 100;
        break;
      case 'max-compression':
        newSettings.quality = 55;
        newSettings.format = 'webp';
        newSettings.scalePercent = 60;
        break;
      default:
        break;
    }
    setSettings(newSettings);
  };

  // Add Files to Queue
  const handleFilesAdded = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validImageFiles = fileArray.filter((f) => f.type.startsWith('image/'));

    if (validImageFiles.length === 0) return;

    const newItems: ImageItem[] = validImageFiles.map((file) => {
      const id = 'img_' + Math.random().toString(36).substr(2, 9);
      const url = URL.createObjectURL(file);

      // Default dimensions estimation, updated on load
      return {
        id,
        file,
        name: file.name,
        originalSize: file.size,
        originalWidth: 0,
        originalHeight: 0,
        originalType: file.type || 'image/jpeg',
        originalPreviewUrl: url,
        status: 'pending',
        progress: 0,
        timestamp: Date.now(),
      };
    });

    setItems((prev) => [...prev, ...newItems]);
  };

  // Drag and Drop Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  // Single File Conversion Execution
  const processSingleItem = async (item: ImageItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'processing', progress: 10 } : i))
    );

    try {
      const activeSettings: OptimizationSettings = {
        ...settings,
        maxTargetSizeKB: targetSizeInput ? parseFloat(targetSizeInput) : undefined,
      };

      const result = await processImage(item.file, activeSettings, (prog) => {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, progress: prog } : i)));
      });

      const updatedItem: ImageItem = {
        ...item,
        status: 'completed',
        progress: 100,
        convertedBlob: result.blob,
        convertedUrl: result.dataUrl,
        convertedSize: result.size,
        convertedWidth: result.width,
        convertedHeight: result.height,
        convertedFormat: result.format,
        savingsPercentage: result.savingsPercentage,
        conversionTimeMs: result.conversionTimeMs,
      };

      setItems((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)));

      // Add to persistent conversion history log
      onAddToHistory({
        id: updatedItem.id,
        name: updatedItem.name,
        originalSize: updatedItem.originalSize,
        convertedSize: result.size,
        savingsPercentage: result.savingsPercentage,
        format: result.format,
        timestamp: Date.now(),
        thumbnailUrl: result.dataUrl,
        dataUrl: result.base64DataUrl || result.dataUrl,
      });
    } catch (err: any) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'error', errorMessage: err.message || 'Error en conversión' }
            : i
        )
      );
    }
  };

  // Batch Process All Pending Files
  const handleProcessAll = async () => {
    setIsBatchProcessing(true);
    const pendingItems = items.filter((i) => i.status === 'pending' || i.status === 'error');

    for (const item of pendingItems) {
      await processSingleItem(item);
    }
    setIsBatchProcessing(false);
  };

  // Download All as .ZIP Archive
  const handleDownloadZip = async () => {
    const completed = items.filter((i) => i.status === 'completed' && i.convertedBlob);
    if (completed.length === 0) return;

    const zipItems = completed.map((i) => ({
      name: i.name,
      blob: i.convertedBlob!,
      format: i.convertedFormat || settings.format,
    }));

    const zipBlob = await createBatchZip(zipItems);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optiwebp_lote_${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Individual Download
  const handleDownloadSingle = (item: ImageItem) => {
    if (!item.convertedUrl) return;
    const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
    const ext = item.convertedFormat === 'jpeg' ? 'jpg' : item.convertedFormat || 'webp';
    const fileName = `${baseName}_opt.${ext}`;

    const a = document.createElement('a');
    a.href = item.convertedUrl;
    a.download = fileName;
    a.click();
  };

  const completedCount = items.filter((i) => i.status === 'completed').length;

  return (
    <div id="converter-tab-content" className="space-y-6 animate-fadeIn">
      
      {/* Top Banner & Control Settings Panel */}
      <div id="settings-card" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-100">Ajustes de Optimización WebP</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Configura el formato, la calidad visual y el tamaño para lograr cargas instantáneas en la web.
            </p>
          </div>

          {/* Preset Buttons */}
          <div id="preset-selector" className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 px-2">Presets:</span>
            <button
              onClick={() => handlePresetChange('web-fast')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                settings.preset === 'web-fast'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              🚀 Web Rápido
            </button>

            <button
              onClick={() => handlePresetChange('balanced')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                settings.preset === 'balanced'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              ⚖️ Equilibrado
            </button>

            <button
              onClick={() => handlePresetChange('high-quality')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                settings.preset === 'high-quality'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              💎 Máxima Calidad
            </button>

            <button
              onClick={() => handlePresetChange('max-compression')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                settings.preset === 'max-compression'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              📦 Máx. Compresión
            </button>
          </div>
        </div>

        {/* Detailed Controls Grid */}
        <div id="detailed-controls-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-5">
          
          {/* Format Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Formato de Salida
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              {(['webp', 'jpeg', 'png', 'avif'] as OutputFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setSettings({ ...settings, format: fmt, preset: 'custom' })}
                  className={`py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                    settings.format === fmt
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {fmt} {fmt === 'webp' && '⭐'}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              WebP es el estándar moderno óptimo para navegadores web.
            </span>
          </div>

          {/* Quality Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Nivel de Calidad
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {settings.quality}%
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={100}
              value={settings.quality}
              onChange={(e) =>
                setSettings({ ...settings, quality: parseInt(e.target.value), preset: 'custom' })
              }
              className="w-full accent-emerald-400 bg-slate-950 rounded-lg h-2 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>Menor peso (-85%)</span>
              <span>Sin Pérdida (100%)</span>
            </div>
          </div>

          {/* Scale & Resize Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Escala de Imagen
              </label>
              <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                {settings.scalePercent}%
              </span>
            </div>
            <input
              type="range"
              min={25}
              max={100}
              step={5}
              value={settings.scalePercent}
              onChange={(e) =>
                setSettings({ ...settings, scalePercent: parseInt(e.target.value), preset: 'custom' })
              }
              className="w-full accent-teal-400 bg-slate-950 rounded-lg h-2 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>25% Móvil</span>
              <span>100% Original</span>
            </div>
          </div>

          {/* Advanced Constraints & Strip Metadata */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Límite de Peso Objetivo (Opcional)
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="Ej. 150"
                value={targetSizeInput}
                onChange={(e) => setTargetSizeInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">KB</span>
            </div>

            <label className="flex items-center gap-2 pt-1 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.stripMetadata}
                onChange={(e) => setSettings({ ...settings, stripMetadata: e.target.checked })}
                className="rounded accent-emerald-400 w-4 h-4 bg-slate-950"
              />
              <span>Eliminar Metadatos EXIF / Privacidad</span>
            </label>
          </div>
        </div>

        {/* Resolution Preset Section (4K, 2K, 1080p, 720p, Original) */}
        <div id="resolution-selector-container" className="pt-4 mt-5 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Resolución y Tamaño Objetivo (4K, 2K, Full HD)</span>
            </label>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
              {settings.resolutionPreset === '4k' && '✨ Ultra HD 4K (3840 px max)'}
              {settings.resolutionPreset === '2k' && '🖥️ QHD 2K (2560 px max)'}
              {settings.resolutionPreset === '1080p' && '📺 Full HD (1920 px max)'}
              {settings.resolutionPreset === '720p' && '📱 HD (1280 px max)'}
              {(!settings.resolutionPreset || settings.resolutionPreset === 'original') && `🖼️ Original (${settings.scalePercent}% Escala)`}
              {settings.resolutionPreset === 'custom' && '⚙️ Personalizado'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => setSettings({ ...settings, resolutionPreset: '4k', preset: 'custom' })}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                settings.resolutionPreset === '4k'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 border-teal-300 shadow-lg shadow-teal-500/20'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <span className="text-[12px]">✨ 4K Ultra HD</span>
              <span className="text-[10px] opacity-80 font-mono">3840 px max</span>
            </button>

            <button
              type="button"
              onClick={() => setSettings({ ...settings, resolutionPreset: '2k', preset: 'custom' })}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                settings.resolutionPreset === '2k'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 border-teal-300 shadow-lg shadow-teal-500/20'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <span className="text-[12px]">🖥️ 2K QHD</span>
              <span className="text-[10px] opacity-80 font-mono">2560 px max</span>
            </button>

            <button
              type="button"
              onClick={() => setSettings({ ...settings, resolutionPreset: '1080p', preset: 'custom' })}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                settings.resolutionPreset === '1080p'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 border-teal-300 shadow-lg shadow-teal-500/20'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <span className="text-[12px]">📺 Full HD</span>
              <span className="text-[10px] opacity-80 font-mono">1920 px max</span>
            </button>

            <button
              type="button"
              onClick={() => setSettings({ ...settings, resolutionPreset: '720p', preset: 'custom' })}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                settings.resolutionPreset === '720p'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 border-teal-300 shadow-lg shadow-teal-500/20'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <span className="text-[12px]">📱 HD 720p</span>
              <span className="text-[10px] opacity-80 font-mono">1280 px max</span>
            </button>

            <button
              type="button"
              onClick={() => setSettings({ ...settings, resolutionPreset: 'original', preset: 'custom' })}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border col-span-2 sm:col-span-1 cursor-pointer ${
                !settings.resolutionPreset || settings.resolutionPreset === 'original'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 border-teal-300 shadow-lg shadow-teal-500/20'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <span className="text-[12px]">🖼️ Original / %</span>
              <span className="text-[10px] opacity-80 font-mono">{settings.scalePercent}% Escala</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        id="drag-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-emerald-500/50 bg-slate-900/60 hover:bg-slate-900/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
        />

        <div className="max-w-md mx-auto space-y-3 pointer-events-none">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-cyan-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg">
            <UploadCloud className="w-8 h-8 animate-bounce-slow" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-100">
              Arrastra y suelta tus imágenes pesadas aquí
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Soporta conversión individual o por lotes en formatos PNG, JPG, WEBP, AVIF, GIF
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2">
            <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700">
              Examinar archivos
            </span>
            <span className="text-xs text-slate-500">o pega desde el portapapeles</span>
          </div>
        </div>
      </div>

      {/* Batch Processing Queue & Action Bar */}
      {items.length > 0 && (
        <div id="batch-queue-container" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          
          {/* Action Header */}
          <div id="batch-action-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                Cola de Conversión por Lotes ({items.length})
              </h3>
              <p className="text-xs text-slate-400">
                {completedCount} de {items.length} imágenes optimizadas exitosamente.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-clear-queue"
                onClick={() => setItems([])}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>

              {completedCount > 0 && (
                <>
                  <button
                    id="btn-cloud-export-batch"
                    onClick={() => onOpenCloudExport(items.filter((i) => i.status === 'completed'))}
                    className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-cyan-500/40"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Nube (Drive/Dropbox)</span>
                  </button>

                  <button
                    id="btn-download-zip"
                    onClick={handleDownloadZip}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Lote (.ZIP)</span>
                  </button>
                </>
              )}

              {/* Split Dropdown Button for Batch Conversion */}
              <div id="btn-process-all-group" className="relative inline-flex items-stretch rounded-xl shadow-lg shadow-emerald-500/20">
                <button
                  id="btn-process-all"
                  type="button"
                  onClick={handleProcessAll}
                  disabled={isBatchProcessing || items.every((i) => i.status === 'completed')}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-l-xl text-xs flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                  title={`Convertir todo al formato ${settings.format.toUpperCase()}`}
                >
                  {isBatchProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Optimizando...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-slate-950" />
                      <span>Convertir Todo a {settings.format.toUpperCase()}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
                  disabled={isBatchProcessing}
                  title="Cambiar formato de salida"
                  className="px-2.5 py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded-r-xl text-xs border-l border-slate-950/20 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isFormatDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Overlay */}
                {isFormatDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsFormatDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-fadeIn">
                      <div className="text-[10px] font-bold text-slate-400 px-2.5 py-1 uppercase tracking-wider mb-1">
                        Seleccionar Formato
                      </div>

                      <div className="space-y-1">
                        {(['webp', 'jpeg', 'png', 'avif'] as OutputFormat[]).map((fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => {
                              setSettings({ ...settings, format: fmt, preset: 'custom' });
                              setIsFormatDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                              settings.format === fmt
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'text-slate-200 hover:bg-slate-800'
                            }`}
                          >
                            <span className="uppercase tracking-wide">{fmt} {fmt === 'webp' && '⭐'}</span>
                            {settings.format === fmt && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-slate-800 my-2"></div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsFormatDropdownOpen(false);
                          handleProcessAll();
                        }}
                        disabled={isBatchProcessing || items.every((i) => i.status === 'completed')}
                        className="w-full text-center px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-lg text-xs hover:from-emerald-400 hover:to-teal-400 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Iniciar en {settings.format.toUpperCase()}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Queue Item List */}
          <div id="batch-item-list" className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition-all"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleOpenPreviewItem(item)}
                    className="relative w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 overflow-hidden shrink-0 group cursor-pointer transition-colors"
                    title="Clic para previsualizar imagen"
                  >
                    <img
                      src={item.convertedUrl || item.originalPreviewUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye className="w-4 h-4 text-emerald-400" />
                    </div>
                  </button>

                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => handleOpenPreviewItem(item)}
                      className="text-xs font-bold text-slate-200 hover:text-emerald-400 truncate text-left block cursor-pointer transition-colors"
                      title="Previsualizar imagen"
                    >
                      {item.name}
                    </button>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                      <span>Orig: {formatBytes(item.originalSize)}</span>
                      {item.convertedSize && (
                        <>
                          <span>→</span>
                          <span className="text-emerald-400 font-bold">
                            {item.convertedFormat?.toUpperCase()}: {formatBytes(item.convertedSize)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle: Progress Bar & Status */}
                <div className="flex-1 max-w-xs">
                  {item.status === 'processing' && (
                    <div className="space-y-1">
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Procesando {item.progress}%</span>
                    </div>
                  )}

                  {item.status === 'completed' && (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        -{item.savingsPercentage}% reducido
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{item.conversionTimeMs} ms</span>
                    </div>
                  )}

                  {item.status === 'pending' && (
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                      Listo para convertir
                    </span>
                  )}

                  {item.status === 'error' && (
                    <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      {item.errorMessage || 'Error'}
                    </span>
                  )}
                </div>

                {/* Right: Item Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenPreviewItem(item)}
                    className="p-2 text-slate-300 hover:text-teal-300 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 hover:border-teal-500/40 transition-colors cursor-pointer"
                    title="Previsualizar imagen"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {item.status === 'completed' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenCompare(item)}
                        className="p-2 text-slate-300 hover:text-emerald-400 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors cursor-pointer"
                        title="Ver comparativa Antes / Después"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(item)}
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 border border-emerald-500/30 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Guardar</span>
                      </button>
                    </>
                  )}

                  {item.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => processSingleItem(item)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-md shadow-emerald-500/10 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Convertir</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                    className="p-2 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar de la lista"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Render Image Preview Modal */}
      <ImagePreviewModal
        data={previewData}
        onClose={() => setPreviewData(null)}
      />
    </div>
  );
};
