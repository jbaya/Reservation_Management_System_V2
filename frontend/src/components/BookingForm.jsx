import { useEffect, useState } from 'react';
import { format, differenceInDays } from 'date-fns';

const OTA_PLATFORMS = [
  'Booking.com',
  'MakeMyTrip',
  'Agoda',
  'Expedia',
  'Goibibo',
  'Airbnb',
  'Yatra',
  'TripAdvisor',
  'Other OTA',
];

const emptyBooking = {
  guestName: '', phone: '', email: '',
  arrival: '', departure: '', numGuests: 1, numChildren: 0,
  roomName: '', category: '',
  mealPlan: 'EP', status: 'confirmed', paymentStatus: 'due',
  source: 'direct', otaPlatform: '', bookingId: '',
  ratePlan: 'standard',
  baseRate: '', extraPersonCharge: 0, gstPercent: 12,
  totalAmount: '', paidAmount: '', balance: '',
  notes: '', tags: [],
};

function BookingForm({ open, booking, rooms = [], onSaveBooking, onClose }) {
  const [form, setForm] = useState(emptyBooking);
  const [tab, setTab]   = useState('stay');

  useEffect(() => {
    setForm(booking ? { ...emptyBooking, ...booking } : emptyBooking);
    setTab('stay');
  }, [booking, open]);

  if (!open) return null;

  const update = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const toggleTag = (tag) => setForm(p => ({
    ...p, tags: p.tags?.includes(tag)
      ? p.tags.filter(t => t !== tag)
      : [...(p.tags || []), tag],
  }));

  const nights = form.arrival && form.departure
    ? Math.max(0, differenceInDays(new Date(form.departure), new Date(form.arrival)))
    : 0;

  const calcTotal = () => {
    const base  = parseFloat(form.baseRate || 0);
    const extra = parseFloat(form.extraPersonCharge || 0) * Math.max(0, parseInt(form.numGuests || 1) - 2);
    const sub   = (base + extra) * nights;
    const gst   = sub * (parseFloat(form.gstPercent || 0) / 100);
    return (sub + gst).toFixed(2);
  };

  const totalCalc = calcTotal();
  const balance   = (parseFloat(totalCalc) - parseFloat(form.paidAmount || 0)).toFixed(2);

  const isOTA = form.source === 'OTA';

  const inp = {
    padding: '8px 10px', borderRadius: 7, border: '1.5px solid #ddd',
    fontSize: '0.82rem', width: '100%', boxSizing: 'border-box',
    fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#1a1a2e',
    transition: 'border 0.15s',
  };
  const lbl  = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem', color: '#555', fontWeight: 600 };
  const tabs = ['stay', 'payment', 'notes'];

  const statusList = ['inquiry','tentative','confirmed','checked-in','checked-out','cancelled','no-show'];

  return (
    <div style={{ width: 540, maxHeight: '90vh', display: 'flex', flexDirection: 'column', fontFamily: 'inherit', overflowY: 'auto', overflowX: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #1565c0, #1976d2)', padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem' }}>
            {booking?.id ? '✏️ Edit Reservation' : '🏨 New Reservation'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', marginTop: 2, display: 'flex', gap: 10 }}>
            {nights > 0 && <span>📅 {nights} night{nights > 1 ? 's' : ''}</span>}
            {form.bookingId && <span>🔖 ID: {form.bookingId}</span>}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, flexShrink: 0 }}>
          ✕ Close
        </button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e8eaed', background: '#f7f8fa', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
            background: tab === t ? '#fff' : 'transparent',
            fontWeight: tab === t ? 700 : 500,
            color: tab === t ? '#1565c0' : '#777',
            fontSize: '0.8rem',
            borderBottom: tab === t ? '2px solid #1565c0' : '2px solid transparent',
            marginBottom: -2,
          }}>
            {t === 'stay' ? '🏨 Stay' : t === 'payment' ? '💳 Payment' : '📝 Notes'}
          </button>
        ))}
      </div>

      <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>

        {/* ══════════════════════════════════════════
            TAB A — STAY
        ══════════════════════════════════════════ */}
        {tab === 'stay' && <>

          {/* Guest Name */}
          <label style={{ ...lbl, gridColumn: '1/-1' }}>
            Guest Name *
            <input value={form.guestName} onChange={update('guestName')} placeholder="Full name" required style={inp} autoFocus
              onFocus={e => e.target.style.border = '1.5px solid #1565c0'}
              onBlur={e => e.target.style.border = '1.5px solid #ddd'} />
          </label>

          {/* Phone + Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={lbl}>Phone
              <input value={form.phone} onChange={update('phone')} placeholder="+91 XXXXX" style={inp}
                onFocus={e => e.target.style.border = '1.5px solid #1565c0'}
                onBlur={e => e.target.style.border = '1.5px solid #ddd'} />
            </label>
            <label style={lbl}>Email
              <input type="email" value={form.email} onChange={update('email')} placeholder="email@..." style={inp}
                onFocus={e => e.target.style.border = '1.5px solid #1565c0'}
                onBlur={e => e.target.style.border = '1.5px solid #ddd'} />
            </label>
          </div>

          {/* Check-in + Check-out */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={lbl}>Check-in
              <input type="date" value={form.arrival} onChange={update('arrival')} required style={inp}
                onFocus={e => e.target.style.border = '1.5px solid #1565c0'}
                onBlur={e => e.target.style.border = '1.5px solid #ddd'} />
            </label>
            <label style={lbl}>Check-out
              <input type="date" value={form.departure} onChange={update('departure')} required style={inp}
                onFocus={e => e.target.style.border = '1.5px solid #1565c0'}
                onBlur={e => e.target.style.border = '1.5px solid #ddd'} />
            </label>
          </div>
          {nights > 0 && (
            <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#1565c0', fontWeight: 700, background: '#e3f0ff', borderRadius: 6, padding: '4px 0' }}>
              📅 {nights} night{nights > 1 ? 's' : ''}
            </div>
          )}

          {/* Room + Meal Plan */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={lbl}>Room
              <select value={form.roomName} onChange={update('roomName')} style={inp}>
                <option value="">Select room</option>
                {rooms.map(r => <option key={r.name} value={r.name}>{r.name} — {r.category}</option>)}
              </select>
            </label>
            <label style={lbl}>Meal Plan
              <select value={form.mealPlan} onChange={update('mealPlan')} style={inp}>
                {['EP','CP','MAP','AP'].map(m => <option key={m}>{m}</option>)}
              </select>
            </label>
          </div>

          {/* Adults + Children */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={lbl}>Adults
              <input type="number" min="1" max="10" value={form.numGuests} onChange={update('numGuests')} style={inp} />
            </label>
            <label style={lbl}>Children
              <input type="number" min="0" max="10" value={form.numChildren} onChange={update('numChildren')} style={inp} />
            </label>
          </div>

          {/* Status */}
          <label style={lbl}>Status
            <select value={form.status} onChange={update('status')} style={inp}>
              {statusList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          {/* ── SOURCE SECTION ── */}
          <div style={{ background: '#f8f9fa', border: '1px solid #e8eaed', borderRadius: 9, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              📡 Booking Source
            </div>

            {/* Source dropdown */}
            <label style={lbl}>Source
              <select value={form.source} onChange={update('source')} style={inp}>
                {['direct','OTA','agent','walkin','corporate'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            {/* OTA fields — only show when OTA selected */}
            {isOTA && (
              <>
                {/* Divider */}
                <div style={{ height: 1, background: '#dee2e6', margin: '2px 0' }} />

                {/* OTA Platform */}
                <label style={lbl}>
                  OTA Platform *
                  <select value={form.otaPlatform} onChange={update('otaPlatform')} style={{ ...inp, border: '1.5px solid #1565c0' }} required>
                    <option value="">Select OTA Platform</option>
                    {OTA_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>

                {/* Booking ID */}
                <label style={lbl}>
                  Booking ID
                  <div style={{ position: 'relative' }}>
                    <input
                      value={form.bookingId}
                      onChange={update('bookingId')}
                      placeholder="e.g. 6503176304"
                      style={{ ...inp, border: '1.5px solid #1565c0', paddingLeft: 32 }}
                      onFocus={e => e.target.style.border = '1.5px solid #0d47a1'}
                      onBlur={e => e.target.style.border = '1.5px solid #1565c0'}
                    />
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem' }}>🔖</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#888', fontWeight: 400 }}>
                    OTA confirmation number (e.g. from Booking.com email)
                  </span>
                </label>

                {/* OTA info box */}
                {form.otaPlatform && form.bookingId && (
                  <div style={{ background: '#e3f0ff', border: '1px solid #90caf9', borderRadius: 6, padding: '8px 12px', fontSize: '0.75rem', color: '#1565c0', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem' }}>✅</span>
                    <div>
                      <strong>{form.otaPlatform}</strong> booking<br />
                      ID: <strong>{form.bookingId}</strong>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Tags */}
          <div>
            <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tags</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['VIP','DND','Honeymoon','Anniversary','Birthday','Corporate'].map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)} style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  border: form.tags?.includes(tag) ? '2px solid #1565c0' : '2px solid #dee2e6',
                  background: form.tags?.includes(tag) ? '#e3f0ff' : '#f8f9fa',
                  color: form.tags?.includes(tag) ? '#1565c0' : '#666',
                  transition: 'all 0.15s',
                }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </>}

        {/* ══════════════════════════════════════════
            TAB B — PAYMENT
        ══════════════════════════════════════════ */}
        {tab === 'payment' && <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={lbl}>Base Rate / Night (₹)
              <input type="number" value={form.baseRate} onChange={update('baseRate')} placeholder="0.00" style={inp} />
            </label>
            <label style={lbl}>Extra Person / Night (₹)
              <input type="number" value={form.extraPersonCharge} onChange={update('extraPersonCharge')} placeholder="0" style={inp} />
            </label>
            <label style={lbl}>GST %
              <select value={form.gstPercent} onChange={update('gstPercent')} style={inp}>
                {[0,5,12,18].map(g => <option key={g} value={g}>{g}%</option>)}
              </select>
            </label>
            <label style={lbl}>Total Amount (₹)
              <input type="number" value={form.totalAmount || totalCalc} onChange={update('totalAmount')} style={inp} />
            </label>
            <label style={lbl}>Paid Amount (₹)
              <input type="number" value={form.paidAmount} onChange={update('paidAmount')} placeholder="0" style={inp} />
            </label>
            <label style={lbl}>Payment Status
              <select value={form.paymentStatus} onChange={update('paymentStatus')} style={inp}>
                {['paid','due','partial'].map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label style={lbl}>Payment Mode
              <select value={form.paymentMode} onChange={update('paymentMode')} style={inp}>
                {['cash','card','UPI','bank transfer','cheque'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
          </div>

          {/* Balance box */}
          <div style={{ background: parseFloat(balance) > 0 ? '#fff5f5' : '#f0fff4', border: `1.5px solid ${parseFloat(balance) > 0 ? '#fcc' : '#9be9a8'}`, borderRadius: 8, padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#555', fontSize: '0.85rem', fontWeight: 600 }}>Balance Due</span>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: parseFloat(balance) > 0 ? '#e74c3c' : '#27ae60' }}>
                ₹{balance}
              </span>
            </div>
            {parseFloat(balance) > 0 && (
              <div style={{ fontSize: '0.72rem', color: '#e74c3c', marginTop: 4 }}>⚠️ Payment pending</div>
            )}
          </div>
        </>}

        {/* ══════════════════════════════════════════
            TAB C — NOTES
        ══════════════════════════════════════════ */}
        {tab === 'notes' && <>
          <label style={lbl}>Internal Notes
            <textarea value={form.notes} onChange={update('notes')} rows={5}
              placeholder="Special requests, preferences, internal notes..."
              style={{ ...inp, resize: 'vertical' }} />
          </label>
          <label style={lbl}>Special Requirements
            <textarea value={form.specialRequirements} onChange={update('specialRequirements')} rows={3}
              placeholder="Extra bed, flowers, early check-in..."
              style={{ ...inp, resize: 'vertical' }} />
          </label>
        </>}
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '12px 22px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f7f8fa', flexShrink: 0, position: 'sticky', bottom: 0 }}>
        <div style={{ fontSize: '0.75rem', color: '#888' }}>
          {nights > 0 && <span>📅 {nights} nights · ₹{totalCalc}</span>}
          {form.bookingId && <span style={{ marginLeft: 10, color: '#1565c0' }}>🔖 {form.bookingId}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid #ddd', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500 }}>
            Cancel
          </button>
          <button
            onClick={() => {
              if (form.guestName?.trim()) {
                onSaveBooking({ ...form, totalAmount: form.totalAmount || totalCalc, balance });
              }
            }}
            style={{ padding: '8px 22px', border: 'none', borderRadius: 7, background: '#1565c0', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}
          >
            {booking?.id ? '✅ Update' : '💾 Save Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingForm;