// ─────────────────────────────────────────────────────────────
//  Firebase — Push Notifications
//  Config values come from environment variables.
//  Add these to Netlify environment settings:
//    REACT_APP_FIREBASE_API_KEY
//    REACT_APP_FIREBASE_AUTH_DOMAIN
//    REACT_APP_FIREBASE_PROJECT_ID
//    REACT_APP_FIREBASE_MESSAGING_SENDER_ID
//    REACT_APP_FIREBASE_APP_ID
//    REACT_APP_FIREBASE_VAPID_KEY
// ─────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

// Only initialize if config is present
const isConfigured = Object.values(firebaseConfig).every(Boolean);

let app, messaging;
if (isConfigured) {
  app       = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
}

export { messaging, isConfigured };

// Request notification permission and get FCM token
export async function requestNotificationPermission() {
  if (!isConfigured || !messaging) {
    console.warn('[FCM] Firebase not configured — add env vars to enable push notifications');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[FCM] Notification permission denied');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });

    console.log('[FCM] Token:', token);
    return token;
  } catch (e) {
    console.error('[FCM] Error getting token:', e);
    return null;
  }
}

// Handle foreground messages (app is open)
export function onForegroundMessage(callback) {
  if (!isConfigured || !messaging) return () => {};
  return onMessage(messaging, callback);
}

// ── Notification helpers ──────────────────────────────────────
// Call these from anywhere in the app to show a local notification.
// Works even without Firebase (local only, no server push).

export function showLocalNotification(title, body, options = {}) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  navigator.serviceWorker.ready.then(reg => {
    reg.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      vibrate: [200, 100, 200],
      tag: options.tag || 'homebase',
      data: options.data || {},
      actions: options.actions || [],
      ...options,
    });
  });
}

// Pre-built notification types
export const notify = {
  billDue: (billName, amount) =>
    showLocalNotification(
      '💳 Bill Due Today',
      `${billName} — $${amount}`,
      { tag: 'bill-due', data: { view: 'financial' } }
    ),

  packageArrived: (description) =>
    showLocalNotification(
      '📦 Package Delivered',
      description || 'A package has arrived',
      { tag: 'package', data: { view: 'packages' } }
    ),

  taskReminder: (taskTitle, owner) =>
    showLocalNotification(
      '✅ Task Reminder',
      taskTitle,
      { tag: 'task', data: { view: 'todo', owner } }
    ),

  groceryLow: (item) =>
    showLocalNotification(
      '🛒 Running Low',
      `Add ${item} to your grocery list`,
      { tag: 'grocery', data: { view: 'grocery' } }
    ),

  vehicleService: (vehicle, service) =>
    showLocalNotification(
      '🔧 Service Due',
      `${vehicle} — ${service} overdue`,
      { tag: 'vehicle', data: { view: 'vehicles' } }
    ),
};
