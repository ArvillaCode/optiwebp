import JSZip from 'jszip';
import { OptimizationSettings, OutputFormat } from '../types';

/**
 * Image Processor engine converting files to optimized WebP/JPEG/PNG/AVIF
 */

export interface ProcessedImageResult {
  blob: Blob;
  dataUrl: string;
  base64DataUrl?: string;
  size: number;
  width: number;
  height: number;
  format: OutputFormat;
  savingsPercentage: number;
  conversionTimeMs: number;
}

// Convert format string to MIME type
export function getMimeType(format: OutputFormat): string {
  switch (format) {
    case 'webp': return 'image/webp';
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'avif': return 'image/avif';
    case 'gif': return 'image/gif';
    default: return 'image/webp';
  }
}

// Check format support
export function isFormatSupported(mimeType: string): Promise<boolean> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    canvas.toBlob((blob) => {
      resolve(!!blob && blob.type === mimeType);
    }, mimeType);
  });
}

// Read image dimensions and create HTMLImageElement
export function loadImageFromFile(file: File): Promise<{ img: HTMLImageElement; url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        img,
        url,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo cargar la imagen. Verifica que sea un archivo válido.'));
    };
    img.src = url;
  });
}

// Convert a single image file with the specified optimization settings
export async function processImage(
  file: File,
  settings: OptimizationSettings,
  onProgress?: (progress: number) => void
): Promise<ProcessedImageResult> {
  const startTime = performance.now();
  if (onProgress) onProgress(15);

  const { img, width: origWidth, height: origHeight } = await loadImageFromFile(file);
  if (onProgress) onProgress(35);

  // Calculate target dimensions
  let targetWidth = origWidth;
  let targetHeight = origHeight;

  if (settings.resolutionPreset && settings.resolutionPreset !== 'original' && settings.resolutionPreset !== 'custom') {
    let targetMaxDim = 0;
    if (settings.resolutionPreset === '4k') targetMaxDim = 3840;
    else if (settings.resolutionPreset === '2k') targetMaxDim = 2560;
    else if (settings.resolutionPreset === '1080p') targetMaxDim = 1920;
    else if (settings.resolutionPreset === '720p') targetMaxDim = 1280;

    if (targetMaxDim > 0) {
      const origMax = Math.max(origWidth, origHeight);
      const ratio = targetMaxDim / origMax;
      targetWidth = Math.max(1, Math.round(origWidth * ratio));
      targetHeight = Math.max(1, Math.round(origHeight * ratio));
    }
  } else if (settings.scalePercent && settings.scalePercent !== 100) {
    const scale = settings.scalePercent / 100;
    targetWidth = Math.max(1, Math.round(origWidth * scale));
    targetHeight = Math.max(1, Math.round(origHeight * scale));
  } else if (settings.customWidth || settings.customHeight) {
    if (settings.maintainAspectRatio) {
      if (settings.customWidth) {
        targetWidth = settings.customWidth;
        targetHeight = Math.round((origHeight / origWidth) * settings.customWidth);
      } else if (settings.customHeight) {
        targetHeight = settings.customHeight;
        targetWidth = Math.round((origWidth / origHeight) * settings.customHeight);
      }
    } else {
      if (settings.customWidth) targetWidth = settings.customWidth;
      if (settings.customHeight) targetHeight = settings.customHeight;
    }
  }

  // Draw image on canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Error al inicializar el contexto 2D de renderizado.');
  }

  // Smooth rendering settings for high quality optimization
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fill background white for JPEG if original had transparency
  if (settings.format === 'jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  if (onProgress) onProgress(65);

  let mimeType = getMimeType(settings.format);
  
  // Verify AVIF support or fallback to WebP
  if (settings.format === 'avif') {
    const avifSupported = await isFormatSupported('image/avif');
    if (!avifSupported) {
      mimeType = 'image/webp';
    }
  }

  // Quality calculation: settings.quality is 10 to 100, mapped to 0.1 to 1.0
  let qualityValue = Math.min(1, Math.max(0.05, settings.quality / 100));

  // Binary search target size if maxTargetSizeKB is specified
  if (settings.maxTargetSizeKB && settings.maxTargetSizeKB > 0) {
    const targetSizeBytes = settings.maxTargetSizeKB * 1024;
    let low = 0.05;
    let high = 1.0;
    let bestBlob: Blob | null = null;

    for (let i = 0; i < 5; i++) {
      const midQuality = (low + high) / 2;
      const trialBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, mimeType, midQuality));
      if (trialBlob) {
        bestBlob = trialBlob;
        if (trialBlob.size > targetSizeBytes) {
          high = midQuality;
        } else {
          low = midQuality;
        }
      }
    }
    if (bestBlob) {
      qualityValue = (low + high) / 2;
    }
  }

  if (onProgress) onProgress(80);

  // Generate Blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error(`No se pudo generar el formato ${settings.format}`));
      },
      mimeType,
      qualityValue
    );
  });

  if (onProgress) onProgress(95);

  const dataUrl = URL.createObjectURL(blob);
  let base64DataUrl: string | undefined = undefined;
  try {
    // Generate base64 data URL for history persistence and zip export
    base64DataUrl = canvas.toDataURL(mimeType, qualityValue);
  } catch (err) {
    console.warn('No se pudo generar dataURL base64:', err);
  }

  const endTime = performance.now();
  const conversionTimeMs = Math.round(endTime - startTime);

  // Compute savings
  const originalSize = file.size;
  const convertedSize = blob.size;
  const savings = originalSize > 0 ? ((originalSize - convertedSize) / originalSize) * 100 : 0;
  const savingsPercentage = Math.round(savings * 10) / 10;

  if (onProgress) onProgress(100);

  return {
    blob,
    dataUrl,
    base64DataUrl,
    size: convertedSize,
    width: targetWidth,
    height: targetHeight,
    format: settings.format,
    savingsPercentage,
    conversionTimeMs,
  };
}

// Generate ZIP file for batch download
export async function createBatchZip(
  items: Array<{ name: string; blob: Blob; format: OutputFormat }>
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('imagenes_optimizadas_webp');

  items.forEach((item) => {
    const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
    const extension = item.format === 'jpeg' ? 'jpg' : item.format;
    const fileName = `${baseName}_opt.` + extension;
    folder?.file(fileName, item.blob);
  });

  return await zip.generateAsync({ type: 'blob' });
}

// Generate ZIP file for History download (contains images, JSON report, and TXT summary)
export async function createHistoryZip(
  historyRecords: Array<{
    id: string;
    name: string;
    originalSize: number;
    convertedSize: number;
    savingsPercentage: number;
    format: OutputFormat;
    timestamp: number;
    dataUrl?: string;
    thumbnailUrl?: string;
  }>
): Promise<Blob> {
  const zip = new JSZip();
  const imgFolder = zip.folder('imagenes_optimizadas');

  // 1. Add raw JSON report file inside the ZIP
  zip.file('reporte_historial_conversiones.json', JSON.stringify(historyRecords, null, 2));

  // 2. Add human readable summary TXT file
  let summaryText = `========================================================\n`;
  summaryText += ` OptiWebP Studio - Reporte de Historial de Conversiones\n`;
  summaryText += ` Fecha de exportación: ${new Date().toLocaleString('es-ES')}\n`;
  summaryText += ` Total de imágenes en historial: ${historyRecords.length}\n`;
  summaryText += `========================================================\n\n`;

  for (let i = 0; i < historyRecords.length; i++) {
    const record = historyRecords[i];
    summaryText += `[${i + 1}] ${record.name}\n`;
    summaryText += `    - Formato salida: ${record.format.toUpperCase()}\n`;
    summaryText += `    - Tamaño original: ${formatBytes(record.originalSize)}\n`;
    summaryText += `    - Tamaño optimizado: ${formatBytes(record.convertedSize)}\n`;
    summaryText += `    - Ahorro de espacio: -${record.savingsPercentage}%\n`;
    summaryText += `    - Fecha conversión: ${new Date(record.timestamp).toLocaleString('es-ES')}\n\n`;

    // Try to extract image blob from dataUrl or thumbnailUrl
    const urlSource = record.dataUrl || record.thumbnailUrl;
    if (urlSource) {
      try {
        let blob: Blob | null = null;
        if (urlSource.startsWith('data:')) {
          const parts = urlSource.split(',');
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/webp';
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          blob = new Blob([u8arr], { type: mime });
        } else if (urlSource.startsWith('blob:')) {
          const res = await fetch(urlSource);
          blob = await res.blob();
        }

        if (blob) {
          const baseName = record.name.substring(0, record.name.lastIndexOf('.')) || record.name;
          const ext = record.format === 'jpeg' ? 'jpg' : record.format;
          const fileName = `${baseName}_opt.${ext}`;
          imgFolder?.file(fileName, blob);
        }
      } catch (err) {
        console.warn('Error al empaquetar imagen para el ZIP:', err);
      }
    }
  }

  zip.file('resumen_conversiones.txt', summaryText);

  return await zip.generateAsync({ type: 'blob' });
}

// Helper to format file size in B, KB, MB
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
