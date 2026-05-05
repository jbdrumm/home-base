import { useState, useEffect, useCallback } from 'react';
import {
  fetchCalendarList, fetchCalendarEvents,
  normalizeCalendarEvent,
} from '../lib/google';
import { seedEvents } from '../lib/seedData';

export function useCalendarData(token) {
  const [events,  setEvents]  = useState(seedEvents);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const sync = useCallback(async () => {
    if (!token) {
      console.warn('[Calendar] No token available — skipping sync');
      return;
    }
    console.log('[Calendar] Syncing with token:', token.slice(0, 12) + '...');
    setLoading(true);
    setError(null);
    try {
      const calendars = await fetchCalendarList(token);
      console.log('[Calendar] Found calendars:', calendars.map(c => c.summary));
      const selected  = calendars.filter(c =>
        c.selected !== false &&
        ['owner','writer','reader'].includes(c.accessRole)
      );

      // Fetch events from all selected calendars in parallel
      const results = await Promise.all(
        selected.map(async cal => {
          const raw = await fetchCalendarEvents(token, cal.id, 45);
          const owner = cal.primary ? 'jacob' :
                        cal.summary?.toLowerCase().includes('family') ? 'family' : 'wife';
          return raw.map(e => normalizeCalendarEvent(e, owner));
        })
      );

      // Merge, deduplicate by id, sort by rawDate
      const merged = results
        .flat()
        .filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i)
        .sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));

      setEvents(merged);
      setLastSync(new Date());
    } catch (e) {
      console.error('Calendar sync error', e);
      setError('Could not load calendar. Using cached data.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Sync on mount and every 5 minutes
  useEffect(() => {
    sync();
    const interval = setInterval(sync, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [sync]);

  return { events, loading, error, lastSync, sync };
}
