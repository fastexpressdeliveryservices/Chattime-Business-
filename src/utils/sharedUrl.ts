/**
 * Utility to detect if the current window is executing inside
 * the public shared app URL in AI Studio (e.g. ais-pre-*.run.app).
 * On shared URLs, administrative panels and master controls must NOT be displayed.
 */
export const isSharedAppUrl = (): boolean => {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();

  // Explicit override parameters for admin portal access
  if (
    search.includes('portal=admin') ||
    search.includes('admin=1') ||
    search.includes('admin=true') ||
    search.includes('force_admin=1') ||
    search.includes('view=dev') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/')
  ) {
    return false;
  }
  if (search.includes('view=shared') || search.includes('shared=1') || search.includes('mode=shared')) {
    return true;
  }

  // AI Studio preview/shared URL hostnames start with 'ais-pre-' or contain '-pre-'
  if (hostname.includes('ais-pre-') || hostname.includes('-pre-')) {
    return true;
  }

  return false;
};
