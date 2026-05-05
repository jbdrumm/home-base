import { Pin, Timer } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import styles from './Card.module.css';

export function MessageBoard({ messages }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <Pin size={14} strokeWidth={2} />
        <span>Family board</span>
      </div>

      {messages.length === 0 && (
        <div className={styles.empty}>No messages yet</div>
      )}

      <div className={styles.messageList}>
        {messages.map(msg => (
          <div key={msg.id} className={`${styles.messageItem} ${msg.pinned ? styles.pinned : ''}`}>
            <div
              className={styles.avatar}
              style={{ background: msg.profiles?.avatar_color || '#5B9BF5' }}
            >
              {(msg.profiles?.display_name || 'U').slice(0, 2).toUpperCase()}
            </div>
            <div className={styles.messageBody}>
              <div className={styles.messageName}>{msg.profiles?.display_name || 'Family'}</div>
              <div className={styles.messageText}>{msg.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CountdownCard({ countdowns }) {
  const now = new Date();

  const active = countdowns
    .map(c => ({
      ...c,
      daysLeft: differenceInDays(parseISO(c.target_date + 'T00:00:00'), now),
    }))
    .filter(c => c.daysLeft >= 0)
    .slice(0, 3);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <Timer size={14} strokeWidth={2} />
        <span>Countdowns</span>
      </div>

      {active.length === 0 && (
        <div className={styles.empty}>No upcoming events</div>
      )}

      <div className={styles.countdownList}>
        {active.map(c => (
          <div key={c.id} className={styles.countdownItem}>
            <div className={styles.countdownEmoji}>{c.emoji}</div>
            <div className={styles.countdownInfo}>
              <div className={styles.countdownLabel}>{c.label}</div>
              <div className={styles.countdownDate}>
                {format(parseISO(c.target_date + 'T00:00:00'), 'MMM d, yyyy')}
              </div>
            </div>
            <div>
              <div className={styles.countdownDays}>{c.daysLeft}</div>
              <div className={styles.countdownDayLabel}>{c.daysLeft === 1 ? 'day' : 'days'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
