import React, { useState, useRef } from 'react';
import {
  Cloud,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  Upload,
  Download,
  ShieldCheck,
  FolderSync,
  Sparkles,
  Save,
  Clock,
  ExternalLink
} from 'lucide-react';
import { CloudConfig } from '../types';
import { exportEncryptedBackup, importBackup } from '../lib/storage';

interface CloudSyncPanelProps {
  cloudConfig: CloudConfig;
  onUpdateCloudConfig: (config: CloudConfig) => void;
  onReloadData: () => void;
}

export const CloudSyncPanel: React.FC<CloudSyncPanelProps> = ({
  cloudConfig,
  onUpdateCloudConfig,
  onReloadData,
}) => {
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [passphrase, setPassphrase] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isBackupLoading, setIsBackupLoading] = useState<boolean>(false);

  // Toggle Google Drive / Dropbox connections
  const handleToggleService = (service: 'googleDriveConnected' | 'dropboxConnected') => {
    const updated = { ...cloudConfig, [service]: !cloudConfig[service] };
    onUpdateCloudConfig(updated);
    setStatusMsg({
      type: 'success',
      text: `${service === 'googleDriveConnected' ? 'Google Drive' : 'Dropbox'} ${
        updated[service] ? 'conectado' : 'desconectado'
      } para exportación directa.`,
    });
  };

  // Generate & Download Backup File
  const handleExportBackup = async () => {
    setIsBackupLoading(true);
    try {
      const blob = await exportEncryptedBackup(passphrase || undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `optiwebp_copia_seguridad_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      onUpdateCloudConfig({
        ...cloudConfig,
        lastBackupTimestamp: Date.now(),
        backupCount: cloudConfig.backupCount + 1,
      });

      setStatusMsg({ type: 'success', text: 'Copia de seguridad exportada exitosamente.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error al generar la copia de seguridad.' });
    } finally {
      setIsBackupLoading(false);
    }
  };

  // Import Backup File
  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        await importBackup(content, passphrase || undefined);
        onReloadData();
        setStatusMsg({ type: 'success', text: 'Copia de seguridad restaurada exitosamente.' });
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: err.message || 'Error al importar la copia.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div id="cloud-sync-tab-content" className="space-y-6 animate-fadeIn">
      
      {/* Top Banner */}
      <div id="cloud-banner-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30">
              <Cloud className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Sincronización en la Nube & Copias de Seguridad
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Conecta tus cuentas de Google Drive y Dropbox para exportar tus imágenes WebP y mantenerlas sincronizadas en tiempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin-slow shrink-0" />
            <span className="text-xs text-slate-300 font-medium">Sincronización Multidispositivo Activa</span>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs border flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Cloud Integrations Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Google Drive Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Google Drive</h3>
                <p className="text-xs text-slate-400">Exporta imágenes WebP directamente a Google Drive</p>
              </div>
            </div>

            <button
              onClick={() => handleToggleService('googleDriveConnected')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                cloudConfig.googleDriveConnected
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cloudConfig.googleDriveConnected ? 'Conectado' : 'Conectar'}
            </button>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Sincronización automática de lotes:</span>
            <span className={cloudConfig.googleDriveConnected ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              {cloudConfig.googleDriveConnected ? 'Habilitado' : 'Inactivo'}
            </span>
          </div>
        </div>

        {/* Dropbox Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Dropbox</h3>
                <p className="text-xs text-slate-400">Exporta imágenes optimizadas a tu cuenta de Dropbox</p>
              </div>
            </div>

            <button
              onClick={() => handleToggleService('dropboxConnected')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                cloudConfig.dropboxConnected
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cloudConfig.dropboxConnected ? 'Conectado' : 'Conectar'}
            </button>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Sincronización automática de lotes:</span>
            <span className={cloudConfig.dropboxConnected ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              {cloudConfig.dropboxConnected ? 'Habilitado' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      {/* Auto-Save & Automatic Backup Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <FolderSync className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-slate-100">
            Autoguardado en Tiempo Real & Copia de Seguridad Automática
          </h3>
        </div>

        {/* Auto save toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Save className="w-4 h-4 text-emerald-400" />
                Autoguardado Local
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Guarda los ajustes y el historial automáticamente en tiempo real.
              </p>
            </div>
            <input
              type="checkbox"
              checked={cloudConfig.autoSaveLocal}
              onChange={(e) =>
                onUpdateCloudConfig({ ...cloudConfig, autoSaveLocal: e.target.checked })
              }
              className="w-5 h-5 accent-emerald-400 bg-slate-950"
            />
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                Sync Multidispositivo
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Sincroniza pestañas y ventanas abiertas mediante BroadcastChannel.
              </p>
            </div>
            <input
              type="checkbox"
              checked={cloudConfig.autoSync}
              onChange={(e) =>
                onUpdateCloudConfig({ ...cloudConfig, autoSync: e.target.checked })
              }
              className="w-5 h-5 accent-cyan-400 bg-slate-950"
            />
          </div>
        </div>

        {/* Manual Encrypted Backup Generator */}
        <div className="pt-2 space-y-4">
          <label className="text-xs font-bold text-slate-300 block">
            Generar o Restaurar Copia de Seguridad (.JSON Cifrado E2EE)
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="password"
              placeholder="Contraseña E2EE (Opcional para cifrar)"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportBackup}
                disabled={isBackupLoading}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Copia</span>
              </button>

              <button
                onClick={() => backupInputRef.current?.click()}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Restaurar Copia</span>
              </button>
              <input
                ref={backupInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportBackupFile}
              />
            </div>
          </div>

          {cloudConfig.lastBackupTimestamp && (
            <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Última copia realizada el:{' '}
              {new Date(cloudConfig.lastBackupTimestamp).toLocaleString('es-ES')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
