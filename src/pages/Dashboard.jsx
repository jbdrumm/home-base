import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import CalendarCard from '../components/CalendarCard';
import TodoCard from '../components/TodoCard';
import GroceryCard from '../components/GroceryCard';
import { MessageBoard, CountdownCard } from '../components/InfoCards';
import QuickAdd from '../components/QuickAdd';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { weather, events, todos, grocery, messages, countdowns, loading, refresh } = useDashboard();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const isMobile = window.innerWidth < 768;

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingDot} />
        <div className={styles.loadingDot} style={{ animationDelay: '0.15s' }} />
        <div className={styles.loadingDot} style={{ animationDelay: '0.3s' }} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        {/* Row 1: Calendar + To-do + Grocery */}
        <div className={`${styles.card} ${styles.span2}`}>
          <CalendarCard events={events} />
        </div>
        <div className={styles.card}>
          <TodoCard todos={todos} onRefresh={refresh} />
        </div>
        <div className={styles.card}>
          <GroceryCard items={grocery} onRefresh={refresh} />
        </div>

        {/* Row 2: Message board + Countdowns */}
        <div className={`${styles.card} ${styles.span2}`}>
          <MessageBoard messages={messages} />
        </div>
        <div className={`${styles.card} ${styles.span2}`}>
          <CountdownCard countdowns={countdowns} />
        </div>
      </div>

      {/* Floating quick-add button (mobile primary, desktop secondary) */}
      <button
        className={styles.fab}
        onClick={() => setShowQuickAdd(true)}
        aria-label="Quick add"
      >
        <Plus size={22} />
      </button>

      {showQuickAdd && (
        <QuickAdd
          onClose={() => setShowQuickAdd(false)}
          onSuccess={() => { setShowQuickAdd(false); refresh(); }}
        />
      )}
    </div>
  );
}
