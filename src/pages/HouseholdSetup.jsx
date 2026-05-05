import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import styles from './Login.module.css';
import formStyles from './HouseholdSetup.module.css';

export default function HouseholdSetup() {
  const { createHousehold, joinHousehold } = useAuth();
  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [name, setName] = useState('');
  const [joinId, setJoinId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await createHousehold(name.trim());
    } catch (err) {
      setError('Failed to create household. Try again.');
    }
    setLoading(false);
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!joinId.trim()) return;
    setLoading(true);
    setError('');
    try {
      await joinHousehold(joinId.trim());
    } catch (err) {
      setError('Household not found. Check the ID and try again.');
    }
    setLoading(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>Home Base</div>
        <p className={styles.tagline}>Set up your household</p>

        <div className={formStyles.tabs}>
          <button
            className={`${formStyles.tab} ${mode === 'create' ? formStyles.tabActive : ''}`}
            onClick={() => setMode('create')}
          >
            Create new
          </button>
          <button
            className={`${formStyles.tab} ${mode === 'join' ? formStyles.tabActive : ''}`}
            onClick={() => setMode('join')}
          >
            Join existing
          </button>
        </div>

        {mode === 'create' ? (
          <form onSubmit={handleCreate} className={formStyles.form}>
            <input
              type="text"
              placeholder="Household name (e.g. The Smiths)"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <button type="submit" className={formStyles.submitBtn} disabled={loading || !name.trim()}>
              {loading ? 'Creating...' : 'Create household'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className={formStyles.form}>
            <input
              type="text"
              placeholder="Paste household ID from your partner's app"
              value={joinId}
              onChange={e => setJoinId(e.target.value)}
            />
            <p className={formStyles.hint}>
              Your partner can find the household ID in Settings.
            </p>
            <button type="submit" className={formStyles.submitBtn} disabled={loading || !joinId.trim()}>
              {loading ? 'Joining...' : 'Join household'}
            </button>
          </form>
        )}

        {error && <p className={formStyles.error}>{error}</p>}
      </div>
    </div>
  );
}
