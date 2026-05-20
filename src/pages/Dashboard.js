import React, { useState, useEffect } from 'react';
import HeaderBar from '../components/HeaderBar';
import CalendarWidget from '../components/CalendarWidget';
import TodoWidget from '../components/TodoWidget';
import GroceryWidget from '../components/GroceryWidget';
import HomeStatusWidget from '../components/HomeStatusWidget';
import FinancialWidget from '../components/FinancialWidget';
import WeatherWidget from '../components/WeatherWidget';
import VehicleWidget from '../components/VehicleWidget';
import CameraWidget from '../components/CameraWidget';
import QuickActionFAB from '../components/QuickActionFAB';
import QuickAddModal from '../components/QuickAddModal';
import LogFillupModal from '../components/LogFillupModal';
import HouseholdSetup from '../components/HouseholdSetup';
import NotificationSettings from '../components/NotificationSettings';

import CalendarFullView from './CalendarFullView';
import TodoFullView from './TodoFullView';
import GroceryFullView from './GroceryFullView';
import FinancialFullView from './FinancialFullView';
import VehicleFullView from './VehicleFullView';
import WeatherFullView from './WeatherFullView';
import PersonView from './PersonView';

import { useSupabaseList } from '../hooks/useSupabaseList';
import { useNotificationPrefs } from '../hooks/useNotificationPrefs';
import { useNotificationTriggers } from '../hooks/useNotificationTriggers';
import { registerFCMToken } from '../lib/firebase';
import { useMultiAccountData } from '../hooks/useMultiAccountData';
import { useWeather } from '../hooks/useWeather';
import { seedGroceries, seedBills } from '../lib/seedData';
import { seedVehicles } from '../lib/vehicleData';
import { useTilePreferences } from '../hooks/useTilePreferences';
import LayoutSettings from '../components/LayoutSettings';

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

export default function Dashboard({ token, profile, onSignOut, householdAuth, initialQuickAdd }) {
  const groceries = useSupabaseList('groceries', seedGroceries, 'id');
  const bills     = useSupabaseList('bills', seedBills, 'due_day');
  const [view,  setView]  = useState(null);
  const [modal, setModal] = useState(null);

  // Open quick-add modal from PWA home screen shortcut
  useEffect(() => {
    if (initialQuickAdd && (initialQuickAdd === 'todo' || initialQuickAdd === 'grocery')) {
      setModal(initialQuickAdd);
      sessionStorage.removeItem('hb_quick');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [activeVehicleId, setActiveVehicleId] = useState(null);
  const [showFillup, setShowFillup] = useState(false);

  const {
    householdTokens, primaryMember, getTokenFor,
    linkMember, unlinkMember, linkingMember, error: authError,
  } = householdAuth || {};

  const multiData = useMultiAccountData(getTokenFor || (() => null), householdTokens || {});

  function handleTaskToggle(params) { multiData.toggleTask && multiData.toggleTask(params); }
  function handleTaskDelete(params) { multiData.removeTask && multiData.removeTask(params); }
  function handleTaskMove(params)   { multiData.moveTask   && multiData.moveTask(params); }
  const { weather, hourly: weatherHourly, daily: weatherDaily, loading: weatherLoading, lastSync: weatherSync, refresh: refreshWeather } = useWeather();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth < 768); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Tile preferences — per member, mobile layout + visibility
  const { prefs: tilePrefs, loading: tilePrefsLoading, toggleTile, reorderTile, moveTile } =
    useTilePreferences(primaryMember);

  // Build ordered, filtered list of enabled tile IDs for mobile
  const enabledMobileTiles = tilePrefs
    .filter(p => p.enabled)
    .map(p => p.tile_id);

  // Notification prefs for this device's primary member
  const { prefs: notifPrefs } = useNotificationPrefs(primaryMember);

  // Register FCM token for push notifications (once per member per device)
  // Falls back to 'jacob' if primaryMember not yet detected (email match pending)
  useEffect(() => {
    const member = primaryMember || (() => {
      try {
        const p = JSON.parse(localStorage.getItem('hb_profile') || '{}');
        if (p.email === 'jacob.b.drumm@gmail.com')   return 'jacob';
        if (p.email === 'drummkatelin@gmail.com')     return 'katelin';
        if (p.email === 'drummfam@gmail.com')         return 'family';
      } catch {}
      return null;
    })();
    if (!member) return;
    const storageKey = `hb_fcm_registered_${member}`;
    if (localStorage.getItem(storageKey)) return; // already registered on this device
    registerFCMToken(member).then(token => {
      if (token) localStorage.setItem(storageKey, '1');
    });
  }, [primaryMember]);

  // Notification triggers — watches state and fires per saved prefs
  const householdMembers = Object.keys(householdTokens || {}).filter(m => householdTokens[m]?.isValid);
  useNotificationTriggers({
    primaryMember,
    prefs:           notifPrefs,
    bills:           bills.items,
    todosByList:     multiData.todosByList,
    groceries:       groceries.items,
    events:          multiData.events,
    householdMembers,
  });

  function toggleBillPaid(id) {
    bills.updateItem(id, { paid_this_month: !bills.items.find(b => b.id === id).paid_this_month });
  }
  function handleQuickAdd(item) {
    if (modal === 'grocery') groceries.addItem({ ...item, created_by: primaryMember });
    if (modal === 'todo')    multiData.addTask(item);
  }
  function handleSync() {
    multiData.sync();
    refreshWeather();
  }

  const syncLoading = multiData.loading || weatherLoading;
  const lastSync    = multiData.lastSync || weatherSync;

  if (view === 'household') return (
    <HouseholdSettingsView
      householdTokens={householdTokens || {}}
      linkMember={linkMember}
      unlinkMember={unlinkMember}
      linkingMember={linkingMember}
      authError={authError}
      onClose={() => setView(null)}
      tilePrefs={tilePrefs}
      tilePrefsLoading={tilePrefsLoading}
      toggleTile={toggleTile}
      reorderTile={reorderTile}
      moveTile={moveTile}
    />
  );

  if (view === 'jacob') return (
    <PersonView name="Jacob" onBack={() => setView(null)} />
  );
  if (view === 'katelin') return (
    <PersonView name="Katelin" onBack={() => setView(null)} />
  );
  if (view === 'weather') return (
    <WeatherFullView onBack={() => setView(null)} weather={weather} hourly={weatherHourly} daily={weatherDaily} />
  );

  if (view === 'calendar') return (
    <CalendarFullView events={multiData.events} onBack={() => setView(null)} />
  );
  if (view === 'grocery') return (
    <GroceryFullView
      items={groceries.items}
      onAdd={item => groceries.addItem({ ...item, created_by: primaryMember })}
      onToggle={id => groceries.updateItem(id, { done: !groceries.items.find(g => g.id === id)?.done })}
      onDelete={id => groceries.removeItem(id)}
      onClearDone={() => groceries.items.filter(i => i.done).forEach(i => groceries.removeItem(i.id))}
      onBack={() => setView(null)}
    />
  );
  if (view === 'todo') return (
    <TodoFullView
      todosByList={multiData.todosByList}
      onAdd={multiData.addTask}
      onToggle={handleTaskToggle}
      onDelete={handleTaskDelete}
      onMove={handleTaskMove}
      onBack={() => setView(null)}
      householdTokens={householdTokens || {}}
      primaryMember={primaryMember}
    />
  );
  if (view === 'financial') return (
    <FinancialFullView bills={bills.items} onTogglePaid={toggleBillPaid}
      onAdd={item => bills.addItem(item)} onDelete={id => bills.removeItem(id)}
      onBack={() => setView(null)} />
  );
  if (view === 'vehicles') return (
    <VehicleFullView
      initialVehicleId={activeVehicleId}
      onBack={() => { setView(null); setActiveVehicleId(null); }}
    />
  );

  return (
    <div style={{
      minHeight: '100vh',
      padding: isMobile ? '20px 16px 100px' : '24px 28px 40px',
      maxWidth: '1800px', margin: '0 auto',
    }}>
      <HeaderBar lastSync={lastSync} loading={syncLoading}
        onSync={handleSync} profile={profile} onSignOut={onSignOut}
        onShowJacob={() => setView('jacob')}
        onShowKatelin={() => setView('katelin')}
        onShowHousehold={() => setView('household')} />

      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {enabledMobileTiles.map(tileId => {
            switch (tileId) {
              case 'weather':
                return (
                  <Tile key="weather" onClick={() => setView('weather')}>
                    <WeatherWidget />
                  </Tile>
                );
              case 'calendar':
                return (
                  <Tile key="calendar" onClick={() => setView('calendar')}>
                    <CalendarWidget events={multiData.events} />
                  </Tile>
                );
              case 'todo':
                return (
                  <Tile key="todo" onClick={() => setView('todo')}>
                    <TodoWidget todosByList={multiData.todosByList} primaryMember={primaryMember} onToggle={handleTaskToggle} onDelete={handleTaskDelete} />
                  </Tile>
                );
              case 'grocery':
                return (
                  <div key="grocery" style={{ minHeight: '380px' }}>
                    <GroceryWidget items={groceries.items}
                      onToggle={id => groceries.updateItem(id, { done: !groceries.items.find(g => g.id === id).done })}
                      onClearDone={() => groceries.clearWhere(i => i.done)}
                      onOpenFullscreen={() => setView('grocery')} />
                  </div>
                );
              case 'homestatus':
                return (
                  <Tile key="homestatus" onClick={() => setView('home')}>
                    <HomeStatusWidget />
                  </Tile>
                );
              case 'vehicles':
                return (
                  <div key="vehicles">
                    <VehicleWidget onSelectVehicle={id => { setActiveVehicleId(id); setView('vehicles'); }} />
                  </div>
                );
              case 'finances':
                return (
                  <Tile key="finances" onClick={() => setView('financial')}>
                    <FinancialWidget bills={bills.items} />
                  </Tile>
                );
              case 'cameras':
                return (
                  <div key="cameras">
                    <CameraWidget onClick={() => {}} />
                  </div>
                );
              default:
                return null;
            }
          })}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1.2fr',
          gridTemplateRows: 'minmax(180px, auto) minmax(90px, auto) minmax(90px, auto) minmax(240px, auto)',
          gap: '14px',
        }}>
          {/* Col 1 Row 1: Weather */}
          <Tile onClick={() => setView('weather')} style={{ gridColumn: '1', gridRow: '1' }}>
            <WeatherWidget />
          </Tile>

          {/* Col 2 Row 1: Calendar */}
          <Tile onClick={() => setView('calendar')} style={{ gridColumn: '2', gridRow: '1' }}>
            <CalendarWidget events={multiData.events} />
          </Tile>

          {/* Col 3 Rows 1-2: To-do */}
          <Tile onClick={() => setView('todo')} style={{ gridColumn: '3', gridRow: '1 / 3' }}>
            <TodoWidget todosByList={multiData.todosByList} primaryMember={primaryMember} onToggle={handleTaskToggle} onDelete={handleTaskDelete} />
          </Tile>

          {/* Col 4 Rows 1-4: Grocery */}
          <div style={{ gridColumn: '4', gridRow: '1 / 5' }}>
            <div onClick={() => setView('grocery')} style={{ cursor: 'pointer', height: '100%' }}>
              <GroceryWidget items={groceries.items}
                onToggle={id => groceries.updateItem(id, { done: !groceries.items.find(g => g.id === id).done })}
                onClearDone={() => groceries.clearWhere(i => i.done)} />
            </div>
          </div>

          {/* Cols 1-2 Rows 2-3: Home Status */}
          <Tile onClick={() => setView('home')} style={{ gridColumn: '1 / 3', gridRow: '2 / 4' }}>
            <HomeStatusWidget wide />
          </Tile>

          {/* Col 3 Rows 3-4: Vehicles */}
          <div style={{ gridColumn: '3', gridRow: '3 / 5' }}>
            <VehicleWidget onSelectVehicle={id => { setActiveVehicleId(id); setView('vehicles'); }} />
          </div>

          {/* Col 1 Row 4: Cameras */}
          <div style={{ gridColumn: '1', gridRow: '4' }}>
            <CameraWidget onClick={() => {}} />
          </div>

          {/* Col 2 Row 4: Finances */}
          <Tile onClick={() => setView('financial')} style={{ gridColumn: '2', gridRow: '4' }}>
            <FinancialWidget bills={bills.items} />
          </Tile>
        </div>
      )}

      <QuickActionFAB onAction={type => {
        if (type === 'fillup') { setShowFillup(true); return; }
        setModal(type);
      }} />
      {modal && (
        <QuickAddModal
          type={modal}
          onClose={() => setModal(null)}
          onAdd={handleQuickAdd}
          primaryMember={primaryMember}
          householdTokens={householdTokens || {}}
        />
      )}
      {showFillup && (
        <LogFillupModal
          vehicles={seedVehicles}
          onClose={() => setShowFillup(false)}
          onSave={(data) => { console.log('Fillup logged from FAB:', data); setShowFillup(false); }}
        />
      )}
    </div>
  );
}

// ── Tabbed household settings (Accounts + Notifications + Layout) ─────
function HouseholdSettingsView({ householdTokens, linkMember, unlinkMember, linkingMember, authError, onClose, tilePrefs, tilePrefsLoading, toggleTile, reorderTile, moveTile }) {
  const [tab, setTab] = React.useState('accounts');

  const tabs = [
    { id: 'accounts',      label: '👤 Accounts'      },
    { id: 'notifications', label: '🔔 Notifications'  },
    { id: 'layout',        label: '⚙️ Layout'          },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-base)', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '0 28px', height: '60px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '14px', fontWeight: '500', fontFamily: 'var(--font-body)' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Dashboard
        </button>
        <span style={{ color: 'var(--border-strong)', fontSize: '18px' }}>|</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '600' }}>Settings</span>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', padding: '16px 28px 0', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 20px', borderRadius: '8px 8px 0 0', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: '600',
            border: '1px solid var(--border)', borderBottom: tab === t.id ? '1px solid var(--bg-card)' : '1px solid var(--border)',
            background: tab === t.id ? 'var(--bg-base)' : 'var(--bg-card)',
            color: tab === t.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
            marginBottom: tab === t.id ? '-1px' : '0',
            transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {tab === 'accounts' && (
            <HouseholdSetup
              householdTokens={householdTokens}
              linkMember={linkMember}
              unlinkMember={unlinkMember}
              linkingMember={linkingMember}
              error={authError}
              onClose={onClose}
            />
          )}
          {tab === 'notifications' && (
            <NotificationSettings householdTokens={householdTokens} />
          )}
          {tab === 'layout' && (
            <LayoutSettings
              prefs={tilePrefs}
              loading={tilePrefsLoading}
              toggleTile={toggleTile}
              reorderTile={reorderTile}
              moveTile={moveTile}
            />
          )}
        </div>
      </div>
    </div>
  );
}
