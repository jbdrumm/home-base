import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { Calendar } from 'lucide-react';
import styles from './Card.module.css';

function getEventTime(event) {
  if (event.start?.dateTime) {
    return format(parseISO(event.start.dateTime), 'h:mm a');
  }
  return 'All day';
}

function getEventDay(event) {
  const d = event.start?.dateTime
    ? parseISO(event.start.dateTime)
    : parseISO(event.start?.date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEE, MMM d');
}

const DOT_COLORS = ['#5B9BF5', '#4CAF76', '#F59E0B', '#EF5350', '#A78BFA', '#F472B6'];

export default function CalendarCard({ events }) {
  const today = events.filter(e => {
    const d = e.start?.dateTime ? parseISO(e.start.dateTime) : parseISO(e.start?.date);
    return isToday(d);
  });

  const upcoming = events.filter(e => {
    const d = e.start?.dateTime ? parseISO(e.start.dateTime) : parseISO(e.start?.date);
    return !isToday(d);
  }).slice(0, 3);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <Calendar size={14} strokeWidth={2} />
        <span>Calendar</span>
      </div>

      {today.length === 0 && upcoming.length === 0 && (
        <div className={styles.empty}>Nothing scheduled this week</div>
      )}

      {today.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Today</div>
          {today.map((e, i) => (
            <div key={e.id} className={styles.eventRow}>
              <span className={styles.dot} style={{ background: DOT_COLORS[i % DOT_COLORS.length] }} />
              <div className={styles.eventInfo}>
                <span className={styles.eventTitle}>{e.summary}</span>
                <span className={styles.eventTime}>{getEventTime(e)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Upcoming</div>
          {upcoming.map((e, i) => (
            <div key={e.id} className={styles.eventRow}>
              <span className={styles.dot} style={{ background: DOT_COLORS[(today.length + i) % DOT_COLORS.length] }} />
              <div className={styles.eventInfo}>
                <span className={styles.eventTitle}>{e.summary}</span>
                <span className={styles.eventTime}>{getEventDay(e)} · {getEventTime(e)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
