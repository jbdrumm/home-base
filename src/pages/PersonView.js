import React from 'react';
import FullScreenView from '../components/FullScreenView';

export default function PersonView({ name, onBack }) {
  return (
    <FullScreenView title={`${name}'s Page`} onBack={onBack}>
      <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', paddingTop: '60px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
          {name}'s Page
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
          Coming soon — share what you'd like to see here and we'll build it out.
        </div>
      </div>
    </FullScreenView>
  );
}
