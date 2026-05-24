import { useState } from 'react';

function ViewReservationPage({ bookings, rooms, categoryColors }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = bookings.filter(b => {
    const matchSearch = !search || b.guestName?.toLowerCase().includes(search.toLowerCase()) || b.roomName?.includes(search) || b.bookingId?.includes(search);
    const matchFilter = filter === 'all' || b.status === filter;
    return matchSearch && matchFilter && b.status !== 'cancelled';
  });

  const statusColor = (s) => {
    const map = { confirmed: '#1e8449', tentative: '#d4ac0d', 'checked-in': '#1565c0', blocked: '#7b241c' };
    return map[s] || '#666';
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', color: '#1a1a2e' }}>📋 View Reservation Details</h2>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {['Copy', 'CSV', 'Print'].map(b => (<button key={b} style={{ padding: '5px 14px', border: '1px solid #ddd', borderRadius: 5, background: '#f5f5f5', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#555' }}>{b}</button>))}
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.78rem', cursor: 'pointer' }}>
          {['all', 'confirmed', 'tentative', 'checked-in', 'blocked'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.82rem', color: '#666' }}>Search:</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Guest / Room / Booking ID..."
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.78rem', width: 220, outline: 'none' }} />
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr style={{ background: '#f0f2f5' }}>
            {['SR.', 'BOOKING ID', 'GUEST', 'ROOM', 'CATEGORY', 'CHECK-IN', 'CHECK-OUT', 'NIGHTS', 'STATUS', 'PAYMENT', 'AMOUNT', 'ACTION'].map(h => (
              <th key={h} style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 700, color: '#555', borderBottom: '2px solid #e0e0e0', fontSize: '0.72rem', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={12} style={{ padding: 30, textAlign: 'center', color: '#aaa', fontSize: '0.85rem' }}>No reservations found</td></tr>
          ) : filtered.map((b, idx) => {
            const nights = b.arrival && b.departure ? Math.round((new Date(b.departure) - new Date(b.arrival)) / 86400000) : '—';
            const c = categoryColors[rooms.find(r => r.name === b.roomName)?.category] || { bg: '#f5f5f5', border: '#999' };
            return (
              <tr key={b.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9', borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '9px 10px', color: '#888' }}>{idx + 1}</td>
                <td style={{ padding: '9px 10px', fontWeight: 600, color: '#1565c0', fontSize: '0.75rem' }}>{b.bookingId || <span style={{ color: '#ccc' }}>—</span>}</td>
                <td style={{ padding: '9px 10px', fontWeight: 600, color: '#1a1a2e' }}>
                  {b.guestName}
                  {b.tags?.includes('VIP') && <span style={{ marginLeft: 5, fontSize: '0.65rem', background: '#f5eef8', color: '#6c3483', border: '1px solid #ce93d8', borderRadius: 8, padding: '1px 6px' }}>VIP</span>}
                </td>
                <td style={{ padding: '9px 10px', fontWeight: 700 }}>{b.roomName}</td>
                <td style={{ padding: '9px 10px' }}>
                  <span style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '2px 8px', fontSize: '0.72rem' }}>
                    {rooms.find(r => r.name === b.roomName)?.category || '—'}
                  </span>
                </td>
                <td style={{ padding: '9px 10px', color: '#555' }}>{b.arrival}</td>
                <td style={{ padding: '9px 10px', color: '#555' }}>{b.departure}</td>
                <td style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 600 }}>{nights}</td>
                <td style={{ padding: '9px 10px' }}>
                  <span style={{ background: statusColor(b.status) + '22', color: statusColor(b.status), border: `1px solid ${statusColor(b.status)}44`, borderRadius: 10, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize' }}>{b.status}</span>
                </td>
                <td style={{ padding: '9px 10px' }}>
                  <span style={{ color: b.paymentStatus === 'paid' ? '#1e8449' : b.paymentStatus === 'due' ? '#e74c3c' : '#e67e22', fontWeight: 700, fontSize: '0.75rem', textTransform: 'capitalize' }}>{b.paymentStatus}</span>
                </td>
                <td style={{ padding: '9px 10px', fontWeight: 700, color: '#1a1a2e' }}>{b.totalAmount ? `₹${b.totalAmount}` : '—'}</td>
                <td style={{ padding: '9px 10px' }}>
                  <button style={{ color: '#1565c0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>EDIT</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop: 12, fontSize: '0.78rem', color: '#888', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Showing {filtered.length} of {bookings.length} reservations</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ padding: '4px 12px', border: '1px solid #ddd', borderRadius: 4, background: '#f5f5f5', cursor: 'pointer', fontSize: '0.78rem' }}>Previous</button>
          <button style={{ padding: '4px 12px', border: '1px solid #ddd', borderRadius: 4, background: '#f5f5f5', cursor: 'pointer', fontSize: '0.78rem' }}>Next</button>
        </div>
      </div>
    </div>
  );
}

export default ViewReservationPage;