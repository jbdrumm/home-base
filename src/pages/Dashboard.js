import React, { useState } from 'react';
import HeaderBar from '../components/HeaderBar';
import CalendarWidget from '../components/CalendarWidget';
import TodoWidget from '../components/TodoWidget';
import GroceryWidget from '../components/GroceryWidget';
import HomeStatusWidget from '../components/HomeStatusWidget';
import CountdownWidget from '../components/CountdownWidget';
import FinancialWidget from '../components/FinancialWidget';
import WeatherWidget from '../components/WeatherWidget';
import QuickActionFAB from '../components/QuickActionFAB';
import QuickAddModal from '../components/QuickAddModal';

import CalendarFullView from './CalendarFullView';
import TodoFullView from './TodoFullView';
import FinancialFullView from './FinancialFullView';

import { useLocalState } from '../hooks/useLocalState';
import { useCalendarData } from '../hooks/useCalendarData';
import { useTasksData } from '../hooks/useTasksData';
import { useWeather } from '../hooks/useWeather';
import { seedGroceries, seedCountdowns, seedBills } from '../lib/seedData';

function Tile({ onClick, children, style }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer', height: '100%',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.18s ease',
        ...style,
      }}
    >{children}</div>
  );
}

export default function Dashboard({ token, profile, onSignOut }) {
  const groceries = useLocalState(seedGroceries);
  const bills     = useLocalState(seedBills);
  const [view,  setView]  = useState(null);
  const [modal, setModal] = useState(null);

  const calendar = useCalendarData(token);
  const tasks    = useTasksData(token);
  const weather  = useWeather();

  const isMobile = window.innerWidth < 768;

  function toggleBillPaid(id) {
    bills.updateItem(id, { paid_this_month: !bills.items.find(b => b.id === id).paid_this_month });
  }
  function handleQuickAdd(item) {
    if (modal === 'grocery') groceries.addItem(item);
    if (modal === 'todo')    tasks.addTodo({ ...item, list: 'General' });
  }
  function handleSync() {
    calendar.sync();
    tasks.sync();
    weather.refresh();
  }

  const syncLoading = calendar.loading || tasks.loading || weather.loading;
  const lastSync    = calendar.lastSync || tasks.lastSync || weather.lastSync;

  if (view === 'calendar') return (
    <CalendarFullView events={calendar.events} onBack={() => setView(null)} />
  );
  if (view === 'todo') return (
    <TodoFullView todosByList={tasks.todosByList} onToggle={tasks.toggleTodo}
      onAdd={tasks.addTodo} onDelete={tasks.deleteTodo} onBack={() => setView(null)} />
  );
  if (view === 'financial') return (
    <FinancialFullView bills={bills.items} onTogglePaid={toggleBillPaid}
      onAdd={item => bills.addItem(item)} onDelete={id => bills.removeItem(id)}
      onBack={() => setView(null)} />
  );

  return (
    <div style={{
      minHeight: '100vh',
      padding: isMobile ? '20px 16px 100px' : '24px 28px 40px',
      maxWidth: '1800px', margin: '0 auto',
    }}>
      <HeaderBar lastSync={lastSync} loading={syncLoading}
        onSync={handleSync} profile={profile} onSignOut={onSignOut} />

      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Tile onClick={() => setView('calendar')}><CalendarWidget events={calendar.events} /></Tile>
          <Tile onClick={() => setView('todo')}>
            <TodoWidget todosByList={tasks.todosByList} onToggle={tasks.toggleTodo} />
          </Tile>
          <div style={{ height: '420px' }}>
            <GroceryWidget items={groceries.items}
              onToggle={id => groceries.updateItem(id, { done: !groceries.items.find(g => g.id === id).done })}
              onClearDone={() => groceries.clearWhere(i => i.done)} />
          </div>
          <WeatherWidget />
          <Tile onClick={() => setView('financial')}><FinancialWidget bills={bills.items} /></Tile>
          <Tile onClick={() => setView('home')}><HomeStatusWidget /></Tile>
          <CountdownWidget countdowns={seedCountdowns} messages={[]} />
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1.2fr',
          gridTemplateRows: 'minmax(220px, auto) minmax(200px, auto)',
          gap: '16px',
        }}>
          <Tile onClick={() => setView('calendar')} style={{ gridColumn: '1', gridRow: '1' }}>
            <CalendarWidget events={calendar.events} />
          </Tile>
          <Tile onClick={() => setView('todo')} style={{ gridColumn: '2', gridRow: '1' }}>
            <TodoWidget todosByList={tasks.todosByList} onToggle={tasks.toggleTodo} />
          </Tile>
          <div style={{ gridColumn: '3', gridRow: '1' }}>
            <WeatherWidget />
          </div>
          <div style={{ gridColumn: '4', gridRow: '1 / 3' }}>
            <GroceryWidget items={groceries.items}
              onToggle={id => groceries.updateItem(id, { done: !groceries.items.find(g => g.id === id).done })}
              onClearDone={() => groceries.clearWhere(i => i.done)} />
          </div>
          <Tile onClick={() => setView('home')} style={{ gridColumn: '1 / 3', gridRow: '2' }}>
            <HomeStatusWidget wide />
          </Tile>
          <Tile onClick={() => setView('financial')} style={{ gridColumn: '3', gridRow: '2' }}>
            <FinancialWidget bills={bills.items} />
          </Tile>
        </div>
      )}

      <QuickActionFAB onAction={type => setModal(type)} />
      {modal && (
        <QuickAddModal type={modal} onClose={() => setModal(null)} onAdd={handleQuickAdd} />
      )}
    </div>
  );
}
