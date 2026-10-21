/**
 * API & Backend Configuration for ChatTime
 * Supports standalone deployment on Vercel (admin/public) connecting to Railway backend.
 */

export function getApiBaseUrl(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const custom =
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_BACKEND_URL;
    if (custom && typeof custom === 'string' && custom.trim()) {
      return custom.trim().replace(/\/$/, '');
    }
  }
  // In development or when served from the same Railway server
  return '';
}

export function getWsBaseUrl(): string {
  const apiBase = getApiBaseUrl();
  if (apiBase) {
    return apiBase.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.host.toLowerCase();
    // Vercel serverless proxies do not support persistent WebSockets; connect directly to backend
    if (host.includes('.vercel.app') || host.includes('vercel')) {
      return 'wss://chattimeapp.name.ng';
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
  return 'ws://localhost:3000';
}

export function buildApiUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const url = buildApiUrl(input);
  return fetch(url, {
    credentials: 'include',
    ...init,
  });
}
