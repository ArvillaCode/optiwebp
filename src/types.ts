export type OutputFormat = 'webp' | 'jpeg' | 'png' | 'avif' | 'gif';

export type CompressionPreset = 'custom' | 'web-fast' | 'balanced' | 'high-quality' | 'max-compression';

export interface OptimizationSettings {
  format: OutputFormat;
  quality: number; // 0.1 to 1.0 (or 10 to 100)
  preset: CompressionPreset;
  scalePercent: number; // 10 to 100
  resolutionPreset?: 'original' | '4k' | '2k' | '1080p' | '720p' | 'custom';
  customWidth?: number;
  customHeight?: number;
  maintainAspectRatio: boolean;
  stripMetadata: boolean;
  maxTargetSizeKB?: number; // target size optimization
}

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  originalSize: number; // in bytes
  originalWidth: number;
  originalHeight: number;
  originalType: string;
  originalPreviewUrl: string;
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number; // 0 to 100
  errorMessage?: string;

  // Output
  convertedBlob?: Blob;
  convertedUrl?: string;
  convertedSize?: number; // in bytes
  convertedWidth?: number;
  convertedHeight?: number;
  convertedFormat?: OutputFormat;
  savingsPercentage?: number;
  conversionTimeMs?: number;
  timestamp: number;
}

export interface HistoryRecord {
  id: string;
  name: string;
  originalSize: number;
  convertedSize: number;
  savingsPercentage: number;
  format: OutputFormat;
  timestamp: number;
  thumbnailUrl?: string;
  dataUrl?: string; // encrypted or base64 preview
  cloudSynced?: {
    drive?: boolean;
    dropbox?: boolean;
  };
}

export interface UserSecurityConfig {
  biometricEnabled: boolean;
  pinCode?: string;
  isLocked: boolean;
  e2eeEnabled: boolean;
  encryptionKeyHash?: string;
  autoLockMinutes: number;
}

export interface CloudConfig {
  autoSync: boolean;
  autoSaveLocal: boolean;
  googleDriveConnected: boolean;
  dropboxConnected: boolean;
  userEmail?: string;
  lastBackupTimestamp?: number;
  backupCount: number;
}

export interface StatsData {
  totalConverted: number;
  totalBytesOriginal: number;
  totalBytesConverted: number;
  totalSavingsBytes: number;
  averageSavingsPercent: number;
}
