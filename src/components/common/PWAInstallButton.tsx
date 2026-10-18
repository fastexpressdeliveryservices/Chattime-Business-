import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  CheckCircle2,
  X,
  Share2,
  MoreVertical,
  ShieldCheck,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { BrandLogo } from './BrandLogo';
import { openInExternalBrowser } from '../../utils/linkHandler';

interface PWAInstallButtonProps {
  compact?: boolean;
  variant?: 'default' | 'sidebar' | 'header' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  variant = 'default',
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  if (isInstalled && variant !== 'card') {
    if (compact) return null;
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Installed as App</span>
      </div>
    );
  }

  const handleTrigger = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  const handleOpenInSystemBrowser = () => {
    openInExternalBrowser(window.location.href);
  };

  return (
    <>
      <button
        onClick={handleTrigger}
        className={
          compact
            ? 'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/25 active:scale-95 transition-all whitespace-nowrap'
            : 'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all whitespace-nowrap'
        }
        title="Install ChatTime like WhatsApp (Base APK / Home Screen App)"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Install App</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/pwa-192x192.png"
                  alt="Chat Time Logo"
                  className="w-12 h-12 rounded-2xl object-cover border border-red-500/40 shadow-md shadow-red-500/20"
                />
                <div>
                  <h2 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                    <span>Chat Time</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-sans font-bold">Official</span>
                  </h2>
                  <p className="text-[11px] text-slate-400">Official Encrypted Messaging & HD Calls</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 font-display flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Install ChatTime on Your Phone
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Install ChatTime as a standalone app (WhatsApp type). Works with full-screen view, camera & microphone for real calls, 24-hour status stories, and offline caching.
                </p>
              </div>

              {/* 1-Tap Native Install button if browser prompt is ready */}
              {isInstallable && (
                <button
                  onClick={async () => {
                    await install();
                    setShowGuide(false);
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App Now (1-Tap Base APK Prompt)</span>
                </button>
              )}

              {/* Open in External Browser Button if running in iframe/preview */}
              {isInIframe && (
                <button
                  onClick={handleOpenInSystemBrowser}
                  className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in {isAndroid ? 'Chrome' : isIOS ? 'Safari' : 'Browser'} to Install</span>
                </button>
              )}

              {/* Step-by-step Instructions for Android vs iOS */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs text-slate-300">
                {isIOS ? (
                  <>
                    <div className="font-bold text-teal-400 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4" />
                      <span>iPhone / iPad (Safari) Installation</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-2 text-slate-300">
                      <li>
                        Open this link in <strong className="text-white">Safari</strong> (not inside another in-app browser).
                      </li>
                      <li>
                        Tap the <strong className="text-white">Share</strong> button{' '}
                        <Share2 className="w-3.5 h-3.5 inline text-teal-400" /> in the Safari toolbar at the bottom.
                      </li>
                      <li>
                        Scroll down and select <strong className="text-white">Add to Home Screen</strong>.
                      </li>
                      <li>
                        Tap <strong className="text-white">Add</strong>. ChatTime will now open as a standalone app with its own icon!
                      </li>
                    </ol>
                  </>
                ) : (
                  <>
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4" />
                      <span>Android (Google Chrome) Base APK Installation</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-2 text-slate-300">
                      <li>
                        Open the app link in <strong className="text-white">Google Chrome</strong>.
                      </li>
                      <li>
                        Tap the Chrome menu <MoreVertical className="w-3.5 h-3.5 inline text-emerald-400" /> (three dots) in the top-right corner.
                      </li>
                      <li>
                        Tap <strong className="text-white">Install app</strong> or <strong className="text-white">Add to Home screen</strong>.
                      </li>
                      <li>
                        Android will package and install the official app to your app drawer and home screen.
                      </li>
                    </ol>
                  </>
                )}
              </div>

              {/* App Specifications Badge */}
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Package: <strong className="text-slate-200">com.chattime.messenger</strong></span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <Zap className="w-3 h-3" />
                  <span>PWA / WebAPK v2.5</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
