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
        className={`inline-flex items-center select-none font-bold text-sky-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] ${className}`}
        title="Read (Double blue checkmarks)"
        aria-label="Read by recipient"
      >
        <CheckCheck className="w-3.5 h-3.5 stroke-[2.2] text-[#38bdf8]" />
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
