import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { vehicleDisplayConfig } from '../lib/vehicleData';

export function useVehicleData() {
  const [vehicles,    setVehicles]    = useState([]);
  const [maintenance, setMaintenance] = useState({});
  const [maintLogs,   setMaintLogs]   = useState({}); // keyed by schedule_id
  const [fuelLogs,    setFuelLogs]    = useState({});
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vRes, mRes, mlRes, fRes] = await Promise.all([
        supabase.from('vehicles').select('*').order('year', { ascending: false }),
        supabase.from('maintenance_schedule').select('*').order('task'),
        supabase.from('maintenance_log').select('*').order('done_at', { ascending: false }),
        supabase.from('fuel_log').select('*').order('logged_at', { ascending: false }),
      ]);

      if (vRes.error) throw vRes.error;
      if (mRes.error) throw mRes.error;
      if (fRes.error) throw fRes.error;

      const vehiclesWithDisplay = (vRes.data || []).map(v => ({
        ...v,
        ...(vehicleDisplayConfig[v.id] || {}),
        name: `${v.year} ${v.make} ${v.model}${v.trim ? ' ' + v.trim : ''}`,
      }));

      const maintByVehicle = {};
      for (const row of (mRes.data || [])) {
        if (!maintByVehicle[row.vehicle_id]) maintByVehicle[row.vehicle_id] = [];
        maintByVehicle[row.vehicle_id].push(row);
      }

      // Index maintenance_log by schedule_id
      const logsBySchedule = {};
      for (const row of (mlRes.data || [])) {
        const key = row.schedule_id || row.task;
        if (!logsBySchedule[key]) logsBySchedule[key] = [];
        logsBySchedule[key].push(row);
      }

      // Backfill last_done_mi and last_done_at on schedule rows from logs
      for (const rows of Object.values(maintByVehicle)) {
        for (const task of rows) {
          const logs = logsBySchedule[task.id] || [];
          if (logs.length > 0) {
            const latest = logs[0]; // already sorted desc
            if (latest.odometer_mi) task.last_done_mi = latest.odometer_mi;
            if (latest.done_at)     task.last_done_at = latest.done_at;
          }
        }
      }

      const fuelByVehicle = {};
      for (const row of (fRes.data || [])) {
        if (!fuelByVehicle[row.vehicle_id]) fuelByVehicle[row.vehicle_id] = [];
        fuelByVehicle[row.vehicle_id].push(row);
      }

      setVehicles(vehiclesWithDisplay);
      setMaintenance(maintByVehicle);
      setMaintLogs(logsBySchedule);
      setFuelLogs(fuelByVehicle);
    } catch (e) {
      console.error('[useVehicleData]', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { vehicles, maintenance, maintLogs, fuelLogs, loading, error, reload: load };
}
