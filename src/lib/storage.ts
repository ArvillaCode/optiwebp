import { HistoryRecord, UserSecurityConfig, CloudConfig, OptimizationSettings, StatsData } from '../types';
import { decryptData, encryptData } from './crypto';

const STORAGE_KEYS = {
  HISTORY: 'optiwebp_history_v1',
  SETTINGS: 'optiwebp_settings_v1',
  SECURITY: 'optiwebp_security_v1',
  CLOUD: 'optiwebp_cloud_v1',
  STATS: 'optiwebp_stats_v1',
};

// Multi-tab BroadcastChannel for real-time synchronization across windows/tabs
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('optiwebp_sync_channel');
  } catch (err) {
    console.warn('BroadcastChannel initialized in single window mode:', err);
  }
}

// Default settings
export const DEFAULT_SETTINGS: OptimizationSettings = {
  format: 'webp',
  quality: 82,
  preset: 'balanced',
  scalePercent: 100,
  maintainAspectRatio: true,
  stripMetadata: true,
};

export const DEFAULT_SECURITY: UserSecurityConfig = {
  biometricEnabled: true,
  isLocked: false,
  e2eeEnabled: true,
  autoLockMinutes: 15,
};

export const DEFAULT_CLOUD: CloudConfig = {
  autoSync: true,
  autoSaveLocal: true,
  googleDriveConnected: false,
  dropboxConnected: false,
  userEmail: 'usuario.pro@optiwebp.com',
  backupCount: 0,
};

export const DEFAULT_STATS: StatsData = {
  totalConverted: 0,
  totalBytesOriginal: 0,
  totalBytesConverted: 0,
  totalSavingsBytes: 0,
  averageSavingsPercent: 0,
};

// Subscribe to real-time tab sync events
export function subscribeToRealtimeSync(callback: (eventData: { type: string; payload: any }) => void) {
  if (!broadcastChannel) return () => {};

  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type) {
      callback(event.data);
    }
  };

  broadcastChannel.addEventListener('message', handleMessage);
  return () => {
    broadcastChannel?.removeEventListener('message', handleMessage);
  };
}

// Emit event to sync tabs
export function emitRealtimeSync(type: string, payload: any) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type, payload });
    } catch (err) {
      console.warn('Sync broadcast warning:', err);
    }
  }
}

// Save & Load History Records
export function getStoredHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistoryRecords(history: HistoryRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    emitRealtimeSync('HISTORY_UPDATED', history);
  } catch (err) {
    console.error('Error auto-saving history:', err);
  }
}

export function addHistoryRecord(record: HistoryRecord) {
  const existing = getStoredHistory();
  const updated = [record, ...existing.filter((item) => item.id !== record.id)].slice(0, 100);
  saveHistoryRecords(updated);
  updateStatsFromHistory(updated);
}

// Save & Load Settings
export function getStoredSettings(): OptimizationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: OptimizationSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    emitRealtimeSync('SETTINGS_UPDATED', settings);
  } catch (err) {
    console.error('Error auto-saving settings:', err);
  }
}

// Security config
export function getStoredSecurity(): UserSecurityConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SECURITY);
    return raw ? JSON.parse(raw) : DEFAULT_SECURITY;
  } catch {
    return DEFAULT_SECURITY;
  }
}

export function saveStoredSecurity(security: UserSecurityConfig) {
  try {
    localStorage.setItem(STORAGE_KEYS.SECURITY, JSON.stringify(security));
    emitRealtimeSync('SECURITY_UPDATED', security);
  } catch (err) {
    console.error('Error auto-saving security:', err);
  }
}

// Cloud config
export function getStoredCloudConfig(): CloudConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLOUD);
    return raw ? JSON.parse(raw) : DEFAULT_CLOUD;
  } catch {
    return DEFAULT_CLOUD;
  }
}

export function saveStoredCloudConfig(cloud: CloudConfig) {
  try {
    localStorage.setItem(STORAGE_KEYS.CLOUD, JSON.stringify(cloud));
    emitRealtimeSync('CLOUD_UPDATED', cloud);
  } catch (err) {
    console.error('Error auto-saving cloud config:', err);
  }
}

// Stats recalculation
export function getStoredStats(): StatsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    return raw ? JSON.parse(raw) : DEFAULT_STATS;
  } catch {
    return DEFAULT_STATS;
  }
}

export function updateStatsFromHistory(history: HistoryRecord[]) {
  if (history.length === 0) {
    const reset = DEFAULT_STATS;
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(reset));
    emitRealtimeSync('STATS_UPDATED', reset);
    return reset;
  }

  let totalOriginal = 0;
  let totalConverted = 0;
  let totalSavingsPercentSum = 0;

  history.forEach((h) => {
    totalOriginal += h.originalSize;
    totalConverted += h.convertedSize;
    totalSavingsPercentSum += h.savingsPercentage;
  });

  const totalSavingsBytes = Math.max(0, totalOriginal - totalConverted);
  const averageSavingsPercent = Math.round((totalSavingsPercentSum / history.length) * 10) / 10;

  const stats: StatsData = {
    totalConverted: history.length,
    totalBytesOriginal: totalOriginal,
    totalBytesConverted: totalConverted,
    totalSavingsBytes,
    averageSavingsPercent,
  };

  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  emitRealtimeSync('STATS_UPDATED', stats);
  return stats;
}

// Backup Generator with optional E2EE Encryption
export async function exportEncryptedBackup(passphrase?: string): Promise<Blob> {
  const backupObject = {
    app: 'OptiWebP Studio',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    history: getStoredHistory(),
    settings: getStoredSettings(),
    cloud: getStoredCloudConfig(),
    stats: getStoredStats(),
  };

  if (passphrase) {
    const encryptedPayload = await encryptData(backupObject, passphrase);
    return new Blob([JSON.stringify({ e2ee: true, ...encryptedPayload }, null, 2)], {
      type: 'application/json',
    });
  }

  return new Blob([JSON.stringify(backupObject, null, 2)], { type: 'application/json' });
}

// Backup Import
export async function importBackup(fileContent: string, passphrase?: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(fileContent);
    let data = parsed;

    if (parsed.e2ee) {
      if (!passphrase) {
        throw new Error('Esta copia de seguridad requiere una contraseña E2EE.');
      }
      const decryptedString = await decryptData(
        parsed.ciphertextHex,
        parsed.ivHex,
        parsed.saltHex,
        passphrase
      );
      data = JSON.parse(decryptedString);
    }

    if (data.history) saveHistoryRecords(data.history);
    if (data.settings) saveStoredSettings(data.settings);
    if (data.cloud) saveStoredCloudConfig(data.cloud);

    return true;
  } catch (err: any) {
    throw new Error(err.message || 'Error al importar la copia de seguridad.');
  }
}
