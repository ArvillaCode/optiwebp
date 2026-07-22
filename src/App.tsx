/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Converter } from './components/Converter';
import { HistoryPanel } from './components/HistoryPanel';
import { SecurityPanel } from './components/SecurityPanel';
import { CloudSyncPanel } from './components/CloudSyncPanel';
import { ImageCompareModal } from './components/ImageCompareModal';
import { CloudExportModal } from './components/CloudExportModal';
import { BiometricModal } from './components/BiometricModal';
import {
  ImageItem,
  HistoryRecord,
  OptimizationSettings,
  UserSecurityConfig,
  CloudConfig,
  StatsData,
} from './types';
import {
  getStoredHistory,
  saveHistoryRecords,
  addHistoryRecord,
  getStoredSettings,
  saveStoredSettings,
  getStoredSecurity,
  saveStoredSecurity,
  getStoredCloudConfig,
  saveStoredCloudConfig,
  getStoredStats,
  updateStatsFromHistory,
  subscribeToRealtimeSync,
  DEFAULT_SETTINGS,
  DEFAULT_SECURITY,
  DEFAULT_CLOUD,
  DEFAULT_STATS,
} from './lib/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'convert' | 'history' | 'security' | 'cloud'>('convert');

  // Core App States
  const [settings, setSettings] = useState<OptimizationSettings>(DEFAULT_SETTINGS);
  const [security, setSecurity] = useState<UserSecurityConfig>(DEFAULT_SECURITY);
  const [cloud, setCloud] = useState<CloudConfig>(DEFAULT_CLOUD);
  const [stats, setStats] = useState<StatsData>(DEFAULT_STATS);

  const [items, setItems] = useState<ImageItem[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  // Modals
  const [compareItem, setCompareItem] = useState<ImageItem | null>(null);
  const [cloudExportItems, setCloudExportItems] = useState<ImageItem[] | null>(null);
  const [showLockScreenModal, setShowLockScreenModal] = useState<boolean>(false);

  // Load Initial Stored States on Mount
  useEffect(() => {
    const loadedHistory = getStoredHistory();
    const loadedSettings = getStoredSettings();
    const loadedSecurity = getStoredSecurity();
    const loadedCloud = getStoredCloudConfig();
    const loadedStats = getStoredStats();

    setHistory(loadedHistory);
    setSettings(loadedSettings);
    setSecurity(loadedSecurity);
    setCloud(loadedCloud);
    setStats(loadedStats);

    // If app was left locked, show lock screen
    if (loadedSecurity.isLocked) {
      setShowLockScreenModal(true);
    }
  }, []);

  // Subscribe to Multi-Tab Real-time Broadcast Synchronization
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeSync(({ type, payload }) => {
      if (type === 'HISTORY_UPDATED') {
        setHistory(payload);
        const updatedStats = updateStatsFromHistory(payload);
        setStats(updatedStats);
      } else if (type === 'SETTINGS_UPDATED') {
        setSettings(payload);
      } else if (type === 'SECURITY_UPDATED') {
        setSecurity(payload);
      } else if (type === 'CLOUD_UPDATED') {
        setCloud(payload);
      } else if (type === 'STATS_UPDATED') {
        setStats(payload);
      }
    });

    return () => unsubscribe();
  }, []);

  // Save Settings Changes (Real-time Auto-save)
  const handleUpdateSettings = (newSettings: OptimizationSettings) => {
    setSettings(newSettings);
    if (cloud.autoSaveLocal) {
      saveStoredSettings(newSettings);
    }
  };

  // Save Security Changes
  const handleUpdateSecurity = (newSecurity: UserSecurityConfig) => {
    setSecurity(newSecurity);
    saveStoredSecurity(newSecurity);
  };

  // Save Cloud Config Changes
  const handleUpdateCloudConfig = (newCloud: CloudConfig) => {
    setCloud(newCloud);
    saveStoredCloudConfig(newCloud);
  };

  // Add Record to History
  const handleAddToHistory = (record: HistoryRecord) => {
    addHistoryRecord(record);
    const updated = getStoredHistory();
    setHistory(updated);
    const newStats = updateStatsFromHistory(updated);
    setStats(newStats);
  };

  // Delete Individual History Record
  const handleDeleteHistoryRecord = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    saveHistoryRecords(updated);
    const newStats = updateStatsFromHistory(updated);
    setStats(newStats);
  };

  // Clear Entire History Log
  const handleClearHistory = () => {
    setHistory([]);
    saveHistoryRecords([]);
    const newStats = updateStatsFromHistory([]);
    setStats(newStats);
  };

  // Export History Report JSON
  const handleExportHistoryReport = () => {
    const reportBlob = new Blob([JSON.stringify(history, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(reportBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optiwebp_reporte_historial_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Lock Application
  const handleLockApp = () => {
    const updated = { ...security, isLocked: true };
    setSecurity(updated);
    saveStoredSecurity(updated);
    setShowLockScreenModal(true);
  };

  // Unlock Application
  const handleUnlockSuccess = () => {
    const updated = { ...security, isLocked: false };
    setSecurity(updated);
    saveStoredSecurity(updated);
    setShowLockScreenModal(false);
  };

  // Close / Dismiss Lock Screen Modal
  const handleCloseLockScreenModal = () => {
    const updated = { ...security, isLocked: false };
    setSecurity(updated);
    saveStoredSecurity(updated);
    setShowLockScreenModal(false);
  };

  // Cloud Export Confirmation Handler
  const handleConfirmCloudExport = async (
    targetService: 'google_drive' | 'dropbox',
    folderName: string
  ) => {
    // Simulated cloud upload delay for Google Drive / Dropbox API
    await new Promise((resolve) => setTimeout(resolve, 1500));
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 antialiased">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        security={security}
        cloud={cloud}
        stats={stats}
        onLockApp={handleLockApp}
        onUnlockApp={() => setShowLockScreenModal(true)}
      />

      {/* Main Viewport Container */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'convert' && (
          <Converter
            settings={settings}
            setSettings={handleUpdateSettings}
            items={items}
            setItems={setItems}
            onAddToHistory={handleAddToHistory}
            onOpenCompare={(item) => setCompareItem(item)}
            onOpenCloudExport={(exportItems) => setCloudExportItems(exportItems)}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPanel
            history={history}
            stats={stats}
            onClearHistory={handleClearHistory}
            onDeleteRecord={handleDeleteHistoryRecord}
            onExportHistoryReport={handleExportHistoryReport}
          />
        )}

        {activeTab === 'security' && (
          <SecurityPanel
            security={security}
            onUpdateSecurity={handleUpdateSecurity}
            onTriggerLock={handleLockApp}
          />
        )}

        {activeTab === 'cloud' && (
          <CloudSyncPanel
            cloudConfig={cloud}
            onUpdateCloudConfig={handleUpdateCloudConfig}
            onReloadData={() => {
              setHistory(getStoredHistory());
              setStats(getStoredStats());
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer id="app-footer" className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">OptiWebP Studio</span>
            <span>— Convertidor & Optimizador Web con Cifrado E2EE</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Privacidad Absoluta</span>
            <span>•</span>
            <span>Sin Servidores de Terceros</span>
            <span>•</span>
            <span>Sincronización en Tiempo Real</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {compareItem && (
        <ImageCompareModal
          item={compareItem}
          onClose={() => setCompareItem(null)}
          onDownload={(item) => {
            if (!item.convertedUrl) return;
            const a = document.createElement('a');
            a.href = item.convertedUrl;
            a.download = `${item.name}_opt.webp`;
            a.click();
          }}
        />
      )}

      {cloudExportItems && (
        <CloudExportModal
          items={cloudExportItems}
          cloudConfig={cloud}
          onClose={() => setCloudExportItems(null)}
          onConfirmExport={handleConfirmCloudExport}
        />
      )}

      {showLockScreenModal && (
        <BiometricModal
          onSuccess={handleUnlockSuccess}
          storedPin={security.pinCode}
          onClose={handleCloseLockScreenModal}
        />
      )}
    </div>
  );
}
