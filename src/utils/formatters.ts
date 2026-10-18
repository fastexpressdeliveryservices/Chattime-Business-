/**
 * Formatting utilities for ChatTime
 */

export function isValidTimestamp(ts: any): boolean {
  if (ts === null || ts === undefined) return false;
  const num = typeof ts === 'number' ? ts : Number(ts);
  return !isNaN(num) && num > 0 && isFinite(num);
}

export function formatTime(timestamp?: number | string | null): string {
  if (!isValidTimestamp(timestamp)) {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const date = new Date(Number(timestamp));
  if (isNaN(date.getTime())) {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatMessageDate(timestamp?: number | string | null): string {
  if (!isValidTimestamp(timestamp)) return 'Today';
  const date = new Date(Number(timestamp));
  if (isNaN(date.getTime())) return 'Today';

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0 && date.getDate() === now.getDate()) {
    return 'Today';
  }
  if (diffDays === 1 || (diffDays === 0 && date.getDate() !== now.getDate())) {
    return 'Yesterday';
  }
  if (diffDays < 7 && diffDays >= 0) {
    return date.toLocaleDateString([], { weekday: 'long' });
  }
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatLastSeen(timestamp?: number | string | null, isOnline: boolean = false): string {
  if (isOnline) return 'online';
  if (!isValidTimestamp(timestamp)) return 'offline';
  const tsNum = Number(timestamp);
  const now = Date.now();
  const diffMinutes = Math.floor((now - tsNum) / (1000 * 60));

  if (diffMinutes < 1) return 'last seen just now';
  if (diffMinutes < 60) return `last seen ${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `last seen ${diffHours}h ago`;
  return `last seen ${formatMessageDate(tsNum)}`;
}

export function formatCallDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (isNaN(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatAudioDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function formatRelativeTime(timestamp?: number | string | null): string {
  if (!isValidTimestamp(timestamp)) return 'Just now';
  const tsNum = Number(timestamp);
  const now = Date.now();
  const diffSec = Math.floor((now - tsNum) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return formatTime(tsNum);
  return formatMessageDate(tsNum);
}

