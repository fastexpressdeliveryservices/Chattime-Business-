/**
 * Link handling utility for ChatTime
 * Detects URLs in messages, formats link previews, and opens links
 * in the system default browser (Chrome on Android, Safari on iOS).
 */

export interface LinkMetadata {
  url: string;
  domain: string;
  title?: string;
  icon?: string;
}

// Regex to detect HTTP, HTTPS, and common domain URLs
const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`]+[^\s<>"'{}|\\^`.,;:!?)\]]/gi;

/**
 * Normalizes a URL to ensure it has a proper https:// protocol
 */
export function normalizeUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (url.startsWith('www.')) {
    url = 'https://' + url;
  } else if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  return url;
}

/**
 * Extracts the domain name from a URL for clean display
 */
export function extractDomain(rawUrl: string): string {
  try {
    const parsed = new URL(normalizeUrl(rawUrl));
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return rawUrl;
  }
}

/**
 * Detects the user's platform (Android, iOS, or Desktop)
 */
export function detectPlatform(): {
  isAndroid: boolean;
  isIOS: boolean;
  browserName: string;
} {
  if (typeof window === 'undefined') {
    return { isAndroid: false, isIOS: false, browserName: 'Browser' };
  }
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const browserName = isAndroid ? 'Chrome' : isIOS ? 'Safari' : 'Browser';

  return { isAndroid, isIOS, browserName };
}

/**
 * Opens a link in the system's external browser (Chrome on Android, Safari on iOS)
 * ensuring it doesn't get trapped in an iframe or in-app webview.
 */
export function openInExternalBrowser(rawUrl: string): void {
  const url = normalizeUrl(rawUrl);

  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } catch (err) {
    console.warn('[LinkHandler] Could not open external link via anchor:', err);
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // Ignored if window.open is restricted in iframe
    }
  }
}

/**
 * Finds all URLs in a text string
 */
export function findUrlsInText(text: string): string[] {
  if (!text) return [];
  const matches = text.match(URL_REGEX);
  return matches ? Array.from(new Set(matches)) : [];
}

/**
 * Splits text into segments of plain text and clickable URL tokens
 */
export interface TextToken {
  type: 'text' | 'url';
  content: string;
}

export function parseTextWithUrls(text: string): TextToken[] {
  if (!text) return [];
  const tokens: TextToken[] = [];
  let lastIndex = 0;
  const regex = new RegExp(URL_REGEX.source, 'gi');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }
    tokens.push({
      type: 'url',
      content: match[0],
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  return tokens;
}
