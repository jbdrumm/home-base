import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { vehicleDisplayConfig } from '../lib/vehicleData';

// ── useVehicleData ────────────────────────────────────────────────────────────
// Loads all vehicles, their maintenance schedules, and fuel logs from Supabase.
// Merges display config (photos, emoji) from vehicleData.js.

export function useVehicleData() {
  const [vehicles,    setVehicles]    = useState([]);
  const [maintenance, setMaintenance] = useState({}); // keyed by vehicle_id
  const [fuelLogs,    setFuelLogs]    = useState({}); // keyed by vehicle_id
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load all three tables in parallel
      const [vRes, mRes, fRes] = await Promise.all([
        supabase.from('vehicles').select('*').order('year', { ascending: false }),
        supabase.from('maintenance_schedule').select('*').order('task'),
        supabase.from('fuel_log').select('*').order('logged_at', { ascending: false }),
      ]);

      if (vRes.error) throw vRes.error;
      if (mRes.error) throw mRes.error;
      if (fRes.error) throw fRes.error;

      // Merge display config into vehicles
      const vehiclesWithDisplay = (vRes.data || []).map(v => ({
        ...v,
        ...(vehicleDisplayConfig[v.id] || {}),
        name: `${v.year} ${v.make} ${v.model}${v.trim ? ' ' + v.trim : ''}`,
      }));

      // Index maintenance by vehicle_id
      const maintByVehicle = {};
      for (const row of (mRes.data || [])) {
        if (!maintByVehicle[row.vehicle_id]) maintByVehicle[row.vehicle_id] = [];
        maintByVehicle[row.vehicle_id].push(row);
      }

      // Index fuel logs by vehicle_id (already sorted desc by logged_at)
      const fuelByVehicle = {};
      for (const row of (fRes.data || [])) {
        if (!fuelByVehicle[row.vehicle_id]) fuelByVehicle[row.vehicle_id] = [];
        fuelByVehicle[row.vehicle_id].push(row);
      }

      setVehicles(vehiclesWithDisplay);
      setMaintenance(maintByVehicle);
      setFuelLogs(fuelByVehicle);
    } catch (e) {
      console.error('[useVehicleData]', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { vehicles, maintenance, fuelLogs, loading, error, reload: load };
}
