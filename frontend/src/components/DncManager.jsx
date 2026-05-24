import React, { useState } from 'react';

function DncManager({
  open,
  booking,
  targetRoom,
  onApprove,
  onCancel
}) {
  const [adminName, setAdminName] = useState('');
  const [reason, setReason] = useState('');

  if (!open || !booking) return null;

  const handleApprove = () => {
    if (!adminName.trim()) {
      alert('Admin name is required');
      return;
    }

    if (!reason.trim()) {
      alert('Override reason is required');
      return;
    }

    onApprove({
      adminName: adminName.trim(),
      reason: reason.trim(),
      timestamp: new Date().toISOString(),
      previousRoom: booking.roomName,
      newRoom: targetRoom?.name || ''
    });

    setAdminName('');
    setReason('');
  };

  const handleCancel = () => {
    setAdminName('');
    setReason('');
    onCancel();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999
      }}
    >
      <div
        style={{
          width: 440,
          background: '#fff',
          borderRadius: 10,
          padding: 24,
          boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
          fontFamily: 'inherit'
        }}
      >
        <h3
          style={{
            margin: '0 0 12px',
            color: '#c0392b',
            fontSize: '1.05rem'
          }}
        >
          ⛔ Admin Override Required
        </h3>

        <p
          style={{
            fontSize: '0.85rem',
            color: '#555',
            lineHeight: 1.5,
            marginBottom: 18
          }}
        >
          This room is marked as DNC (Do Not Change).
          Room shifting is restricted and requires admin approval.
        </p>

        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: 'block',
              fontWeight: 700,
              marginBottom: 6,
              fontSize: '0.82rem'
            }}
          >
            Admin Name *
          </label>

          <input
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            placeholder="Enter admin name"
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 6,
              border: '1px solid #ccc',
              boxSizing: 'border-box',
              fontSize: '0.82rem'
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontWeight: 700,
              marginBottom: 6,
              fontSize: '0.82rem'
            }}
          >
            Reason for Override *
          </label>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for overriding DNC restriction"
            rows={4}
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 6,
              border: '1px solid #ccc',
              boxSizing: 'border-box',
              fontSize: '0.82rem',
              resize: 'none'
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10
          }}
        >
          <button
            onClick={handleCancel}
            style={{
              padding: '9px 16px',
              borderRadius: 6,
              border: '1px solid #ccc',
              background: '#f5f5f5',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleApprove}
            style={{
              padding: '9px 16px',
              borderRadius: 6,
              border: 'none',
              background: '#c0392b',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            Approve Override
          </button>
        </div>
      </div>
    </div>
  );
}

export default DncManager;