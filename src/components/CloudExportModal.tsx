import React, { useState } from 'react';
import { X, Cloud, CheckCircle2, ArrowUpRight, FolderPlus, ExternalLink, HardDrive, Lock } from 'lucide-react';
import { ImageItem, CloudConfig } from '../types';
import { formatBytes } from '../lib/imageProcessor';

interface CloudExportModalProps {
  items: ImageItem[];
  cloudConfig: CloudConfig;
  onClose: () => void;
  onConfirmExport: (target: 'google_drive' | 'dropbox', folderName: string) => Promise<void>;
}

export const CloudExportModal: React.FC<CloudExportModalProps> = ({
  items,
  cloudConfig,
  onClose,
  onConfirmExport,
}) => {
  const [selectedService, setSelectedService] = useState<'google_drive' | 'dropbox'>('google_drive');
  const [folderName, setFolderName] = useState<string>('OptiWebP_Exportaciones');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportComplete, setExportComplete] = useState<boolean>(false);
  const [exportedUrl, setExportedUrl] = useState<string>('');

  const totalSize = items.reduce((acc, curr) => acc + (curr.convertedSize || curr.originalSize), 0);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onConfirmExport(selectedService, folderName);
      setExportComplete(true);
      if (selectedService === 'google_drive') {
        setExportedUrl(`https://drive.google.com/drive/my-drive`);
      } else {
        setExportedUrl(`https://www.dropbox.com/home/${folderName}`);
      }
    } catch (err) {
      console.error('Error al exportar a la nube:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      id="cloud-export-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="cloud-export-card"
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="btn-close-cloud-export"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!exportComplete ? (
          <div>
            {/* Modal Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-cyan-500/15 text-cyan-400 rounded-xl border border-cyan-500/30">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h3 id="cloud-export-title" className="text-lg font-bold text-slate-100">
                  Exportar a la Nube
                </h3>
                <p className="text-xs text-slate-400">
                  Sincroniza {items.length} imagen{items.length !== 1 ? 'es' : ''} ({formatBytes(totalSize)})
                </p>
              </div>
            </div>

            {/* Service Selection */}
            <div className="space-y-3 mb-5">
              <label className="text-xs font-semibold text-slate-300 block">
                Selecciona el servicio de almacenamiento:
              </label>

              {/* Google Drive option */}
              <button
                type="button"
                onClick={() => setSelectedService('google_drive')}
                className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all text-left ${
                  selectedService === 'google_drive'
                    ? 'bg-blue-500/15 border-blue-500/50 text-blue-300 shadow-md shadow-blue-500/10'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">Google Drive</h4>
                    <p className="text-xs text-slate-400">Exportación directa a carpetas compartidas</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                    Conectado
                  </span>
                  <input
                    type="radio"
                    name="cloud_service"
                    checked={selectedService === 'google_drive'}
                    onChange={() => setSelectedService('google_drive')}
                    className="accent-blue-500"
                  />
                </div>
              </button>

              {/* Dropbox option */}
              <button
                type="button"
                onClick={() => setSelectedService('dropbox')}
                className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all text-left ${
                  selectedService === 'dropbox'
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">Dropbox</h4>
                    <p className="text-xs text-slate-400">Sincronización instantánea de archivos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                    Conectado
                  </span>
                  <input
                    type="radio"
                    name="cloud_service"
                    checked={selectedService === 'dropbox'}
                    onChange={() => setSelectedService('dropbox')}
                    className="accent-cyan-500"
                  />
                </div>
              </button>
            </div>

            {/* Folder Name Input */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-emerald-400" />
                Nombre de la carpeta de destino:
              </label>
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Ej. Fotos_Optimizadas_WebP"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* E2EE Data Privacy Assurance note */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start gap-2 mb-6">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Los archivos resultantes se transfieren con cifrado en tránsito SSL y E2EE para proteger tu privacidad.
              </span>
            </div>

            {/* Export Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Exportando...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Confirmar Exportación</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Export Success View */
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-100">¡Archivos Exportados!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Los archivos WebP se han guardado exitosamente en la carpeta <strong>{folderName}</strong> de{' '}
                {selectedService === 'google_drive' ? 'Google Drive' : 'Dropbox'}.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <a
                href={exportedUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir en {selectedService === 'google_drive' ? 'Google Drive' : 'Dropbox'}</span>
              </a>

              <button
                onClick={onClose}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs"
              >
                Listo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
