import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval,
         startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday,
         addMonths, subMonths } from 'date-fns';
import FullScreenView from '../components/FullScreenView';

const ownerColors = {
  family:  '#2563EB',
  jacob:   '#059669',
  katelin: '#9333EA',
  wife:    '#9333EA',
};

function getEventsForDay(events, day) {
  return events.filter(e => {
    const raw = e.rawDate;
    if (!raw) return false;
    let eventDate;
    if (raw.length === 10) {
      const [y, m, d] = raw.split('-').map(Number);
      eventDate = new Date(y, m - 1, d);
    } else {
      eventDate = new Date(raw);
    }
    return isSameDay(day, eventDate);
  });
}

export default function CalendarFullView({ events = [], onBack }) {
  const [current,  setCurrent]  = useState(new Date());
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const monthStart = startOfMonth(current);
  const monthEnd   = endOfMonth(current);
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd     = endOfWeek(monthEnd,     { weekStartsOn: 0 });
  const days       = eachDayOfInterval({ start: calStart, end: calEnd });

  const isCurrentMonth = isSameMonth(new Date(), current);

  function jumpToToday() {
    setCurrent(new Date());
    setExpanded(null);
    setSelected(null);
  }

  function handleEventClick(e, event) {
    e.stopPropagation();
    setSelected(selected?.id === event.id ? null : event);
    setExpanded(null);
  }

  function handleDayClick(day) {
    const dayEvents = getEventsForDay(events, day);
    if (dayEvents.length === 0) { setExpanded(null); setSelected(null); return; }
    setExpanded(expanded && isSameDay(expanded, day) ? null : day);
    setSelected(null);
  }

  const expandedEvents = expanded ? getEventsForDay(events, expanded) : [];

  const topbarActions = !isCurrentMonth ? (
    <button onClick={jumpToToday} style={navBtn}>Today</button>
  ) : null;

  return (
    <FullScreenView title="Calendar" onBack={onBack} actions={topbarActions}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <button onClick={() => setCurrent(subMonths(current, 1))} style={navBtn}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {format(current, 'MMMM yyyy')}
          </span>
          <button onClick={() => setCurrent(addMonths(current, 1))} style={navBtn}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Day of week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '2px' }}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} style={{
              textAlign: 'center', fontSize: '10px', fontWeight: '600',
              color: 'var(--text-tertiary)', letterSpacing: '0.05em', padding: '4px 0',
            }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid — tighter cells, more events visible */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {days.map(day => {
            const inMonth   = isSameMonth(day, current);
            const todayDay  = isToday(day);
            const dayEvents = getEventsForDay(events, day);
            const isExp     = expanded && isSameDay(day, expanded);
            // Show up to 4 pills; "+N more" if overflow
            const maxPills  = 3;
            const visible   = dayEvents.slice(0, maxPills);
            const overflow  = dayEvents.length - maxPills;

            return (
              <div key={day.toString()}
                onClick={() => handleDayClick(day)}
                style={{
                  minHeight: '62px',
                  borderRadius: '8px',
                  padding: '4px 3px 3px',
                  background: isExp ? 'var(--accent-soft)' : 'var(--bg-card)',
                  border: todayDay ? '2px solid var(--accent)' : '1px solid var(--border)',
                  opacity: inMonth ? 1 : 0.3,
                  cursor: dayEvents.length > 0 ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                  display: 'flex', flexDirection: 'column', gap: '1px',
                  overflow: 'hidden',
                }}
              >
                {/* Day number */}
                <div style={{ flexShrink: 0, marginBottom: '2px', paddingLeft: '1px' }}>
                  {todayDay ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: 'var(--accent)', color: 'white',
                      fontSize: '11px', fontWeight: '700',
                    }}>{format(day, 'd')}</span>
                  ) : (
                    <span style={{
                      fontSize: '11px', fontWeight: '400',
                      color: inMonth ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    }}>{format(day, 'd')}</span>
                  )}
                </div>

                {/* Event pills — compact, max 4 */}
                {visible.map(event => (
                  <div key={event.id}
                    onClick={e => handleEventClick(e, event)}
                    style={{
                      fontSize: '9px',
                      fontWeight: '500',
                      lineHeight: '13px',
                      padding: '0 3px',
                      borderRadius: '3px',
                      background: ownerColors[event.owner] || 'var(--accent)',
                      color: 'white',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      flexShrink: 0,
                      outline: selected?.id === event.id ? '2px solid rgba(0,0,0,0.25)' : 'none',
                      outlineOffset: '1px',
                    }}
                    title={`${event.title} · ${event.time}`}
                  >
                    {event.title}
                  </div>
                ))}
                {overflow > 0 && (
                  <div style={{
                    fontSize: '9px', color: 'var(--accent)',
                    fontWeight: '600', paddingLeft: '2px',
                    flexShrink: 0, cursor: 'pointer',
                    lineHeight: '13px',
                  }}>
                    +{overflow} more
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Day detail panel */}
        {expandedEvents.length > 0 && expanded && (
          <div style={{
            marginTop: '16px', padding: '16px 20px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '14px', animation: 'slideUp 0.2s ease',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '600',
              color: 'var(--text-primary)', marginBottom: '12px',
            }}>
              {isToday(expanded) ? 'Today' : format(expanded, 'EEEE, MMMM d')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {expandedEvents.map(event => (
                <div key={event.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '12px 14px', background: 'var(--bg-base)',
                  borderRadius: '10px', border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: '3px', alignSelf: 'stretch', minHeight: '36px',
                    borderRadius: '3px', flexShrink: 0,
                    background: ownerColors[event.owner] || 'var(--accent)',
                  }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{event.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{event.time}</div>
                    {event.location && (
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        📍 {event.location}
                      </div>
                    )}
                    {event.details && (
                      <div style={{
                        marginTop: '6px', padding: '8px 12px',
                        background: 'var(--bg-card)', borderRadius: '7px',
                        fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5,
                      }}>{event.details}</div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
                    background: (ownerColors[event.owner] || 'var(--accent)') + '22',
                    color: ownerColors[event.owner] || 'var(--accent)', fontWeight: '600',
                    flexShrink: 0,
                  }}>{event.owner}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Single event detail */}
        {selected && !expanded && (
          <div style={{
            marginTop: '16px', padding: '16px 20px',
            background: 'var(--bg-card)', border: `2px solid ${ownerColors[selected.owner] || 'var(--accent)'}`,
            borderRadius: '14px', animation: 'slideUp 0.2s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{selected.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{selected.time}</div>
                {selected.location && (
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>📍 {selected.location}</div>
                )}
              </div>
              <button onClick={() => setSelected(null)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-tertiary)', padding: '4px',
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            {selected.details ? (
              <div style={{
                marginTop: '10px', padding: '10px 14px',
                background: 'var(--bg-base)', borderRadius: '8px',
                fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6,
              }}>{selected.details}</div>
            ) : (
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                No additional details
              </div>
            )}
          </div>
        )}

        {events.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            color: 'var(--text-tertiary)', fontSize: '14px',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📅</div>
            No events loaded — make sure your Google accounts are connected.
          </div>
        )}

      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </FullScreenView>
  );
}

const navBtn = {
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: '8px', padding: '7px 14px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: 'var(--text-secondary)',
  fontSize: '13px', fontWeight: '500', fontFamily: 'var(--font-body)',
  gap: '4px',
};
