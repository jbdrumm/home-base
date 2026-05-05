import React from 'react';

export default function SignInPrompt({ onSignIn, error }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-base)',
      padding: '24px',
    }}>
      <div className="card" style={{
        padding: '48px 40px', maxWidth: '420px', width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '28px',
          fontWeight: '700', color: 'var(--accent)', marginBottom: '8px',
        }}>Home Base</div>
        <div style={{
          fontSize: '14px', color: 'var(--text-secondary)',
          marginBottom: '32px', lineHeight: 1.6,
        }}>
          Sign in with your Google account to connect your calendar, tasks, and family data.
        </div>

        {error && (
          <div style={{
            background: 'var(--color-danger-bg)', color: 'var(--color-danger)',
            borderRadius: '8px', padding: '10px 14px', fontSize: '13px',
            marginBottom: '16px',
          }}>{error}</div>
        )}

        <button onClick={onSignIn} style={{
          width: '100%', padding: '13px 20px',
          background: '#4285F4', color: 'white',
          border: 'none', borderRadius: '10px', cursor: 'pointer',
          fontSize: '15px', fontWeight: '600',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
          fontFamily: 'var(--font-body)',
          boxShadow: '0 2px 8px rgba(66,133,244,0.35)',
          transition: 'filter 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
          onMouseLeave={e => e.currentTarget.style.filter = 'none'}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.5-2.9-11.3-7.1l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.2C40.5 35.5 44 30.1 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Sign in with Google
        </button>

        <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
          Home Base only accesses your Calendar and Tasks.<br/>
          Your data never leaves your home network.
        </div>
      </div>
    </div>
  );
}
