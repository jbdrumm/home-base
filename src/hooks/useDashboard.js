import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { fetchCalendarEvents, fetchWeather } from '../lib/google';
import { useAuth } from './useAuth';

const WEATHER_REFRESH_MS = 10 * 60 * 1000; // 10 min
const DATA_REFRESH_MS = 2 * 60 * 1000;     // 2 min

export function useDashboard() {
  const { householdId, googleToken, householdProfiles } = useAuth();
  const [weather, setWeather] = useState(null);
  const [events, setEvents] = useState([]);
  const [todos, setTodos] = useState([]);
  const [grocery, setGrocery] = useState([]);
  const [messages, setMessages] = useState([]);
  const [countdowns, setCountdowns] = useState([]);
  const [loading, setLoading] = useState(true);

  const calendarIds = householdProfiles
    .flatMap(p => p.google_calendar_ids || [])
    .filter(Boolean);
  // Always include primary fallback
  const allCalendarIds = calendarIds.length ? calendarIds : ['primary'];

  const loadWeather = useCallback(async () => {
    const lat = process.env.REACT_APP_WEATHER_LAT;
    const lon = process.env.REACT_APP_WEATHER_LON;
    const key = process.env.REACT_APP_TOMORROW_API_KEY;
    if (!lat || !lon || !key) return;
    try {
      const data = await fetchWeather(lat, lon, key);
      setWeather(data);
    } catch {}
  }, []);

  const loadCalendar = useCallback(async () => {
    if (!googleToken) return;
    try {
      const ev = await fetchCalendarEvents(googleToken, allCalendarIds);
      setEvents(ev);
    } catch {}
  }, [googleToken, allCalendarIds.join(',')]); // eslint-disable-line

  const loadSupabaseData = useCallback(async () => {
    if (!householdId) return;
    const [todosRes, groceryRes, messagesRes, countdownsRes] = await Promise.all([
      supabase.from('todos').select('*').eq('household_id', householdId).eq('completed', false).order('created_at'),
      supabase.from('grocery_items').select('*').eq('household_id', householdId).order('category').order('created_at'),
      supabase.from('messages').select('*, profiles(display_name, avatar_color)').eq('household_id', householdId).order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(5),
      supabase.from('countdowns').select('*').eq('household_id', householdId).order('target_date'),
    ]);
    if (todosRes.data) setTodos(todosRes.data);
    if (groceryRes.data) setGrocery(groceryRes.data);
    if (messagesRes.data) setMessages(messagesRes.data);
    if (countdownsRes.data) setCountdowns(countdownsRes.data);
  }, [householdId]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadWeather(), loadCalendar(), loadSupabaseData()]);
      setLoading(false);
    }
    init();

    const weatherTimer = setInterval(loadWeather, WEATHER_REFRESH_MS);
    const dataTimer = setInterval(() => {
      loadCalendar();
      loadSupabaseData();
    }, DATA_REFRESH_MS);

    return () => { clearInterval(weatherTimer); clearInterval(dataTimer); };
  }, [loadWeather, loadCalendar, loadSupabaseData]);

  // Realtime subscriptions for Supabase tables
  useEffect(() => {
    if (!householdId) return;
    const channel = supabase.channel('household-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos', filter: `household_id=eq.${householdId}` }, loadSupabaseData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_items', filter: `household_id=eq.${householdId}` }, loadSupabaseData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `household_id=eq.${householdId}` }, loadSupabaseData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'countdowns', filter: `household_id=eq.${householdId}` }, loadSupabaseData)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [householdId, loadSupabaseData]);

  return {
    weather, events, todos, grocery, messages, countdowns,
    loading, refresh: loadSupabaseData,
  };
}
