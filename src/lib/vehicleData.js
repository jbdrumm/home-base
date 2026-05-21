// ── Vehicle display config — photo/emoji/plate display only ─────────────────
// Real vehicle data (name, make, model, year, etc.) lives in Supabase `vehicles` table.
// This file holds display-only config that doesn't belong in the DB,
// and pure helper functions used by the widget and full view.

// Display config keyed by Supabase vehicle UUID
export const vehicleDisplayConfig = {
  '768beac4-bb0a-4e40-836a-b0963f97be83': {
    emoji: '🚙',
    photo_url: 'https://di-uploads-development.dealerinspire.com/kendalldodgechryslerjeepram1/uploads/2017/12/2017_dodge_durango_kendall_dodge1.png',
    photo_position: 'center 40%',
    photo_fit: 'cover',
    photo_scale: '70%',
  },
  '3c848956-d7f6-4a54-b20a-c1c37f1ba24a': {
    emoji: '🚐',
    photo_url: 'https://autoimage.capitalone.com/stock-media/evox/2018-Honda-Odyssey-Elite-WA-12089_cc2400_032_WA.png',
    photo_position: '20% 55%',
    photo_fit: 'cover',
    photo_scale: '100%',
  },
  '94f8441a-dbe5-4fd1-a9c3-6959f5da4d97': {
    emoji: '🏎',
    photo_url: 'https://www.motorcarclassics.com/galleria_images/388/388_main_l.jpg',
    photo_position: 'center',
  },
  'b5e271d8-6992-4b19-b531-378c2139da97': {
    emoji: '🛻',
    photo_url: 'https://i.redd.it/l89wj6mw46qc1.png',
    photo_position: 'center',
    photo_scale: '75%',
  },
};

// ── Status calculation from live maintenance_schedule rows ──────────────────
// Calculates status for each task based on last_done_mi vs estimated current odometer.
// Falls back to last_done_at (date) for time-based intervals.
export function calcTaskStatus(task, estimatedOdo) {
  if (task.interval_mi && task.last_done_mi != null && estimatedOdo) {
    const dueAt = task.last_done_mi + task.interval_mi;
    const delta = dueAt - estimatedOdo;
    if (delta <= 0)    return 'overdue';
    if (delta <= 500)  return 'soon';
    return 'good';
  }
  if (task.interval_mo && task.last_done_at) {
    const lastDate  = new Date(task.last_done_at);
    const dueDate   = new Date(lastDate);
    dueDate.setMonth(dueDate.getMonth() + task.interval_mo);
    const daysLeft  = Math.floor((dueDate - new Date()) / 86400000);
    if (daysLeft <= 0)   return 'overdue';
    if (daysLeft <= 30)  return 'soon';
    return 'good';
  }
  return 'good';
}

export function getVehicleStatusFromSchedule(schedule, estimatedOdo) {
  if (!schedule || schedule.length === 0) return 'good';
  const statuses = schedule.map(t => calcTaskStatus(t, estimatedOdo));
  if (statuses.includes('overdue')) return 'overdue';
  if (statuses.includes('soon'))    return 'soon';
  return 'good';
}

export function statusChipStyle(status) {
  if (status === 'overdue') return { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', label: '⚠ Overdue' };
  if (status === 'soon')    return { bg: 'var(--color-warn-bg)',   color: 'var(--color-warn)',   label: 'Due soon' };
  return                           { bg: 'var(--color-success-bg)', color: 'var(--color-success)', label: 'Good' };
}

// ── Odometer estimator ────────────────────────────────────────────────────────
// Uses the most recent fuel log entry + average miles per day to project current odo.
// avg_mpd values are rough estimates per vehicle type; will improve with more log data.
const DEFAULT_AVG_MPD = {
  '768beac4-bb0a-4e40-836a-b0963f97be83': 22, // Durango — primary family driver
  '3c848956-d7f6-4a54-b20a-c1c37f1ba24a': 18, // Odyssey
  '94f8441a-dbe5-4fd1-a9c3-6959f5da4d97': 5,  // S2000 — weekend/fun car
  'b5e271d8-6992-4b19-b531-378c2139da97': 3,  // Ranger — occasional use
};

export function estimateOdometer(vehicleId, latestFuelLog) {
  if (!latestFuelLog || !latestFuelLog.odometer_mi) return null;
  const daysSince = Math.floor((Date.now() - new Date(latestFuelLog.logged_at)) / 86400000);
  const avgMpd    = DEFAULT_AVG_MPD[vehicleId] || 15;
  return latestFuelLog.odometer_mi + Math.round(daysSince * avgMpd);
}

// ── Extended use plate helpers ────────────────────────────────────────────────
export function isGaragedMonth() {
  const m = new Date().getMonth();
  return m === 11 || m === 0 || m === 1;
}

export function fuelLogInGaragedMonth(loggedAt) {
  const m = new Date(loggedAt).getMonth();
  return m === 11 || m === 0 || m === 1;
}

// ── Fuel stats ────────────────────────────────────────────────────────────────
export function calcFuelStats(logs) {
  if (!logs || logs.length === 0) return { avgMpg: '—', avgPpg: '—', costPerMile: '—', monthlySpend: '—' };
  const withMpg   = logs.filter(l => l.mpg != null);
  const avgMpg    = withMpg.length
    ? (withMpg.reduce((s, l) => s + parseFloat(l.mpg), 0) / withMpg.length).toFixed(1)
    : '—';
  const avgPpg    = '$' + (logs.reduce((s, l) => s + parseFloat(l.price_per_gal || 0), 0) / logs.length).toFixed(3);
  const costPerMile = withMpg.length && logs[0].price_per_gal && logs[0].mpg
    ? '$' + (parseFloat(logs[0].price_per_gal) / parseFloat(logs[0].mpg)).toFixed(3)
    : '—';
  const thisMonth   = new Date().getMonth();
  const monthLogs   = logs.filter(l => new Date(l.logged_at + 'T12:00:00').getMonth() === thisMonth);
  const monthlySpend = monthLogs.length
    ? '$' + monthLogs.reduce((s, l) => s + parseFloat(l.total_cost || 0), 0).toFixed(0)
    : '$0';
  return { avgMpg, avgPpg, costPerMile, monthlySpend };
}
