import React from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';
import { MessageStatus } from '../../types';

export interface MessageStatusTicksProps {
  status?: MessageStatus;
  className?: string;
  isLightBubble?: boolean;
  hideReadReceipts?: boolean;
}

/**
 * Message status ticks component:
 * - 'sending': Clock icon
 * - 'sent': 1 checkmark (Sent to server)
 * - 'delivered': 2 checkmarks (Delivered to recipient)
 * - 'read': Double blue checkmarks (Opened / read by recipient; suppressed if read receipts are off)
 */
export const MessageStatusTicks: React.FC<MessageStatusTicksProps> = ({
  status = 'sent',
  className = '',
  isLightBubble = false,
  hideReadReceipts = false,
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

  // If read receipts are turned off by either party in a 1-to-1 conversation,
  // the ticks remain double grey (delivered) rather than turning blue
  if (status === 'read' && !hideReadReceipts) {
    return (
      <span
        className={`inline-flex items-center select-none font-bold text-[#34B7F1] drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] ${className}`}
        title="Read (Double blue checkmarks)"
        aria-label="Read by recipient"
      >
        <CheckCheck className="w-3.5 h-3.5 stroke-[2.3] text-[#34B7F1]" />
      </span>
    );
  }

  if (status === 'delivered' || (status === 'read' && hideReadReceipts)) {
    return (
      <span
        className={`inline-flex items-center select-none ${
          isLightBubble ? 'text-slate-900/80' : 'text-slate-400/90'
        } ${className}`}
        title={hideReadReceipts && status === 'read' ? 'Delivered' : 'Delivered (2 checkmarks)'}
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
