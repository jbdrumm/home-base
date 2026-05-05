// ── Sprint 9 — Vehicle seed data ──────────────────────────────────────────

export const seedVehicles = [
  {
    id: 'v1',
    name: '2017 Dodge Durango GT',
    make: 'Dodge',
    model: 'Durango',
    year: 2017,
    trim: 'GT',
    engine: '3.6L V6',
    color: 'Granite Crystal',
    emoji: '🚙',
    license_plate: 'ABC 1234',
    state: 'Illinois',
    insurance_company: 'USAA',
    policy_number: 'USAA-2024-IL-88471',
    toll_tag: 'I-PASS · 400123456',
    car_wash_pass: 'Mister Car Wash',
    extended_use_plate: false,
    photo_url: 'https://di-uploads-development.dealerinspire.com/kendalldodgechryslerjeepram1/uploads/2017/12/2017_dodge_durango_kendall_dodge1.png',
  },
  {
    id: 'v2',
    name: '2018 Honda Odyssey Elite',
    make: 'Honda',
    model: 'Odyssey',
    year: 2018,
    trim: 'Elite',
    engine: '3.5L V6',
    color: 'Lunar Silver',
    emoji: '🚐',
    license_plate: 'XYZ 5678',
    state: 'Illinois',
    insurance_company: 'USAA',
    policy_number: 'USAA-2024-IL-88472',
    toll_tag: 'I-PASS · 400123457',
    car_wash_pass: 'Mister Car Wash',
    extended_use_plate: false,
    photo_url: 'https://autoimage.capitalone.com/stock-media/evox/2018-Honda-Odyssey-Elite-WA-12089_cc2400_032_WA.png',
  },
  {
    id: 'v3',
    name: '2000 Honda S2000',
    make: 'Honda',
    model: 'S2000',
    year: 2000,
    trim: 'Base',
    engine: '2.0L F20C VTEC',
    color: 'Grand Prix White',
    emoji: '🏎',
    license_plate: 'S2K 2000',
    state: 'Illinois',
    insurance_company: 'USAA',
    policy_number: 'USAA-2024-IL-88473',
    toll_tag: null,
    car_wash_pass: null,
    extended_use_plate: true,
    photo_url: 'https://www.motorcarclassics.com/galleria_images/388/388_main_l.jpg',
  },
  {
    id: 'v4',
    name: '1994 Ford Ranger Splash',
    make: 'Ford',
    model: 'Ranger',
    year: 1994,
    trim: 'Splash',
    engine: '2.3L 4-cyl',
    color: 'Calypso Green',
    emoji: '🛻',
    license_plate: 'YJ 1994',
    state: 'Illinois',
    insurance_company: 'USAA',
    policy_number: 'USAA-2024-IL-88474',
    toll_tag: null,
    car_wash_pass: null,
    extended_use_plate: true,
    photo_url: 'https://i.redd.it/l89wj6mw46qc1.png',
  },
];

// ── Maintenance schedules (per vehicle id) ─────────────────────────────────
export const seedMaintenanceSchedule = {
  v1: [
    { id: 'm1-1', task: 'Oil Change',       notes: '5W-20 Synthetic',  interval_mi: 5000,  last_done_mi: 68400, last_done_at: '2025-02-10', status: 'overdue' },
    { id: 'm1-2', task: 'Tire Rotation',    notes: null,               interval_mi: 7500,  last_done_mi: 69000, last_done_at: '2025-03-01', status: 'good' },
    { id: 'm1-3', task: 'Air Filter',       notes: null,               interval_mi: 15000, last_done_mi: 60000, last_done_at: '2024-06-15', status: 'soon' },
    { id: 'm1-4', task: 'Brake Fluid',      notes: null,               interval_mo: 24,    last_done_mi: 55000, last_done_at: '2023-09-01', status: 'soon' },
    { id: 'm1-5', task: 'Transmission',     notes: 'ATF+4',            interval_mi: 60000, last_done_mi: 40000, last_done_at: '2022-01-15', status: 'good' },
  ],
  v2: [
    { id: 'm2-1', task: 'Oil Change',       notes: '0W-20 Full Syn',   interval_mi: 5000,  last_done_mi: 54200, last_done_at: '2025-03-18', status: 'good' },
    { id: 'm2-2', task: 'Tire Rotation',    notes: null,               interval_mi: 7500,  last_done_mi: 52000, last_done_at: '2025-01-10', status: 'soon' },
    { id: 'm2-3', task: 'Cabin Air Filter', notes: null,               interval_mi: 15000, last_done_mi: 45000, last_done_at: '2024-05-20', status: 'soon' },
    { id: 'm2-4', task: 'Spark Plugs',      notes: 'Iridium',          interval_mi: 60000, last_done_mi: 30000, last_done_at: '2021-08-01', status: 'good' },
  ],
  v3: [
    { id: 'm3-1', task: 'Oil Change',       notes: '10W-30 Full Syn',  interval_mi: 3000,  last_done_mi: 112100, last_done_at: '2025-03-05', status: 'good' },
    { id: 'm3-2', task: 'Valve Clearance',  notes: 'VTEC spec',        interval_mi: 30000, last_done_mi: 90000,  last_done_at: '2023-07-12', status: 'overdue' },
    { id: 'm3-3', task: 'Coolant Flush',    notes: null,               interval_mo: 36,    last_done_mi: 105000, last_done_at: '2023-09-01', status: 'soon' },
    { id: 'm3-4', task: 'Soft Top',         notes: 'Inspect & treat',  interval_mo: 12,    last_done_mi: 108000, last_done_at: '2024-04-01', status: 'soon' },
  ],
  v4: [
    { id: 'm4-1', task: 'Oil Change',       notes: '10W-40',             interval_mi: 3000,  last_done_mi: 142000, last_done_at: '2025-01-20', status: 'overdue' },
    { id: 'm4-2', task: 'Axle U-Joints',    notes: 'Grease & inspect',   interval_mi: 15000, last_done_mi: 135000, last_done_at: '2024-06-01', status: 'soon' },
    { id: 'm4-3', task: 'Transfer Case',    notes: 'Motorcraft fluid',   interval_mi: 30000, last_done_mi: 120000, last_done_at: '2023-01-01', status: 'soon' },
    { id: 'm4-4', task: 'Soft Top',         notes: 'Clean & protect',    interval_mo: 12,    last_done_mi: 140000, last_done_at: '2024-03-15', status: 'good' },
  ],
};

// ── Fuel log seed (most recent fills per vehicle) ───────────────────────────
export const seedFuelLog = {
  v1: [
    { id: 'f1-1', logged_at: '2025-05-01', odometer_mi: 73200, gallons: 16.8, price_per_gal: 3.49, total_cost: 58.63, mpg: 22.4, station: 'Speedway · Gurnee' },
    { id: 'f1-2', logged_at: '2025-04-16', odometer_mi: 72824, gallons: 17.2, price_per_gal: 3.55, total_cost: 61.06, mpg: 21.9, station: 'BP · Waukegan' },
    { id: 'f1-3', logged_at: '2025-04-01', odometer_mi: 72447, gallons: 16.5, price_per_gal: 3.61, total_cost: 59.57, mpg: 22.8, station: 'Speedway · Gurnee' },
  ],
  v2: [
    { id: 'f2-1', logged_at: '2025-05-02', odometer_mi: 57100, gallons: 18.4, price_per_gal: 3.49, total_cost: 64.22, mpg: 23.9, station: 'Costco · Gurnee' },
    { id: 'f2-2', logged_at: '2025-04-18', odometer_mi: 56660, gallons: 17.9, price_per_gal: 3.45, total_cost: 61.76, mpg: 24.6, station: 'Costco · Gurnee' },
  ],
  v3: [
    { id: 'f3-1', logged_at: '2025-04-25', odometer_mi: 112540, gallons: 11.2, price_per_gal: 3.99, total_cost: 44.69, mpg: 28.6, station: 'Shell · Libertyville' },
    { id: 'f3-2', logged_at: '2025-04-08', odometer_mi: 112220, gallons: 10.8, price_per_gal: 4.05, total_cost: 43.74, mpg: 29.6, station: 'Shell · Libertyville' },
  ],
  v4: [
    { id: 'f4-1', logged_at: '2025-04-20', odometer_mi: 143800, gallons: 14.1, price_per_gal: 3.89, total_cost: 54.85, mpg: 17.2, station: 'Speedway · Zion' },
    { id: 'f4-2', logged_at: '2025-04-05', odometer_mi: 143558, gallons: 13.9, price_per_gal: 3.75, total_cost: 52.13, mpg: 17.4, station: 'Speedway · Zion' },
  ],
};

// ── Estimated odometer (from last fuel log + avg miles/day) ────────────────
export function estimateOdometer(vehicleId, fuelLog) {
  const logs = fuelLog[vehicleId];
  if (!logs || logs.length === 0) return null;
  const latest = logs[0];
  const daysSince = Math.floor((Date.now() - new Date(latest.logged_at)) / 86400000);

  // For extended use vehicles, skip Dec-Feb days in estimation
  const avgMpd = vehicleId === 'v3' ? 5 : vehicleId === 'v4' ? 3 : vehicleId === 'v2' ? 18 : 22;

  return latest.odometer_mi + Math.round(daysSince * avgMpd);
}

// ── Status calculation ──────────────────────────────────────────────────────
export function getVehicleStatus(vehicleId) {
  const schedule = seedMaintenanceSchedule[vehicleId] || [];
  if (schedule.some(t => t.status === 'overdue')) return 'overdue';
  if (schedule.some(t => t.status === 'soon')) return 'soon';
  return 'good';
}

export function statusChipStyle(status) {
  if (status === 'overdue') return { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', label: '⚠ Overdue' };
  if (status === 'soon')    return { bg: 'var(--color-warn-bg)',   color: 'var(--color-warn)',   label: 'Due soon' };
  return                           { bg: 'var(--color-success-bg)', color: 'var(--color-success)', label: 'Good' };
}

// ── Extended use plate: is the vehicle currently garaged? ─────────────────
export function isGaragedMonth() {
  const m = new Date().getMonth(); // 0=Jan, 11=Dec
  return m === 11 || m === 0 || m === 1; // Dec, Jan, Feb
}

export function fuelLogInGaragedMonth(loggedAt) {
  const m = new Date(loggedAt).getMonth();
  return m === 11 || m === 0 || m === 1;
}

// ── Fuel stats helper ──────────────────────────────────────────────────────
export function calcFuelStats(logs) {
  if (!logs || logs.length === 0) return { avgMpg: '—', avgPpg: '—', costPerMile: '—', monthlySpend: '—' };
  const avgMpg = (logs.reduce((s, l) => s + (l.mpg || 0), 0) / logs.length).toFixed(1);
  const avgPpg = '$' + (logs.reduce((s, l) => s + l.price_per_gal, 0) / logs.length).toFixed(2);
  const costPerMile = logs[0].mpg ? '$' + (logs[0].price_per_gal / logs[0].mpg).toFixed(3) : '—';
  const thisMonth = new Date().getMonth();
  const monthLogs = logs.filter(l => new Date(l.logged_at).getMonth() === thisMonth);
  const monthlySpend = monthLogs.length ? '$' + monthLogs.reduce((s, l) => s + l.total_cost, 0).toFixed(0) : '$0';
  return { avgMpg, avgPpg, costPerMile, monthlySpend };
}
