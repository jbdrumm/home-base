import React, { useState, useEffect } from 'react';
import { requestNotificationPermission } from '../lib/firebase';

// ── Install Prompt ────────────────────────────────────────────
// Shows "Add to Home Screen" banner on Android Chrome.
// iOS shows a manual install tip (Safari doesn't support beforeinstallprompt).

export default function PWAPrompt() {
  const [installPrompt, setInstallPrompt]   = useState(null);
  const [showBanner, setShowBanner]         = useState(false);
  const [notifState, setNotifState]         = useState('idle'); // idle | asking | granted | denied
  const [isIOS, setIsIOS]                   = useState(false);
  const [isInstalled, setIsInstalled]       = useState(false);

  useEffect(() => {
    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Detect if already installed (standalone mode)
    const installed = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    setIsInstalled(installed);

    // If installed, check notification permission
    if (installed && 'Notification' in window) {
      setNotifState(Notification.permission === 'granted' ? 'granted' : 'idle');
    }

    // Listen for Chrome's install prompt
    function onBeforeInstall(e) {
      e.preventDefault();
      setInstallPrompt(e);
      // Only show if not dismissed before
      if (!localStorage.getItem('hb_install_dismissed')) {
        setShowBanner(true);
      }
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setInstallPrompt(null);
    }
  }

  function handleDismiss() {
    setShowBanner(false);
    localStorage.setItem('hb_install_dismissed', '1');
  }

  async function handleEnableNotifications() {
    setNotifState('asking');
    const token = await requestNotificationPermission();
    if (token || Notification.permission === 'granted') {
      setNotifState('granted');
      // Store FCM token in localStorage for now; Sprint X will save to Supabase
      if (token) localStorage.setItem('hb_fcm_token', token);
    } else {
      setNotifState('denied');
    }
  }

  // Nothing to show
  if (isInstalled && notifState === 'granted') return null;
  if (!showBanner && !isIOS && !isInstalled) return null;

  // Notification prompt for installed app
  if (isInstalled && notifState !== 'granted') {
    return (
      <div style={{
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '14px', padding: '14px 18px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        display: 'flex', alignItems: 'center', gap: '14px',
        zIndex: 200, maxWidth: '420px', width: 'calc(100% - 40px)',
        animation: 'slideUp 0.3s ease',
      }}>
        <span style={{ fontSize: '28px' }}>🔔</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Enable notifications
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Get alerts for bills due, packages, and overdue tasks
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button className="btn btn-ghost" style={{ fontSize: '12px', padding: '6px 12px' }}
            onClick={() => setNotifState('denied')}>
            Not now
          </button>
          <button className="btn btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }}
            onClick={handleEnableNotifications} disabled={notifState === 'asking'}>
            {notifState === 'asking' ? '...' : 'Enable'}
          </button>
        </div>
      </div>
    );
  }

  // iOS install instructions
  if (isIOS && !isInstalled && !localStorage.getItem('hb_install_dismissed')) {
    return (
      <div style={{
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '14px', padding: '16px 18px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        zIndex: 200, maxWidth: '340px', width: 'calc(100% - 40px)',
        animation: 'slideUp 0.3s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
            📲 Install Home Base
          </div>
          <button onClick={handleDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '18px', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Tap <strong>Share</strong> <span style={{ fontSize: '16px' }}>⎙</span> then{' '}
          <strong>Add to Home Screen</strong> to install Home Base as an app.
        </div>
        {/* Arrow pointing to Safari share button */}
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '20px' }}>↓</div>
      </div>
    );
  }

  // Android Chrome install banner
  if (showBanner && installPrompt) {
    return (
      <div style={{
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '14px', padding: '14px 18px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        display: 'flex', alignItems: 'center', gap: '14px',
        zIndex: 200, maxWidth: '420px', width: 'calc(100% - 40px)',
        animation: 'slideUp 0.3s ease',
      }}>
        <img src="/icons/icon-72x72.png" alt="Home Base" style={{ width: '44px', height: '44px', borderRadius: '10px' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Install Home Base
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Add to home screen for quick access
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button className="btn btn-ghost" style={{ fontSize: '12px', padding: '6px 12px' }}
            onClick={handleDismiss}>
            Not now
          </button>
          <button className="btn btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }}
            onClick={handleInstall}>
            Install
          </button>
        </div>
      </div>
    );
  }

  return null;
}
