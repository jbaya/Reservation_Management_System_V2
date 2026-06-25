import { useState } from 'react';
import { resolveRate, calcTotals, canUserOverrideRates, applyRateOverride, resetRateOverride, BOOKING_SOURCES } from '../utils/Rateutil';
import RateOverrideIndicator from '../components/RateOverrideIndicater';
import { copyToClipboard, downloadCSV, printTable } from '../utils/tableExport';

// ── Status helpers ────────────────────────────────────────────────────────────
const statusColor = (s) => {
  const map = { confirmed: '#1e8449', tentative: '#d4ac0d', 'checked-in': '#1565c0', blocked: '#7b241c' };
  return map[s] || '#666';
};

// ── Billing Modal ─────────────────────────────────────────────────────────────
function BillingModal({ booking, rooms, onClose, onSaveBill, currentUser }) {
  const formatDate = (dateStr) => {
  if (!dateStr) return '—';

  const [year, month, day] = dateStr.split('-');

  const months = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec'
  ];

  return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
};
  const loggedUser = typeof currentUser === 'object' ? currentUser : { name: currentUser || 'Admin', role: 'Admin' };
  const canOverride = canUserOverrideRates(loggedUser);

  const nights = booking.arrival && booking.departure
    ? Math.max(1, Math.round((new Date(booking.departure) - new Date(booking.arrival)) / 86400000))
    : 1;

  // Support both multi-room and single-room bookings
  const isMultiRoom = booking.isMultiRoom && booking.rooms?.length;

  const initRooms = isMultiRoom
    ? booking.rooms.map(r => ({ ...r, billingRate: r.rate || 0, billingExtraRate: r.extraPersonRate || 0, isBillingOverridden: false }))
    : [{
        id: 'single',
        roomName: booking.roomName,
        roomCategory: booking.category || rooms.find(r => r.name === booking.roomName)?.category || '',
        billingRate: parseFloat(booking.baseRate || 0),
        billingExtraRate: parseFloat(booking.extraPersonCharge || 0),
        extraPersons: Math.max(0, parseInt(booking.numGuests || 1) - 2),
        isBillingOverridden: false,
        originalBillingRate: null,
        auditTrail: booking.auditTrail || [],
      }];

  const [billRooms, setBillRooms] = useState(initRooms);
  const [advancePaid, setAdvancePaid] = useState(parseFloat(booking.paidAmount || 0));
  const [paymentMode, setPaymentMode] = useState(booking.paymentMode || '');
  const [notes, setNotes] = useState('');

  const gstRate = parseFloat(booking.baseRate || billRooms[0]?.billingRate || 0) > 7499 ? 12 : 5;

  // Live totals
  const roomSubtotal = billRooms.reduce((sum, r) => sum + (parseFloat(r.billingRate) || 0) * nights, 0);
  const extraSubtotal = billRooms.reduce((sum, r) => sum + (parseFloat(r.billingExtraRate) || 0) * (parseInt(r.extraPersons) || 0) * nights, 0);
  const subtotal = roomSubtotal + extraSubtotal;
  const gstAmount = subtotal * (gstRate / 100);
  const totalAmount = subtotal + gstAmount;
  const balance = Math.max(0, totalAmount - advancePaid);

  const updateBillRoom = (id, field, value) => {
    setBillRooms(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'billingRate' && !r.isBillingOverridden) {
        updated.isBillingOverridden = true;
        updated.originalBillingRate = r.billingRate;
        updated.auditTrail = [...(r.auditTrail || []), {
          action: 'BILLING_RATE_OVERRIDE',
          user: loggedUser.name,
          role: loggedUser.role,
          timestamp: new Date().toISOString(),
          previousRate: r.billingRate,
          newRate: value,
          details: `Billing rate for ${r.roomName} changed from ₹${r.billingRate} → ₹${value}`,
        }];
      }
      return updated;
    }));
  };

  const resetBillRoom = (id) => {
    setBillRooms(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        billingRate: r.originalBillingRate ?? r.billingRate,
        isBillingOverridden: false,
        originalBillingRate: null,
        auditTrail: [...(r.auditTrail || []), {
          action: 'BILLING_RATE_RESET',
          user: loggedUser.name,
          timestamp: new Date().toISOString(),
          details: `Billing rate reset to ₹${r.originalBillingRate}`,
        }],
      };
    }));
  };

  const inp = {
    padding: '7px 10px', borderRadius: 6, border: '1.5px solid #ddd',
    fontSize: '0.82rem', width: '100%', boxSizing: 'border-box',
    outline: 'none', background: '#fff', color: '#1a1a2e',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 680, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', fontFamily: 'inherit' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #1565c0)', padding: '16px 22px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>🧾 Generate Bill</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', marginTop: 2 }}>
              {booking.guestName} · {booking.roomName || `${booking.rooms?.length} Rooms`} · {nights} night{nights > 1 ? 's' : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>✕ Close</button>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Booking info strip */}
          <div style={{ background: '#f0f7ff', border: '1px solid #b3d1f5', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.78rem', color: '#1565c0' }}>
            <span>📅 {booking.arrival} → {booking.departure}</span>
            <span>📡 {booking.source}</span>
            {booking.bookingId && <span>🔖 {booking.bookingId}</span>}
            {booking.agentName && <span>🤝 {booking.agentName}</span>}
            {booking.source === BOOKING_SOURCES.OTA && (
              <span style={{ color: '#e67e22', fontWeight: 700 }}>⚠️ OTA — Rates externally managed</span>
            )}
          </div>

          {/* OTA notice */}
          {booking.source === BOOKING_SOURCES.OTA && (
            <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: '#7d5a00', fontWeight: 600 }}>
              🔒 OTA booking — Room rates are managed by {booking.otaPlatform || 'the OTA platform'}. Billing adjustments are limited.
            </div>
          )}

          {/* Room rate rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🛏️ Room Rates</div>
            {billRooms.map(r => (
              <div key={r.id} style={{ border: `1px solid ${r.isBillingOverridden ? '#f39c12' : '#e5e7eb'}`, borderRadius: 8, padding: 14, background: r.isBillingOverridden ? '#fffbea' : '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: '0.85rem', color: '#1a1a2e' }}>{r.roomName}</strong>
                    <span style={{ fontSize: '0.7rem', color: '#888' }}>{r.roomCategory}</span>
                    {r.isBillingOverridden && (
                      <RateOverrideIndicator
                        isOverride={true}
                        originalRate={r.originalBillingRate}
                        currentRate={r.billingRate}
                        overriddenBy={loggedUser.name}
                        source="Billing Override"
                      />
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#888' }}>× {nights} night{nights > 1 ? 's' : ''}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {/* Room Rate */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555' }}>Room Rate / Night (₹)</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <input
                        type="number" min="0"
                        value={r.billingRate}
                        onChange={e => canOverride && updateBillRoom(r.id, 'billingRate', e.target.value)}
                        readOnly={!canOverride || booking.source === BOOKING_SOURCES.OTA}
                        style={{
                          ...inp, flex: 1,
                          border: r.isBillingOverridden ? '1.5px solid #f39c12' : '1.5px solid #ddd',
                          background: (!canOverride || booking.source === BOOKING_SOURCES.OTA) ? '#f5f5f5' : '#fff',
                          cursor: (!canOverride || booking.source === BOOKING_SOURCES.OTA) ? 'not-allowed' : 'text',
                        }}
                      />
                      {r.isBillingOverridden && canOverride && (
                        <button onClick={() => resetBillRoom(r.id)} title="Reset rate"
                          style={{ padding: '4px 8px', border: '1px solid #e74c3c', borderRadius: 5, background: '#fff5f5', color: '#e74c3c', cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem' }}>
                          ↺
                        </button>
                      )}
                    </div>
                    {!canOverride && <div style={{ fontSize: '0.65rem', color: '#e67e22' }}>🔒 Admin/Manager only</div>}
                  </div>

                  {/* Extra Person Rate */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555' }}>Extra Person Rate / Night (₹)</label>
                    <input
                      type="number" min="0"
                      value={r.billingExtraRate}
                      onChange={e => canOverride && updateBillRoom(r.id, 'billingExtraRate', e.target.value)}
                      readOnly={!canOverride || booking.source === BOOKING_SOURCES.OTA}
                      style={{
                        ...inp,
                        background: (!canOverride || booking.source === BOOKING_SOURCES.OTA) ? '#f5f5f5' : '#fff',
                        cursor: (!canOverride || booking.source === BOOKING_SOURCES.OTA) ? 'not-allowed' : 'text',
                      }}
                    />
                  </div>
                </div>

                {/* Audit trail for this room */}
                {r.auditTrail?.filter(a => a.action === 'BILLING_RATE_OVERRIDE').length > 0 && (
                  <div style={{ marginTop: 8, background: '#fffbea', border: '1px solid #ffe082', borderRadius: 5, padding: '6px 10px', fontSize: '0.68rem', color: '#7d5a00' }}>
                    {r.auditTrail.filter(a => a.action === 'BILLING_RATE_OVERRIDE').map((a, i) => (
                      <div key={i}>✏️ {a.details} · By {a.user} · {new Date(a.timestamp).toLocaleString('en-IN')}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div style={{ background: '#f0f7ff', border: '1px solid #b3d1f5', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, color: '#1565c0', marginBottom: 10, fontSize: '0.85rem' }}>💰 Invoice Breakdown</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '5px 16px', fontSize: '0.82rem', color: '#444' }}>
              <span>Room charges ({nights} nights)</span>
              <span style={{ fontWeight: 600, textAlign: 'right' }}>₹{roomSubtotal.toLocaleString('en-IN')}</span>
              {extraSubtotal > 0 && <>
                <span>Extra person charges</span>
                <span style={{ fontWeight: 600, textAlign: 'right' }}>₹{extraSubtotal.toLocaleString('en-IN')}</span>
              </>}
              <span>GST ({gstRate}%)</span>
              <span style={{ fontWeight: 600, textAlign: 'right' }}>₹{gstAmount.toFixed(2)}</span>
              <span style={{ fontWeight: 700, color: '#1565c0', borderTop: '1px solid #b3d1f5', paddingTop: 6 }}>Invoice Total</span>
              <span style={{ fontWeight: 800, color: '#1565c0', borderTop: '1px solid #b3d1f5', paddingTop: 6, textAlign: 'right' }}>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555' }}>Advance Paid (₹)</label>
              <input type="number" min="0" value={advancePaid} onChange={e => setAdvancePaid(parseFloat(e.target.value) || 0)} style={inp} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555' }}>Payment Mode</label>
              <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} style={inp}>
                <option value="">-- Select --</option>
                {['cash', 'card', 'UPI', 'bank transfer', 'cheque'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Balance */}
          <div style={{ background: balance > 0 ? '#fff5f5' : '#f0fff4', border: `1.5px solid ${balance > 0 ? '#fcc' : '#9be9a8'}`, borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#555' }}>Balance Due</span>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: balance > 0 ? '#e74c3c' : '#27ae60' }}>₹{balance.toFixed(2)}</span>
          </div>

          {/* Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555' }}>Billing Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              style={{ ...inp, resize: 'none', fontFamily: 'inherit' }}
              placeholder="e.g. Complimentary upgrade applied, negotiated rate..." />
          </div>

          {/* Footer actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '9px 20px', border: '1px solid #ddd', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500 }}>Cancel</button>
            <button
              onClick={() => onSaveBill({ billRooms, totalAmount, advancePaid, balance, paymentMode, notes, gstRate, gstAmount })}
              style={{ padding: '9px 24px', border: 'none', borderRadius: 7, background: '#1e8449', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>
              ✅ Save Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ViewReservationPage ──────────────────────────────────────────────────
function ViewReservationPage({ bookings, rooms, categoryColors, currentUser, travelAgents = [], seasons = [], travelAgentRates = [], onUpdateBooking }) {
  const formatDate = (dateStr) => {
  if (!dateStr) return '—';

  const [year, month, day] = dateStr.split('-');

  const months = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec'
  ];

  return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
};
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [billingBooking, setBillingBooking] = useState(null);




  const loggedUser = typeof currentUser === 'object' ? currentUser : { name: currentUser || 'Admin', role: 'Admin' };

  const filtered = bookings.filter(b => {
    const matchSearch = !search
      || b.guestName?.toLowerCase().includes(search.toLowerCase())
      || b.roomName?.includes(search)
      || b.bookingId?.includes(search);
    const matchFilter = filter === 'all' || b.status === filter;
    return matchSearch && matchFilter && b.status !== 'cancelled';
  });

  const handleSaveBill = (billData) => {
    if (onUpdateBooking && billingBooking?.id) {
      onUpdateBooking(billingBooking.id, {
        totalAmount: billData.totalAmount.toFixed(2),
        paidAmount: billData.advancePaid,
        balance: billData.balance.toFixed(2),
        paymentMode: billData.paymentMode,
        paymentStatus: billData.balance <= 0 ? 'paid' : billData.advancePaid > 0 ? 'partial' : 'due',
        billingNotes: billData.notes,
        gstRate: billData.gstRate,
        gstAmount: billData.gstAmount,
        billingAudit: {
          savedAt: new Date().toISOString(),
          savedBy: typeof currentUser === 'object' ? currentUser.name : currentUser,
          totalAmount: billData.totalAmount,
          balance: billData.balance,
        },
      });
    }
    alert(`✅ Bill saved! Total: ₹${billData.totalAmount.toFixed(2)} · Balance: ₹${billData.balance.toFixed(2)}`);
    setBillingBooking(null);
  };
  
  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', color: '#1a1a2e' }}>📋 View Reservation Details</h2>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {['Copy', 'CSV', 'Print'].map(b => (
  <button
    key={b}
    onClick={() => {
      const columns = ['SR.', 'BOOKING ID', 'GUEST', 'ROOM', 'CATEGORY', 'CHECK-IN', 'CHECK-OUT', 'NIGHTS', 'STATUS', 'PAYMENT', 'AMOUNT'];
      const rows = filtered.map((b, idx) => {
        const nights = b.arrival && b.departure
          ? Math.round((new Date(b.departure) - new Date(b.arrival)) / 86400000)
          : '—';
        const category = rooms.find(r => r.name === b.roomName)?.category
          || (b.isMultiRoom ? 'Multi-Room' : '—');
        return {
          'SR.':        idx + 1,
          'BOOKING ID': b.bookingId || '—',
          'GUEST':      b.guestName,
          'ROOM':       b.roomName || `${b.rooms?.length} rooms`,
          'CATEGORY':   category,
          'CHECK-IN':   b.arrival  ? formatDate(b.arrival)  : '—',
          'CHECK-OUT':  b.departure? formatDate(b.departure): '—',
          'NIGHTS':     nights,
          'STATUS':     b.status,
          'PAYMENT':    b.paymentStatus,
          'AMOUNT':     b.totalAmount ? `₹${Number(b.totalAmount).toLocaleString('en-IN')}` : '—',
        };
      });

      if (b === 'Copy')  copyToClipboard(rows, columns);
      if (b === 'CSV')   downloadCSV(rows, columns, 'reservations.csv');
      if (b === 'Print') printTable(rows, columns, 'Reservation Details');
    }}
    style={{ padding: '5px 14px', border: '1px solid #ddd', borderRadius: 5, background: '#f5f5f5', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#555' }}
  >
    {b}
  </button>
))}
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.78rem', cursor: 'pointer' }}>
          {['all', 'confirmed', 'tentative', 'checked-in', 'blocked'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.82rem', color: '#666' }}>Search:</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Guest / Room / Booking ID..."
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.78rem', width: 220, outline: 'none' }} />
        </div>
      </div>

      {/* Table */}
<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
  <thead>
    <tr style={{ background: '#f0f2f5' }}>
      {['SR.', 'BOOKING ID', 'GUEST', 'ROOM', 'CATEGORY', 'CHECK-IN', 'CHECK-OUT', 'NIGHTS', 'RATE', 'STATUS', 'PAYMENT', 'AMOUNT', 'ACTION'].map(h => (
        <th key={h} style={{ padding: '7px 8px', textAlign: 'left', fontWeight: 700, color: '#555', borderBottom: '2px solid #e0e0e0', fontSize: '0.68rem', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
      ))}
    </tr>
  </thead>
  <tbody>
    {filtered.length === 0 ? (
      <tr><td colSpan={13} style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: '0.8rem' }}>No reservations found</td></tr>
    ) : filtered.map((b, idx) => {
      
      const nights = b.arrival && b.departure ? Math.round((new Date(b.departure) - new Date(b.arrival)) / 86400000) : '—';
      const c = categoryColors[rooms.find(r => r.name === b.roomName)?.category] || { bg: '#f5f5f5', border: '#999' };
      const hasOverride = b.rooms?.some(r => r.isRateOverridden) || b.isRateOverridden;
      return (
        <tr key={b.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9', borderBottom: '1px solid #eee' }}>
          <td style={{ padding: '6px 8px', color: '#aaa', fontSize: '0.72rem' }}>{idx + 1}</td>

          <td style={{ padding: '6px 8px', fontWeight: 600, color: '#1565c0', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
            {b.bookingId || <span style={{ color: '#ccc' }}>—</span>}
          </td>

          <td style={{ padding: '6px 8px', fontWeight: 600, color: '#1a1a2e', whiteSpace: 'nowrap' }}>
            {b.guestName}
            {b.tags?.includes('VIP') && (
              <span style={{ marginLeft: 4, fontSize: '0.6rem', background: '#f5eef8', color: '#6c3483', border: '1px solid #ce93d8', borderRadius: 6, padding: '1px 5px' }}>VIP</span>
            )}
          </td>

          <td style={{ padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {b.roomName || `${b.rooms?.length} rooms`}
          </td>

          <td style={{ padding: '6px 8px' }}>
            <span style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 6, padding: '2px 7px', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
              {rooms.find(r => r.name === b.roomName)?.category || (b.isMultiRoom ? 'Multi' : '—')}
            </span>
          </td>

       <td style={{ padding: '6px 8px', color: '#555', whiteSpace: 'nowrap', fontSize: '0.72rem' }}>
  {formatDate(b.arrival)}
</td>

<td style={{ padding: '6px 8px', color: '#555', whiteSpace: 'nowrap', fontSize: '0.72rem' }}>
  {formatDate(b.departure)}
</td>

          <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600 }}>{nights}</td>

          <td style={{ padding: '6px 8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontWeight: 600, fontSize: '0.72rem' }}>
                {b.source === BOOKING_SOURCES.OTA
                  ? <span style={{ color: '#e67e22' }}>OTA</span>
                  : b.baseRate ? `₹${b.baseRate}` : b.rooms?.[0]?.rate ? `₹${b.rooms[0].rate}` : '—'}
              </span>
              {hasOverride && (
                <span style={{ fontSize: '0.58rem', background: '#fff3cd', color: '#856404', border: '1px solid #ffc107', borderRadius: 3, padding: '1px 4px', whiteSpace: 'nowrap' }}>✏️ Override</span>
              )}
              {b.source === 'agent' && !hasOverride && b.agentName && (
                <span style={{ fontSize: '0.58rem', color: '#1e8449', fontWeight: 600 }}>✓ Agent</span>
              )}
            </div>
          </td>

          <td style={{ padding: '6px 8px' }}>
            <span style={{
              background: statusColor(b.status) + '22',
              color: statusColor(b.status),
              border: `1px solid ${statusColor(b.status)}44`,
              borderRadius: 8, padding: '2px 8px',
              fontSize: '0.68rem', fontWeight: 700,
              textTransform: 'capitalize', whiteSpace: 'nowrap',
              display: 'inline-block'
            }}>
              {b.status}
            </span>
          </td>

          <td style={{ padding: '6px 8px' }}>
            <span style={{
              color: b.paymentStatus === 'paid' ? '#1e8449' : b.paymentStatus === 'due' ? '#e74c3c' : '#e67e22',
              fontWeight: 700, fontSize: '0.72rem', textTransform: 'capitalize', whiteSpace: 'nowrap'
            }}>
              {b.paymentStatus}
            </span>
          </td>

          <td style={{ padding: '6px 8px', fontWeight: 700, color: '#1a1a2e', whiteSpace: 'nowrap', fontSize: '0.72rem' }}>
            {b.totalAmount ? `₹${Number(b.totalAmount).toLocaleString('en-IN')}` : '—'}
          </td>

          <td style={{ padding: '6px 8px' }}>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
             
              
              <button
                onClick={() => setBillingBooking(b)}
                style={{ color: '#fff', background: '#1e8449', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, padding: '3px 7px', whiteSpace: 'nowrap' }}>
                🧾 Bill
              </button>
            </div>
          </td>
        </tr>
      );
    })}
  </tbody>
</table>

      {/* Footer */}
      <div style={{ marginTop: 12, fontSize: '0.78rem', color: '#888', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Showing {filtered.length} of {bookings.length} reservations</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ padding: '4px 12px', border: '1px solid #ddd', borderRadius: 4, background: '#101010', cursor: 'pointer', fontSize: '0.78rem' }}>Previous</button>
          <button style={{ padding: '4px 12px', border: '1px solid #ddd', borderRadius: 4, background: '#1b1818', cursor: 'pointer', fontSize: '0.78rem' }}>Next</button>
        </div>
      </div>

      {/* Billing Modal */}
      {billingBooking && (
        <BillingModal
          booking={billingBooking}
          rooms={rooms}
          currentUser={loggedUser}
          onClose={() => setBillingBooking(null)}
          onSaveBill={handleSaveBill}
        />
      )}
    </div>
  );
}

export default ViewReservationPage;