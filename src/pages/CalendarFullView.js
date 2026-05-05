import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval,
         startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday,
         addMonths, subMonths } from 'date-fns';
import FullScreenView from '../components/FullScreenView';

const ownerColors = {
  family: '#2563EB',
  jacob:  '#059669',
  wife:   '#9333EA',
};

function getEventsForDay(events, day) {
  return events.filter(e => {
    if (e.date === 'today')    return isSameDay(day, new Date());
    if (e.date === 'tomorrow') return isSameDay(day, new Date(Date.now() + 86400000));
    return false;
  });
}

export default function CalendarFullView({ events, onBack }) {
  const [current,  setCurrent]  = useState(new Date());
  const [selected, setSelected] = useState(null); // selected event object
  const [expanded, setExpanded] = useState(null); // day date object for detail panel

  const monthStart = startOfMonth(current);
  const monthEnd   = endOfMonth(current);
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd     = endOfWeek(monthEnd,     { weekStartsOn: 0 });
  const days       = eachDayOfInterval({ start: calStart, end: calEnd });

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

  return (
    <FullScreenView title="Calendar" onBack={onBack}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button onClick={() => setCurrent(subMonths(current, 1))} style={navBtn}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {format(current, 'MMMM yyyy')}
          </span>
          <button onClick={() => setCurrent(addMonths(current, 1))} style={navBtn}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Day of week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '3px' }}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} style={{
              textAlign: 'center', fontSize: '11px', fontWeight: '600',
              color: 'var(--text-tertiary)', letterSpacing: '0.06em', padding: '6px 0',
            }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
          {days.map(day => {
            const inMonth   = isSameMonth(day, current);
            const todayDay  = isToday(day);
            const dayEvents = getEventsForDay(events, day);
            const isExp     = expanded && isSameDay(day, expanded);

            return (
              <div key={day.toString()}
                onClick={() => handleDayClick(day)}
                style={{
                  minHeight: '90px',
                  borderRadius: '10px',
                  padding: '8px 6px 6px',
                  background: isExp ? 'var(--accent-soft)' : todayDay ? 'var(--accent-soft)' : 'var(--bg-card)',
                  border: todayDay ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  opacity: inMonth ? 1 : 0.35,
                  cursor: dayEvents.length > 0 ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', gap: '3px',
                }}
              >
                {/* Day number */}
                <div style={{
                  fontSize: '13px',
                  fontWeight: todayDay ? '700' : '400',
                  color: todayDay ? 'var(--accent)' : 'var(--text-primary)',
                  marginBottom: '4px',
                }}>{format(day, 'd')}</div>

                {/* Events inside cell */}
                {dayEvents.slice(0, 3).map(event => (
                  <div key={event.id}
                    onClick={e => handleEventClick(e, event)}
                    style={{
                      fontSize: '10px', fontWeight: '500',
                      padding: '2px 5px', borderRadius: '4px',
                      background: ownerColors[event.owner] || 'var(--accent)',
                      color: 'white',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      cursor: 'pointer',
                      outline: selected?.id === event.id ? '2px solid var(--accent)' : 'none',
                      outlineOffset: '1px',
                    }}
                    title={event.title}
                  >
                    {event.time} {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', paddingLeft: '4px' }}>
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Event detail panel — expands below grid when day is clicked */}
        {expandedEvents.length > 0 && expanded && (
          <div style={{
            marginTop: '20px', padding: '20px 24px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '14px', animation: 'slideUp 0.2s ease',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '600',
              color: 'var(--text-primary)', marginBottom: '14px',
            }}>
              {isToday(expanded) ? 'Today' : format(expanded, 'EEEE, MMMM d')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {expandedEvents.map(event => (
                <div key={event.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: '4px', alignSelf: 'stretch', minHeight: '40px',
                    borderRadius: '4px', flexShrink: 0,
                    background: ownerColors[event.owner] || 'var(--accent)',
                  }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)' }}>{event.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{event.time}</div>
                    {event.details && (
                      <div style={{
                        marginTop: '8px', padding: '10px 14px',
                        background: 'var(--bg-base)', borderRadius: '8px',
                        fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6,
                      }}>{event.details}</div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
                    background: 'var(--accent-soft)', color: 'var(--accent-text)', fontWeight: '500',
                  }}>{event.owner}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Single event detail panel — when clicking directly on an event pill */}
        {selected && !expanded && (
          <div style={{
            marginTop: '20px', padding: '20px 24px',
            background: 'var(--bg-card)', border: `2px solid ${ownerColors[selected.owner] || 'var(--accent)'}`,
            borderRadius: '14px', animation: 'slideUp 0.2s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)' }}>{selected.title}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '3px' }}>{selected.time}</div>
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
                marginTop: '12px', padding: '12px 16px',
                background: 'var(--bg-base)', borderRadius: '8px',
                fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7,
              }}>{selected.details}</div>
            ) : (
              <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                No additional details
              </div>
            )}
          </div>
        )}

      </div>
    </FullScreenView>
  );
}

const navBtn = {
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: '8px', width: '36px', height: '36px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: 'var(--text-secondary)',
};
