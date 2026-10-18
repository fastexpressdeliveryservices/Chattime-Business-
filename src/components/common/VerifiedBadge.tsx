import React from 'react';
import type { User } from '../../types';

interface VerifiedBadgeProps {
  user?: Partial<User> | null;
  isVerified?: boolean;
  type?: 'blue' | 'red';
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  user,
  isVerified: explicitVerified,
  type: explicitType,
  className = '',
  size = 'sm',
}) => {
  const isRed =
    explicitType === 'red' ||
    user?.isRedVerified ||
    user?.verificationBadge === 'red' ||
    user?.verificationBadgeType === 'red';

  const isVerified = explicitVerified !== undefined ? explicitVerified : Boolean(user?.isVerified || isRed);

  if (!isVerified) return null;

  const sizePx = size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'md' ? 16 : 20;

  if (isRed) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 text-rose-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)] select-none ${className}`}
        title="Admin / VIP Red Tick Verified"
      >
        <svg
          width={sizePx}
          height={sizePx}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          {/* Outer Crimson Shield Circle */}
          <circle cx="12" cy="12" r="10" fill="#dc2626" />
          <path
            d="M12 2L14.5 4.5L18 4L19 7.5L22 9.5L21 13L23 16L20 18L19.5 21.5L16 21L13.5 23L11 21.5L7.5 22L7 18.5L4 16.5L5 13L3 10L6 8L6.5 4.5L10 5L12 2Z"
            fill="#ef4444"
          />
          {/* White High-Contrast Checkmark */}
          <path
            d="M8.5 12.2L11 14.7L16 9.7"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 text-sky-400 drop-shadow-[0_0_5px_rgba(14,165,233,0.4)] select-none ${className}`}
      title="Verified Blue Tick"
    >
      <svg
        width={sizePx}
        height={sizePx}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Blue Shield Circle */}
        <circle cx="12" cy="12" r="10" fill="#0284c7" />
        <path
          d="M12 2L14.5 4.5L18 4L19 7.5L22 9.5L21 13L23 16L20 18L19.5 21.5L16 21L13.5 23L11 21.5L7.5 22L7 18.5L4 16.5L5 13L3 10L6 8L6.5 4.5L10 5L12 2Z"
          fill="#0ea5e9"
        />
        {/* White Checkmark */}
        <path
          d="M8.5 12.2L11 14.7L16 9.7"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};
