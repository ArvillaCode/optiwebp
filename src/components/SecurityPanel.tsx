import React, { useState } from 'react';
import {
  ShieldCheck,
  Fingerprint,
  KeyRound,
  Lock,
  Unlock,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserSecurityConfig } from '../types';
import { registerBiometric } from '../lib/biometrics';
import { hashString } from '../lib/crypto';

interface SecurityPanelProps {
  security: UserSecurityConfig;
  onUpdateSecurity: (security: UserSecurityConfig) => void;
  onTriggerLock: () => void;
}

export const SecurityPanel: React.FC<SecurityPanelProps> = ({
  security,
  onUpdateSecurity,
  onTriggerLock,
}) => {
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [passphrase, setPassphrase] = useState<string>('');
  const [showPassphrase, setShowPassphrase] = useState<boolean>(false);
  const [msgStatus, setMsgStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Enable / Register WebAuthn Biometric Credential
  const handleToggleBiometric = async () => {
    if (!security.biometricEnabled) {
      const res = await registerBiometric();
      if (res) {
        onUpdateSecurity({ ...security, biometricEnabled: true });
        setMsgStatus({ type: 'success', text: 'Autenticación biométrica habilitada correctamente.' });
      }
    } else {
      onUpdateSecurity({ ...security, biometricEnabled: false });
      setMsgStatus({ type: 'success', text: 'Autenticación biométrica deshabilitada.' });
    }
  };

  // Save PIN code
  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setMsgStatus({ type: 'error', text: 'El PIN debe tener al menos 4 dígitos.' });
      return;
    }
    if (newPin !== confirmPin) {
      setMsgStatus({ type: 'error', text: 'Los PIN ingresados no coinciden.' });
      return;
    }

    onUpdateSecurity({ ...security, pinCode: newPin });
    setNewPin('');
    setConfirmPin('');
    setMsgStatus({ type: 'success', text: 'PIN de seguridad guardado con éxito.' });
  };

  // Enable E2EE Passphrase
  const handleSaveE2EE = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase.length < 6) {
      setMsgStatus({ type: 'error', text: 'La frase E2EE debe tener al menos 6 caracteres.' });
      return;
    }

    const hash = await hashString(passphrase);
    onUpdateSecurity({ ...security, e2eeEnabled: true, encryptionKeyHash: hash });
    setPassphrase('');
    setMsgStatus({ type: 'success', text: 'Cifrado E2EE de extremo a extremo activado.' });
  };

  return (
    <div id="security-tab-content" className="space-y-6 animate-fadeIn">
      
      {/* Banner */}
      <div id="security-banner-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Seguridad & Cifrado E2EE
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Cero Conocimiento
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Garantiza la privacidad absoluta de tus datos de imágenes mediante clave AES-256 local y acceso biométrico.
              </p>
            </div>
          </div>

          <button
            id="btn-trigger-lock-now"
            onClick={onTriggerLock}
            className="px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/10 shrink-0"
          >
            <Lock className="w-4 h-4" />
            <span>Bloquear Aplicación Ahora</span>
          </button>
        </div>
      </div>

      {msgStatus && (
        <div
          className={`p-4 rounded-xl text-xs border flex items-center gap-2 ${
            msgStatus.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          {msgStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
          <span>{msgStatus.text}</span>
        </div>
      )}

      {/* Grid for Biometric & PIN & E2EE Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Biometric WebAuthn & PIN Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Fingerprint className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100">Autenticación Biométrica (Passkey / WebAuthn)</h3>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
            <div>
              <h4 className="text-xs font-bold text-slate-200">Sensor Biométrico (Huella / FaceID)</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Permite autenticarse mediante hardware biométrico integrado.
              </p>
            </div>
            <button
              onClick={handleToggleBiometric}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                security.biometricEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                  security.biometricEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Config PIN Respaldo */}
          <form onSubmit={handleSavePin} className="space-y-3 pt-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              Configurar PIN de Respaldo (4-6 dígitos)
            </label>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="password"
                maxLength={6}
                placeholder="Nuevo PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="password"
                maxLength={6}
                placeholder="Confirmar PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700"
            >
              Guardar PIN de Respaldo
            </button>
          </form>

          {/* Auto Lock Timer */}
          <div className="pt-2">
            <label className="text-xs font-bold text-slate-300 block mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-400" />
              Bloqueo Automático por Inactividad
            </label>
            <select
              value={security.autoLockMinutes}
              onChange={(e) =>
                onUpdateSecurity({ ...security, autoLockMinutes: parseInt(e.target.value) })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value={1}>1 minuto de inactividad</option>
              <option value={5}>5 minutos de inactividad</option>
              <option value={15}>15 minutos de inactividad</option>
              <option value={60}>1 hora de inactividad</option>
              <option value={0}>Nunca bloquear automáticamente</option>
            </select>
          </div>
        </div>

        {/* E2EE Master Key Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">Encriptación de Extremo a Extremo (AES-256)</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Tus datos de historial y copias de seguridad de imágenes se cifran localmente con una frase maestra de paso antes de guardarse en el almacenamiento del navegador o la nube.
          </p>

          <form onSubmit={handleSaveE2EE} className="space-y-3">
            <label className="text-xs font-bold text-slate-300 block">
              Establecer Frase Maestra E2EE
            </label>

            <div className="relative">
              <input
                type={showPassphrase ? 'text' : 'password'}
                placeholder="Ingresa una frase segura (mín. 6 caracteres)"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-emerald-300 focus:outline-none focus:border-cyan-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-cyan-500/20"
            >
              Activar Cifrado E2EE
            </button>
          </form>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-1">
            <span className="font-bold text-slate-200 block">Estado del Cifrado:</span>
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {security.e2eeEnabled ? 'Algoritmo AES-256-GCM Activo' : 'Cifrado local estándar en uso'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
