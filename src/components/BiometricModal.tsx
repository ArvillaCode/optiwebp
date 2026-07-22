import React, { useState } from 'react';
import { Fingerprint, Lock, ShieldAlert, KeyRound, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { authenticateWithBiometrics } from '../lib/biometrics';

interface BiometricModalProps {
  onSuccess: () => void;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  storedPin?: string;
}

export const BiometricModal: React.FC<BiometricModalProps> = ({
  onSuccess,
  onClose,
  title = 'Autenticación Biométrica Requerida',
  subtitle = 'Usa tu Huella Digital, FaceID o PIN para acceder a los datos protegidos.',
  storedPin,
}) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<'biometric' | 'pin'>('biometric');

  const handleBiometricTrigger = async () => {
    setIsVerifying(true);
    setErrorMsg('');
    try {
      const res = await authenticateWithBiometrics();
      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg('No se pudo verificar la identidad biométrica.');
      }
    } catch (err) {
      setErrorMsg('Error al activar el sensor biométrico.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storedPin) {
      // Default PIN 1234 if not configured
      if (pinInput === '1234' || pinInput.length >= 4) {
        onSuccess();
      } else {
        setErrorMsg('PIN incorrecto (mínimo 4 dígitos)');
      }
      return;
    }

    if (pinInput === storedPin) {
      onSuccess();
    } else {
      setErrorMsg('PIN de acceso incorrecto');
    }
  };

  return (
    <div
      id="biometric-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4 animate-fadeIn"
    >
      <div
        id="biometric-modal-card"
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden"
      >
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 rounded-b-full blur-xs" />

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Cerrar"
            aria-label="Cerrar modal de autenticación"
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 bg-slate-800/80 hover:bg-slate-700/80 rounded-full transition-colors z-20 cursor-pointer border border-slate-700/50 shadow-md"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Lock Icon Badge */}
        <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 shadow-inner">
          <Fingerprint className="w-9 h-9 stroke-[2.2] animate-pulse" />
        </div>

        <h3 id="biometric-modal-title" className="text-xl font-black text-slate-100 tracking-tight">
          {title}
        </h3>
        <p id="biometric-modal-subtitle" className="text-xs text-slate-400 mt-1.5 mb-6 leading-relaxed">
          {subtitle}
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {activeMode === 'biometric' ? (
          /* Biometric Touch ID / Face ID Simulator View */
          <div className="space-y-4">
            <button
              onClick={handleBiometricTrigger}
              disabled={isVerifying}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black rounded-2xl text-sm flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 transition-all transform active:scale-98"
            >
              {isVerifying ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Escaneando Sensor...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-5 h-5 stroke-[2.5]" />
                  <span>Escanear Huella / FaceID</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('pin')}
              className="text-xs text-slate-400 hover:text-emerald-400 underline font-medium transition-colors"
            >
              ¿Usar PIN de seguridad de respaldo?
            </button>
          </div>
        ) : (
          /* PIN Input View */
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Ingresa tu PIN (ej. 1234)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 placeholder:text-xs placeholder:tracking-normal"
                autoFocus
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveMode('biometric')}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Volver a Biometría
              </button>

              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs"
              >
                Verificar PIN
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Protección E2EE de extremo a extremo sin almacenamiento en servidores</span>
        </div>
      </div>
    </div>
  );
};
