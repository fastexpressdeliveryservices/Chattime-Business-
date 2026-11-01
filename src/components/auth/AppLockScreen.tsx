import React, { useState, useEffect } from 'react';
import { Lock, Fingerprint, Delete } from 'lucide-react';
import { useChatTime } from '../../context/ChatTimeContext';

export const AppLockScreen: React.FC = () => {
  const { isAppLocked, setIsAppLocked, currentUser } = useChatTime();
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (isAppLocked) return;
    if (typeof window === 'undefined') return;
    const timeout = Number(localStorage.getItem('chattime_lock_timeout_ms') || '900000');
    if (!Number.isFinite(timeout) || timeout <= 0) return;
    const timer = window.setTimeout(() => {
      setIsAppLocked(true);
    }, timeout);
    return () => window.clearTimeout(timer);
  }, [isAppLocked, setIsAppLocked]);

  if (!isAppLocked) return null;

  const handlePressDigit = (d: string) => {
    if (isChecking || pinInput.length >= 4) return;
    const next = pinInput + d;
    setPinInput(next);
    if (next.length === 4) {
      void verify(next);
    }
  };

  const verify = async (code: string) => {
    if (!currentUser.id) return;
    setIsChecking(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/validate-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, pin: code }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Incorrect PIN code.');
      }

      setPinInput('');
      setErrorMsg(null);
      setIsAppLocked(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Incorrect PIN code.');
      setTimeout(() => {
        setPinInput('');
        setErrorMsg(null);
      }, 700);
    } finally {
      setIsChecking(false);
    }
  };

  const handleBackspace = () => {
    if (isChecking) return;
    setPinInput((prev) => prev.slice(0, -1));
  };

  const handleBiometric = async () => {
    if (!('PublicKeyCredential' in window) || !window.isSecureContext) {
      setErrorMsg('Biometric unlock is not supported on this browser. Please use your security PIN.');
      return;
    }

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const available = await navigator.credentials.get({
        mediation: 'required',
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'preferred',
          rpId: window.location.hostname,
        },
      } as any);

      if (available) {
        setPinInput('');
        setErrorMsg(null);
        setIsAppLocked(false);
      }
    } catch {
      setErrorMsg('Biometric unlock is not configured for this device. Please use your PIN fallback.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-xs flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-xl shadow-teal-500/10">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-100 font-display">ChatTime Locked</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter your 4-digit PIN passcode to unlock {currentUser.name}&apos;s session
          </p>
        </div>

        {/* PIN Dots (4 dots) */}
        <div className="flex items-center gap-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all ${
                pinInput.length > idx
                  ? 'bg-teal-400 scale-125 shadow-md shadow-teal-400/50'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
            <button
              key={n}
              onClick={() => handlePressDigit(n)}
              className="h-14 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-lg font-bold text-slate-100 active:scale-95 transition-all"
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => { void handleBiometric(); }}
            className="h-14 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-teal-400 flex items-center justify-center active:scale-95 transition-all disabled:opacity-70"
            title="Biometric Unlock"
            disabled={isChecking}
          >
            <Fingerprint className="w-6 h-6" />
          </button>
          <button
            onClick={() => handlePressDigit('0')}
            className="h-14 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-lg font-bold text-slate-100 active:scale-95 transition-all"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center active:scale-95 transition-all"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          End-to-End Encrypted Session Protected
        </div>
      </div>
    </div>
  );
};
