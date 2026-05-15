/* eslint-disable no-undef */
// Firebase Messaging Service Worker
// Config is injected by the build process via environment variables.
// For background push to work this SW must be able to initialize Firebase
// without the main app being open.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Config injected at build time — these values are public (client-side safe)
// They are read from the service worker scope at registration time via a
// fetch to /firebase-config.js which is generated during build.
// Load Firebase config generated at build time
try { importScripts('/firebase-config.js'); } catch(e) {}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

// Initialize Firebase when config is available
function tryInit() {
  if (self._fbInitialized) return;
  if (
    typeof REACT_APP_FIREBASE_API_KEY !== 'undefined' ||
    self.__FB_CONFIG__
  ) {
    const config = self.__FB_CONFIG__ || {
      apiKey:            typeof REACT_APP_FIREBASE_API_KEY !== 'undefined' ? REACT_APP_FIREBASE_API_KEY : '',
      authDomain:        typeof REACT_APP_FIREBASE_AUTH_DOMAIN !== 'undefined' ? REACT_APP_FIREBASE_AUTH_DOMAIN : '',
      projectId:         typeof REACT_APP_FIREBASE_PROJECT_ID !== 'undefined' ? REACT_APP_FIREBASE_PROJECT_ID : '',
      messagingSenderId: typeof REACT_APP_FIREBASE_MESSAGING_SENDER_ID !== 'undefined' ? REACT_APP_FIREBASE_MESSAGING_SENDER_ID : '',
      appId:             typeof REACT_APP_FIREBASE_APP_ID !== 'undefined' ? REACT_APP_FIREBASE_APP_ID : '',
    };
    if (config.apiKey) {
      firebase.initializeApp(config);
      firebase.messaging();
      self._fbInitialized = true;
    }
  }
}

// Receive config from the main app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG') {
    self.__FB_CONFIG__ = event.data.config;
    tryInit();
  }
});

// Handle background push — works even when app is closed
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
    requireInteraction: false,
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
