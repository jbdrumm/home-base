// ─────────────────────────────────────────────────────────────
//  LayoutSettings — tile visibility + order per member
//
//  Mobile: fully functional — toggle tiles on/off, drag to
//          reorder, up/down arrows as fallback
//  Desktop: settings rendered but greyed out with Coming Soon
// ─────────────────────────────────────────────────────────────
import React, { useRef, useState } from 'react';
import { TILE_DEFINITIONS } from '../hooks/useTilePreferences';

export default function LayoutSettings({ prefs, loading, toggleTile, reorderTile, moveTile }) {
  const isMobile = window.innerWidth < 768;

  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
        Loading layout preferences…
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Desktop coming soon overlay */}
      {!isMobile && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: 'rgba(245,245,247,0.85)',
          backdropFilter: 'blur(4px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          borderRadius: '12px',
          gap: '10px',
        }}>
          <div style={{ fontSize: '32px' }}>🖥</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '20px',
            fontWeight: '700', color: 'var(--text-primary)',
            letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>Coming Soon</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '260px', lineHeight: 1.5 }}>
            Desktop layout customization is in development. Configure your layout on mobile in the meantime.
          </div>
        </div>
      )}

      {/* Content — always rendered, greyed on desktop */}
      <div style={{ opacity: isMobile ? 1 : 0.3, pointerEvents: isMobile ? 'auto' : 'none' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
          Choose which tiles appear on your dashboard and drag to set their order.
          Changes are saved automatically and sync across your devices.
        </p>

        <TileList
          prefs={prefs}
          toggleTile={toggleTile}
          reorderTile={reorderTile}
          moveTile={moveTile}
        />
      </div>
    </div>
  );
}

// ── Drag-and-drop tile list ───────────────────────────────────
function TileList({ prefs, toggleTile, reorderTile, moveTile }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOver,  setDragOver]  = useState(null);
  const dragNode = useRef(null);

  const tileMap = Object.fromEntries(TILE_DEFINITIONS.map(t => [t.id, t]));

  function handleDragStart(e, index) {
    dragNode.current = e.currentTarget;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Slight delay so drag ghost renders before we apply dragging style
    setTimeout(() => setDragIndex(index), 0);
  }

  function handleDragEnter(index) {
    if (index === dragIndex) return;
    setDragOver(index);
  }

  function handleDragEnd() {
    if (dragIndex !== null && dragOver !== null && dragIndex !== dragOver) {
      reorderTile(dragIndex, dragOver);
    }
    setDragIndex(null);
    setDragOver(null);
    dragNode.current = null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {prefs.map((pref, index) => {
        const def = tileMap[pref.tile_id];
        if (!def) return null;
        const isDragging = dragIndex === index;
        const isOver     = dragOver === index;

        return (
          <div
            key={pref.tile_id}
            draggable
            onDragStart={e => handleDragStart(e, index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragOver={e => e.preventDefault()}
            onDragEnd={handleDragEnd}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 14px',
              borderRadius: '10px',
              border: isOver
                ? '2px solid var(--accent)'
                : '1px solid var(--border)',
              background: isDragging
                ? 'var(--accent-soft)'
                : 'var(--bg-card)',
              opacity: isDragging ? 0.5 : 1,
              cursor: 'grab',
              transition: 'border-color 0.15s, background 0.15s',
              userSelect: 'none',
            }}
          >
            {/* Drag handle */}
            <div style={{ color: 'var(--text-tertiary)', flexShrink: 0, cursor: 'grab', lineHeight: 1 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="4" cy="3"  r="1.5" fill="currentColor"/>
                <circle cx="10" cy="3"  r="1.5" fill="currentColor"/>
                <circle cx="4" cy="7"  r="1.5" fill="currentColor"/>
                <circle cx="10" cy="7"  r="1.5" fill="currentColor"/>
                <circle cx="4" cy="11" r="1.5" fill="currentColor"/>
                <circle cx="10" cy="11" r="1.5" fill="currentColor"/>
              </svg>
            </div>

            {/* Emoji + label */}
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{def.emoji}</span>
            <span style={{
              flex: 1, fontSize: '14px', fontWeight: '500',
              color: pref.enabled ? 'var(--text-primary)' : 'var(--text-tertiary)',
            }}>{def.label}</span>

            {/* Up / Down arrows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
              <button
                onClick={() => moveTile(pref.tile_id, 'up')}
                disabled={index === 0}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: '4px', width: '22px', height: '22px',
                  cursor: index === 0 ? 'default' : 'pointer',
                  opacity: index === 0 ? 0.3 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  transition: 'opacity 0.15s',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 7l3-4 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                onClick={() => moveTile(pref.tile_id, 'down')}
                disabled={index === prefs.length - 1}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: '4px', width: '22px', height: '22px',
                  cursor: index === prefs.length - 1 ? 'default' : 'pointer',
                  opacity: index === prefs.length - 1 ? 0.3 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  transition: 'opacity 0.15s',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 3l3 4 3-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Toggle */}
            <div
              onClick={() => toggleTile(pref.tile_id)}
              style={{
                width: '44px', height: '26px', borderRadius: '13px',
                background: pref.enabled ? 'var(--accent)' : 'var(--border-strong)',
                position: 'relative', cursor: 'pointer', flexShrink: 0,
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute',
                top: '3px',
                left: pref.enabled ? '21px' : '3px',
                width: '20px', height: '20px',
                borderRadius: '50%', background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'left 0.2s',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
