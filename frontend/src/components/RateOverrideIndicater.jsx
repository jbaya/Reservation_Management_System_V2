// components/RateOverrideIndicater.jsx
import { useState } from 'react';

export default function RateOverrideIndicator({ isOverride, originalRate, currentRate, overriddenBy, overriddenAt, source, label }) {
  const [show, setShow] = useState(false);

  if (!isOverride && !label) return null;

  // Auto-populated (agent rate, no override yet)
  if (!isOverride && label) {
    return (
      <span style={{
        background: '#e8f5e9', color: '#1e8449', fontSize: '0.6rem',
        fontWeight: 700, padding: '1px 6px', borderRadius: 4,
        letterSpacing: '0.03em', whiteSpace: 'nowrap',
      }}>
        ✓ {label}
      </span>
    );
  }

  // Manual override badge with tooltip
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{
          background: '#f39c12', color: '#fff', fontSize: '0.6rem',
          fontWeight: 800, padding: '1px 6px', borderRadius: 4,
          cursor: 'help', letterSpacing: '0.04em', whiteSpace: 'nowrap',
        }}
      >
        ✏️ MANUAL OVERRIDE
      </span>
      {show && (
        <div style={{
          position: 'absolute', bottom: '120%', left: 0, zIndex: 99999,
          background: '#1a1a2e', color: '#fff', borderRadius: 6,
          padding: '10px 14px', fontSize: '0.68rem', minWidth: 220,
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)', whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: '#f39c12' }}>Rate Manually Overridden</div>
          <div>Original: <strong>₹{originalRate ?? '—'}</strong>/night</div>
          <div>Current: <strong>₹{currentRate}</strong>/night</div>
          {source && <div style={{ color: '#93c5fd', marginTop: 4 }}>Source: {source}</div>}
          {overriddenBy && <div style={{ color: '#aaa', marginTop: 4 }}>By: {overriddenBy}</div>}
          {overriddenAt && <div style={{ color: '#aaa' }}>At: {new Date(overriddenAt).toLocaleString('en-IN')}</div>}
          <div style={{ marginTop: 6, color: '#f87171', fontSize: '0.6rem' }}>⚠️ Master rates unchanged</div>
        </div>
      )}
    </div>
  );
}