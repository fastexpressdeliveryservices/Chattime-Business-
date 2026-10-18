import React from 'react';
import { AccentColor, AppBackgroundStyle, ThemeMode, WallpaperPattern } from '../../types';

interface AppBackgroundProps {
  style: AppBackgroundStyle;
  accent: AccentColor;
  theme: ThemeMode;
  wallpaper?: WallpaperPattern;
  wallpaperOpacity?: number;
}

export const AppBackground: React.FC<AppBackgroundProps> = ({
  style,
  accent,
  theme,
  wallpaper = 'doodle',
  wallpaperOpacity = 0.08,
}) => {
  const isLight = theme === 'light';
  const isMidnight = theme === 'midnight';

  // Accent RGB mapping for fine-tuned ambient lighting
  const ACCENT_COLORS: Record<AccentColor, { primary: string; secondary: string; glow: string }> = {
    orange: { primary: '#f97316', secondary: '#ea580c', glow: 'rgba(249, 115, 22, 0.28)' },
    teal: { primary: '#14b8a6', secondary: '#0d9488', glow: 'rgba(20, 184, 166, 0.25)' },
    indigo: { primary: '#6366f1', secondary: '#4f46e5', glow: 'rgba(99, 102, 241, 0.25)' },
    sky: { primary: '#0ea5e9', secondary: '#0284c7', glow: 'rgba(14, 165, 233, 0.25)' },
    violet: { primary: '#8b5cf6', secondary: '#7c3aed', glow: 'rgba(139, 92, 246, 0.26)' },
    rose: { primary: '#f43f5e', secondary: '#e11d48', glow: 'rgba(244, 63, 94, 0.25)' },
    amber: { primary: '#f59e0b', secondary: '#d97706', glow: 'rgba(245, 158, 11, 0.26)' },
    emerald: { primary: '#10b981', secondary: '#059669', glow: 'rgba(16, 185, 129, 0.25)' },
  };

  const col = ACCENT_COLORS[accent] || ACCENT_COLORS.orange;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none transition-colors duration-500"
    >
      {/* 0. CLEAR WHATSAPP ICONIC BACKGROUND */}
      {style === 'whatsapp' && (
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 transition-colors duration-300"
            style={{
              backgroundColor: isLight
                ? '#efeae2'
                : isMidnight
                ? '#000000'
                : '#0b141a',
            }}
          />
        </div>
      )}

      {/* 1. DYNAMIC AMBIENT GLOW BACKDROP */}
      {style === 'glow' && (
        <div className="absolute inset-0">
          <div
            className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[140px] opacity-40 transition-all duration-700"
            style={{
              background: `radial-gradient(circle, ${col.primary} 0%, ${col.secondary} 40%, transparent 70%)`,
            }}
          />
          <div
            className="absolute -bottom-40 -right-40 w-[680px] h-[680px] rounded-full blur-[160px] opacity-35 transition-all duration-700"
            style={{
              background: `radial-gradient(circle, ${col.secondary} 0%, ${col.primary} 50%, transparent 75%)`,
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[180px] opacity-20"
            style={{ background: col.primary }}
          />
        </div>
      )}

      {/* 2. RADIANT SUNSET HORIZON (Warm Orange & Amber Atmosphere) */}
      {style === 'sunset' && (
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-80"
            style={{
              background: isLight
                ? 'linear-gradient(180deg, #fff7ed 0%, #ffedd5 35%, #fed7aa 70%, #fdba74 100%)'
                : 'linear-gradient(180deg, #09090b 0%, #1c0a00 35%, #2a0e03 65%, #3a1505 100%)',
            }}
          />
          {/* Radiant Sun Sphere & Halo */}
          <div
            className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[750px] h-[450px] rounded-t-full blur-[90px] opacity-50 transition-all"
            style={{
              background: 'radial-gradient(ellipse at center bottom, #fb923c 0%, #ea580c 45%, #9a3412 75%, transparent 100%)',
            }}
          />
          <div
            className="absolute top-10 right-10 w-96 h-96 rounded-full blur-[120px] opacity-30"
            style={{ background: '#f59e0b' }}
          />
        </div>
      )}

      {/* 3. ETHEREAL NORTHERN AURORA */}
      {style === 'aurora' && (
        <div className="absolute inset-0">
          <div
            className="absolute -top-24 left-1/4 w-[700px] h-[400px] rounded-full blur-[130px] opacity-35"
            style={{
              background: `linear-gradient(135deg, ${col.primary}, #06b6d4, #3b82f6)`,
              transform: 'rotate(-15deg)',
            }}
          />
          <div
            className="absolute -bottom-32 right-1/4 w-[650px] h-[450px] rounded-full blur-[140px] opacity-30"
            style={{
              background: `linear-gradient(45deg, #10b981, ${col.secondary}, #8b5cf6)`,
              transform: 'rotate(20deg)',
            }}
          />
        </div>
      )}

      {/* 4. CYBER MATRIX / HIGH-TECH GRID */}
      {style === 'cyber' && (
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(to right, ${col.primary} 1px, transparent 1px), linear-gradient(to bottom, ${col.primary} 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
            }}
          />
          <div
            className="absolute top-0 inset-x-0 h-48 blur-[80px] opacity-25"
            style={{ background: col.primary }}
          />
          <div
            className="absolute bottom-0 inset-x-0 h-64 blur-[90px] opacity-30"
            style={{ background: col.secondary }}
          />
        </div>
      )}

      {/* 5. COSMIC NEBULA & STARDUST */}
      {style === 'cosmic' && (
        <div className="absolute inset-0">
          <div
            className="absolute top-1/4 right-1/3 w-[550px] h-[550px] rounded-full blur-[150px] opacity-30"
            style={{ background: `radial-gradient(circle, ${col.primary} 0%, #4338ca 60%, transparent 80%)` }}
          />
          <div
            className="absolute bottom-10 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] opacity-25"
            style={{ background: `radial-gradient(circle, #ec4899 0%, ${col.secondary} 55%, transparent 75%)` }}
          />
          {/* Subtle Stardust sparkles */}
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: `radial-gradient(#ffffff 0.75px, transparent 0.75px), radial-gradient(${col.primary} 0.5px, transparent 0.5px)`,
              backgroundSize: '64px 64px, 48px 48px',
              backgroundPosition: '0 0, 24px 24px',
            }}
          />
        </div>
      )}

      {/* 6. FLUID SILKY GRADIENT MESH */}
      {style === 'mesh' && (
        <div className="absolute inset-0">
          <div
            className="absolute top-0 right-0 w-[55vw] h-[55vh] rounded-bl-[180px] blur-[110px] opacity-35"
            style={{ background: col.primary }}
          />
          <div
            className="absolute bottom-0 left-0 w-[60vw] h-[50vh] rounded-tr-[200px] blur-[120px] opacity-30"
            style={{ background: col.secondary }}
          />
          <div
            className="absolute top-1/3 left-10 w-80 h-80 rounded-full blur-[90px] opacity-20"
            style={{ background: '#f59e0b' }}
          />
        </div>
      )}

      {/* 7. MINIMALIST STUDIO */}
      {style === 'minimal' && (
        <div className="absolute inset-0">
          <div
            className="absolute top-0 inset-x-0 h-1"
            style={{ background: `linear-gradient(90deg, transparent, ${col.primary}, transparent)` }}
          />
        </div>
      )}

      {/* 8. WALLPAPER PATTERN TEXTURE OVERLAY */}
      {wallpaper !== 'none' && (
        <div
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            opacity: isLight ? wallpaperOpacity * 0.7 : wallpaperOpacity,
            mixBlendMode: isLight ? 'multiply' : 'screen',
          }}
        >
          {wallpaper === 'doodle' && (
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="chattime-doodles" width="90" height="90" patternUnits="userSpaceOnUse">
                  {/* Chat bubbles, paper planes, shields, spark, heart */}
                  <path
                    d="M12 24 C12 18, 28 18, 28 24 C28 28, 22 29, 20 32 L18 34 L18 32 C14 32, 12 30, 12 24 Z"
                    fill="none"
                    stroke={col.primary}
                    strokeWidth="1.2"
                  />
                  <path
                    d="M50 18 L70 26 L56 30 L54 36 L50 18 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.1"
                  />
                  <circle cx="75" cy="65" r="5" fill="none" stroke={col.primary} strokeWidth="1.1" />
                  <path
                    d="M20 70 Q 25 64 30 70 Q 35 76 30 82 Q 25 76 20 70 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                  <path
                    d="M48 68 L50 62 L52 68 L58 70 L52 72 L50 78 L48 72 L42 70 Z"
                    fill="none"
                    stroke={col.secondary}
                    strokeWidth="1.1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#chattime-doodles)" />
            </svg>
          )}

          {wallpaper === 'geometric' && (
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="chattime-geo" width="60" height="60" patternUnits="userSpaceOnUse">
                  <polygon
                    points="30,5 55,50 5,50"
                    fill="none"
                    stroke={col.primary}
                    strokeWidth="0.9"
                  />
                  <circle cx="30" cy="35" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#chattime-geo)" />
            </svg>
          )}

          {wallpaper === 'stars' && (
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="chattime-stars" width="70" height="70" patternUnits="userSpaceOnUse">
                  <circle cx="15" cy="15" r="1.5" fill={col.primary} />
                  <circle cx="55" cy="35" r="1.2" fill="currentColor" />
                  <circle cx="35" cy="55" r="1.5" fill={col.secondary} />
                  <line x1="15" y1="15" x2="35" y2="55" stroke="currentColor" strokeWidth="0.4" strokeDasharray="2 3" opacity="0.4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#chattime-stars)" />
            </svg>
          )}

          {wallpaper === 'circuit' && (
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="chattime-circuit" width="80" height="80" patternUnits="userSpaceOnUse">
                  <path
                    d="M10 20 H40 V40 H70"
                    fill="none"
                    stroke={col.primary}
                    strokeWidth="1"
                  />
                  <circle cx="10" cy="20" r="2.5" fill={col.primary} />
                  <circle cx="70" cy="40" r="2.5" fill={col.secondary} />
                  <path
                    d="M20 70 V50 H50 V30"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.8"
                  />
                  <circle cx="20" cy="70" r="2" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#chattime-circuit)" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
};
