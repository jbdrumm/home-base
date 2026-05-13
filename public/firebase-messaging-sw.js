/* eslint-disable no-undef */
// Firebase Messaging Service Worker
// Must be at /firebase-messaging-sw.js (root of site)
// This file is separate from the main service-worker.js

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Config injected at build time via a fetch to /firebase-config.json
// We use self.__FIREBASE_CONFIG set by the main app on SW registration
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    if (!self._fbInitialized) {
      firebase.initializeApp(event.data.config);
      firebase.messaging();
      self._fbInitialized = true;
    }
  }
});

// Handle background push messages
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { notification: { title: 'Home Base', body: event.data.text() } }; }

  const title   = data.notification?.title || 'Home Base';
  const options = {
    body:    data.notification?.body || '',
    icon:    '/icons/icon-192x192.png',
    badge:   '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    data:    data.data || {},
    tag:     data.data?.tag || 'homebase',
    actions: [
      { action: 'open',    title: 'Open'    },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const view = event.notification.data?.view || '';
  const url  = self.location.origin + (view ? `/?view=${view}` : '/');
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICK', view });
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
