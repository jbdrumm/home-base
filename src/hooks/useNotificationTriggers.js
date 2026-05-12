// ─────────────────────────────────────────────────────────────
//  useNotificationTriggers
//  Watches bills, vehicles, and tasks for conditions that 
//  warrant a push notification. Fires once per day per item
//  (deduplicated via localStorage).
// ─────────────────────────────────────────────────────────────
import { useEffect } from 'react';
import { notify } from '../lib/firebase';

function todayKey(prefix, id) {
  const d = new Date().toISOString().slice(0, 10);
  return `hb_notif_${prefix}_${id}_${d}`;
}

function notifiedToday(key) {
  return !!localStorage.getItem(key);
}

function markNotified(key) {
  localStorage.setItem(key, '1');
  // Clean up old keys (> 2 days old) to avoid localStorage bloat
  const twoDaysAgo = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith('hb_notif_') && k < `hb_notif_z_${twoDaysAgo}`) {
      localStorage.removeItem(k);
    }
  }
}

export function useNotificationTriggers({ bills = [], todosByList = {} }) {
  useEffect(() => {
    if (Notification.permission !== 'granted') return;

    // ── Bills due today ──
    const today = new Date().toISOString().slice(0, 10);
    for (const bill of bills) {
      if (!bill.paid && bill.dueDate === today) {
        const key = todayKey('bill', bill.id);
        if (!notifiedToday(key)) {
          notify.billDue(bill.name, bill.amount);
          markNotified(key);
        }
      }
    }

    // ── Overdue vehicle tasks ──
    // todosByList keys like 'jacob:Vehicles', 'katelin:Vehicles', 'family:Vehicles'
    for (const [key, tasks] of Object.entries(todosByList)) {
      if (!key.includes('Vehicles')) continue;
      for (const task of tasks) {
        if (!task.done && task.priority === 'high') {
          const nKey = todayKey('vehicle', task.id);
          if (!notifiedToday(nKey)) {
            notify.vehicleService('Vehicle', task.title);
            markNotified(nKey);
          }
        }
      }
    }
  }, [bills, todosByList]);
}
