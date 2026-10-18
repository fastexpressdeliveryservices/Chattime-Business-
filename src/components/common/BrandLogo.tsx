import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  className?: string;
  isRed?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = false,
  subtitle,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-9 h-9 rounded-xl',
    md: 'w-11 h-11 rounded-2xl',
    lg: 'w-16 h-16 rounded-2xl',
    xl: 'w-20 h-20 rounded-3xl',
  }[size];

  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Red Chat Tile Brand Emblem - No 'B' Badge */}
      <div
        className={`relative ${sizeClasses} bg-gradient-to-br from-red-950 via-slate-900 to-slate-950 border border-red-500/40 shadow-lg shadow-red-500/25 flex items-center justify-center shrink-0 overflow-hidden group`}
      >
        <svg
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={iconSizes}
        >
          <defs>
            <linearGradient id="ctLogoRedGradient" x1="64" y1="64" x2="448" y2="448" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="50%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
            <linearGradient id="ctGlowCircle" x1="160" y1="160" x2="352" y2="352" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Speech Bubble Base in Radiant Red */}
          <path
            d="M256 86C155.48 86 74 158.08 74 247C74 286.84 90.35 323.33 117.54 351.5C112.24 377.28 97.7 402.88 95.74 406.17C92.74 411.22 96.67 417.63 102.54 417.06C135.91 413.83 167.49 401.52 189.81 390.4C210.65 397.49 232.9 401.29 256 401.29C356.52 401.29 438 329.21 438 240.29C438 151.37 356.52 86 256 86Z"
            fill="url(#ctLogoRedGradient)"
          />

          {/* Central Dark Void Clock Face */}
          <circle cx="256" cy="244" r="98" fill="#090d16" />

          {/* Decorative Outer Dial Ring in Fiery Red */}
          <circle
            cx="256"
            cy="244"
            r="84"
            stroke="#f87171"
            strokeWidth="8"
            strokeOpacity="0.5"
            strokeDasharray="20 12"
          />

          {/* Clock Hands (Chat Time) */}
          <path
            d="M256 184V244L298 270"
            stroke="#ffffff"
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Center Red Axis Pin */}
          <circle cx="256" cy="244" r="14" fill="#ef4444" />

        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white font-display leading-none">
              Chat Time
            </span>
          </div>
          {subtitle && (
            <span className="text-[11px] text-red-400 font-mono tracking-wider font-semibold mt-0.5 truncate max-w-[180px]">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
