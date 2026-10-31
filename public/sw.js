const CACHE_NAME = 'chattime-pwa-v6';
const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icon.svg',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/app-logo.jpg',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return Promise.resolve();
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never intercept API calls, WebSocket upgrades, Vite module scripts, dynamic chunks, or app code
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/ws') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.includes('.js') ||
    url.pathname.includes('.css') ||
    url.pathname.includes('.ts') ||
    url.pathname.includes('.tsx') ||
    request.mode === 'navigate'
  ) {
    return;
  }

  // Cache static image assets & icons
  if (
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname === '/manifest.webmanifest'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  }
});

// The operating system chooses the notification sound for web push.
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { body: event.data.text() };
    }
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.some((client) => client.visibilityState === 'visible')) return;
      const avatar = data.icon || data.senderAvatar || '/icon.svg';
      return self.registration.showNotification(data.title || 'Chat Time', {
        body: data.body || 'You have a new message.',
        icon: avatar,
        image: data.image || data.senderAvatar || undefined,
        badge: '/icon.svg',
        vibrate: data.isCall ? [400, 200, 400, 200, 800] : [150, 80, 150],
        tag: data.tag || 'chattime-notification',
        renotify: true,
        requireInteraction: Boolean(data.isCall),
        data: data.data || { url: '/' },
      });
    })
  );
});

// Allow client app to delegate background notification to Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const avatar = options?.icon || options?.senderAvatar || '/icon.svg';
    event.waitUntil(
      self.registration.showNotification(title || 'Chat Time', {
        icon: avatar,
        image: options?.image || options?.senderAvatar || undefined,
        badge: '/icon.svg',
        vibrate: [200, 100, 200, 100, 400],
        renotify: true,
        ...options,
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notificationData = event.notification.data || {};
  const targetUrl = new URL(notificationData.url || '/', self.location.origin);
  if (targetUrl.origin !== self.location.origin) targetUrl.href = self.location.origin + '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      const client = clientList.find((item) => new URL(item.url).origin === self.location.origin);
      if (client && 'focus' in client) {
        await client.focus();
        client.postMessage({ type: 'PUSH_NOTIFICATION_OPEN', data: notificationData });
        return;
      }
      return self.clients.openWindow(targetUrl.href);
    })
  );
});
