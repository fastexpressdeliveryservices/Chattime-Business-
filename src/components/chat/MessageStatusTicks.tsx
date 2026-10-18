import React from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';
import { MessageStatus } from '../../types';

interface MessageStatusTicksProps {
  status?: MessageStatus;
  className?: string;
  isLightBubble?: boolean;
}

/**
 * Message status ticks component:
 * - 'sending': Clock icon
 * - 'sent': 1 checkmark (Sent to server)
 * - 'delivered': 2 checkmarks (Delivered to recipient)
 * - 'read': 3 checkmarks ("3 good" - opened / read by recipient)
 */
export const MessageStatusTicks: React.FC<MessageStatusTicksProps> = ({
  status = 'sent',
  className = '',
  isLightBubble = false,
}) => {
  if (status === 'sending') {
    return (
      <span
        className={`inline-flex items-center text-slate-400 dark:text-slate-400 opacity-80 ${className}`}
        title="Sending..."
      >
        <Clock className="w-3 h-3 stroke-[2]" />
      </span>
    );
  }

  if (status === 'read') {
    return (
      <span
        className={`inline-flex items-center select-none font-bold ${
          isLightBubble
            ? 'text-sky-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]'
            : 'text-sky-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]'
        } ${className}`}
        title="Read (3 checkmarks / 3 good)"
        aria-label="Read by recipient - 3 checkmarks"
      >
        {/* Precise SVG with 3 distinct checkmarks ("3 good") that never wrap or misalign */}
        <svg
          viewBox="0 0 25 15"
          className="w-4.5 h-3 inline-block shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Tick 1 */}
          <polyline points="1.5 8 4.5 11 9 5" />
          {/* Tick 2 */}
          <polyline points="6.5 8 9.5 11 14 5" />
          {/* Tick 3 */}
          <polyline points="11.5 8 14.5 11 19 5" />
        </svg>
      </span>
    );
  }

  if (status === 'delivered') {
    return (
      <span
        className={`inline-flex items-center select-none ${
          isLightBubble ? 'text-slate-900/80' : 'text-slate-300/80'
        } ${className}`}
        title="Delivered (2 checkmarks)"
      >
        <CheckCheck className="w-3.5 h-3.5 stroke-[2]" />
      </span>
    );
  }

  // Default: 'sent'
  return (
    <span
      className={`inline-flex items-center select-none ${
        isLightBubble ? 'text-slate-900/70' : 'text-slate-400/80'
      } ${className}`}
      title="Sent (1 checkmark)"
    >
      <Check className="w-3.5 h-3.5 stroke-[2]" />
    </span>
  );
};
