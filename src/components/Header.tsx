import React from 'react';
import {
  Zap,
  ShieldCheck,
  Fingerprint,
  Cloud,
  History,
  Sliders,
  Lock,
  RefreshCw,
  Sparkles,
  Download
} from 'lucide-react';
import { UserSecurityConfig, CloudConfig, StatsData } from '../types';
import { formatBytes } from '../lib/imageProcessor';

interface HeaderProps {
  activeTab: 'convert' | 'history' | 'security' | 'cloud';
  setActiveTab: (tab: 'convert' | 'history' | 'security' | 'cloud') => void;
  security: UserSecurityConfig;
  cloud: CloudConfig;
  stats: StatsData;
  onLockApp: () => void;
  onUnlockApp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  security,
  cloud,
  stats,
  onLockApp,
  onUnlockApp,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div id="header-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div id="header-top-row" className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Identity */}
          <div id="brand-logo-group" className="flex items-center justify-between">
            <div id="logo-wrapper" className="flex items-center gap-3">
              <div id="logo-icon-badge" className="relative p-2.5 bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 rounded-xl shadow-lg shadow-emerald-500/20 text-slate-950 font-bold">
                <Zap className="w-6 h-6 stroke-[2.5]" />
                <span id="webp-badge" className="absolute -bottom-1 -right-1 text-[9px] bg-slate-950 text-emerald-400 font-black px-1.5 py-0.5 rounded-full border border-emerald-500/50 uppercase tracking-wider">
                  WebP
                </span>
              </div>
              <div>
                <div id="app-title-line" className="flex items-center gap-2">
                  <h1 id="app-title" className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    OptiWebP <span className="text-emerald-400 font-light">Studio</span>
                  </h1>
                  <span id="version-chip" className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full font-medium border border-slate-700">
                    Pro v1.0
                  </span>
                </div>
                <p id="app-subtitle" className="text-xs text-slate-400 hidden sm:block">
                  Compresión WebP ultra-rápida, E2EE, Biometría & Nube
                </p>
              </div>
            </div>

            {/* Mobile Lock / Status Toggle */}
            <div id="mobile-quick-actions" className="flex md:hidden items-center gap-2">
              <button
                id="btn-lock-mobile"
                onClick={security.isLocked ? onUnlockApp : onLockApp}
                className={`p-2 rounded-lg border transition-all ${
                  security.isLocked
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title={security.isLocked ? 'Desbloquear con biometría' : 'Bloquear aplicación'}
              >
                {security.isLocked ? <Lock className="w-4 h-4" /> : <Fingerprint className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Key Live Status Indicators */}
          <div id="status-indicators" className="flex flex-wrap items-center gap-2 text-xs">
            {/* Savings Stat Pill */}
            <div id="savings-stat-pill" className="flex items-center gap-2 bg-emerald-950/60 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-800/50">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                Ahorro total: <strong id="stat-saved-bytes" className="font-semibold text-emerald-200">{formatBytes(stats.totalSavingsBytes)}</strong>
              </span>
            </div>

            {/* E2EE Shield Pill */}
            <div id="e2ee-status-pill" className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 text-cyan-300 px-2.5 py-1.5 rounded-lg border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>E2EE Activo</span>
            </div>

            {/* Realtime Sync Status Pill */}
            <div id="sync-status-pill" className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow shrink-0" />
              <span>Sync Tiempo Real</span>
            </div>

            {/* Lock / Security Button */}
            <button
              id="btn-lock-desktop"
              onClick={security.isLocked ? onUnlockApp : onLockApp}
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                security.isLocked
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-600'
              }`}
            >
              <Fingerprint className={`w-4 h-4 ${security.biometricEnabled ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{security.isLocked ? 'Bloqueado' : 'Seguridad & PIN'}</span>
              {security.isLocked && <Lock className="w-3.5 h-3.5 text-amber-400" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav id="main-nav-tabs" className="mt-3 flex items-center space-x-1 border-t border-slate-800/80 pt-2 overflow-x-auto scrollbar-none">
          <button
            id="tab-btn-convert"
            onClick={() => setActiveTab('convert')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'convert'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Convertidor & Lotes</span>
          </button>

          <button
            id="tab-btn-history"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap relative ${
              activeTab === 'history'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial</span>
            {stats.totalConverted > 0 && (
              <span id="history-counter-badge" className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {stats.totalConverted}
              </span>
            )}
          </button>

          <button
            id="tab-btn-security"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Biometría & E2EE</span>
          </button>

          <button
            id="tab-btn-cloud"
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'cloud'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Nube, Drive & Backup</span>
            {(cloud.googleDriveConnected || cloud.dropboxConnected) && (
              <span id="cloud-status-dot" className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
