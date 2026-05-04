import { useEffect, useState } from 'react';
import { format, differenceInDays } from 'date-fns';

const emptyBooking = {
  guestName: '', phone: '', email: '',
  arrival: '', departure: '', numGuests: 1, numChildren: 0,
  roomName: '', category: '',
  mealPlan: 'EP', status: 'confirmed', paymentStatus: 'due',
  source: 'direct', ratePlan: 'standard',
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
    ...p, tags: p.tags?.includes(tag) ? p.tags.filter(t => t !== tag) : [...(p.tags || []), tag],
  }));

  const nights = form.arrival && form.departure
    ? Math.max(0, differenceInDays(new Date(form.departure), new Date(form.arrival)))
    : 0;

  const calcTotal = () => {
    const base  = parseFloat(form.baseRate || 0);
    const extra = parseFloat(form.extraPersonCharge || 0) * Math.max(0, (parseInt(form.numGuests || 1) - 2));
    const sub   = (base + extra) * nights;
    const gst   = sub * (parseFloat(form.gstPercent || 0) / 100);
    return (sub + gst).toFixed(2);
  };

  const totalCalc = calcTotal();
  const balance   = (parseFloat(totalCalc) - parseFloat(form.paidAmount || 0)).toFixed(2);

  const inp  = { padding: '6px 9px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.82rem', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };
  const lbl  = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.8rem', color: '#444' };
  const tabs = ['stay',  'payment', 'notes'];

  const statusList = ['inquiry','tentative','confirmed','checked-in','checked-out','cancelled','no-show'];

  return (
    <div style={{ width: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column', fontFamily: 'inherit', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ background: '#1565c0', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>{booking?.id ? 'Edit Reservation' : 'New Reservation'}</div>
          {nights > 0 && <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', marginTop: 1 }}>{nights} night{nights > 1 ? 's' : ''}</div>}
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>✕ Close</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e8eaed', background: '#f7f8fa', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer',
            background: tab === t ? '#fff' : 'transparent',
            fontWeight: tab === t ? 700 : 500,
            color: tab === t ? '#1565c0' : '#666',
            fontSize: '0.78rem', textTransform: 'capitalize',
            borderBottom: tab === t ? '2px solid #1565c0' : '2px solid transparent',
            marginBottom: -2,
          }}>
            {t === 'stay' ? '🏨 Stay' :  t === 'payment' ? '💳 Payment' : '📝 Notes'}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>

        {/* ── Stay Tab ── */}
        {tab === 'stay' && <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={{ ...lbl, gridColumn: '1/-1' }}>
              Guest Name *
              <input value={form.guestName} onChange={update('guestName')} placeholder="Full name" required style={inp} autoFocus />
            </label>
            <label style={lbl}>Phone<input value={form.phone} onChange={update('phone')} placeholder="+91 XXXXX" style={inp} /></label>
            <label style={lbl}>Email<input type="email" value={form.email} onChange={update('email')} placeholder="email@..." style={inp} /></label>
            <label style={lbl}>
              Check-in
              <input type="date" value={form.arrival} onChange={update('arrival')} required style={inp} />
            </label>
            <label style={lbl}>
              Check-out
              <input type="date" value={form.departure} onChange={update('departure')} required style={inp} />
            </label>
            <label style={lbl}>
              Room
              <select value={form.roomName} onChange={update('roomName')} style={inp}>
                <option value="">Select room</option>
                {rooms.map(r => <option key={r.name} value={r.name}>{r.name} — {r.category}</option>)}
              </select>
            </label>
            <label style={lbl}>
              Meal Plan
              <select value={form.mealPlan} onChange={update('mealPlan')} style={inp}>
                {['EP','CP','MAP','AP'].map(m => <option key={m}>{m}</option>)}
              </select>
            </label>
            <label style={lbl}>
              Base Rate / Night (₹)
              <input type="number" value={form.baseRate} onChange={update('baseRate')} placeholder="0.00" style={inp} />
            </label>
            <label style={lbl}>
              Extra Person / Night (₹)
              <input type="number" value={form.extraPersonCharge} onChange={update('extraPersonCharge')} placeholder="0" style={inp} />
            </label>
            <label style={lbl}>
              Adults
              <input type="number" min="1" max="10" value={form.numGuests} onChange={update('numGuests')} style={inp} />
            </label>
            <label style={lbl}>
              Children
              <input type="number" min="0" max="10" value={form.numChildren} onChange={update('numChildren')} style={inp} />
            </label>
            <label style={lbl}>
              Status
              <select value={form.status} onChange={update('status')} style={inp}>
                {statusList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label style={lbl}>
              Source
              <select value={form.source} onChange={update('source')} style={inp}>
                {['direct','OTA','agent','walkin','corporate'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#666', marginBottom: 6, fontWeight: 600 }}>Tags</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['VIP','DND','Honeymoon','Anniversary','Birthday','Corporate'].map(tag => (
                <button
                  key={tag} type="button"
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                    border: form.tags?.includes(tag) ? '2px solid #1565c0' : '2px solid #ddd',
                    background: form.tags?.includes(tag) ? '#e3f0ff' : '#f5f5f5',
                    color: form.tags?.includes(tag) ? '#1565c0' : '#666',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </>}

        {/* ── Pricing Tab ──
        {tab === 'pricing' && <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={lbl}>
              Rate Plan
              <select value={form.ratePlan} onChange={update('ratePlan')} style={inp}>
                {['standard','corporate','seasonal','weekend','longstay'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            
            <label style={lbl}>
              GST %
              <select value={form.gstPercent} onChange={update('gstPercent')} style={inp}>
                {[0,5,12,18].map(g => <option key={g} value={g}>{g}%</option>)}
              </select>
            </label>
          </div>
          {nights > 0 && form.baseRate && (
            <div style={{ background: '#f0f7ff', border: '1px solid #b3d1f5', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 700, color: '#1565c0', marginBottom: 6 }}>Price Breakdown</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '3px 12px', color: '#444' }}>
                <span>Base ({nights} nights × ₹{form.baseRate})</span>
                <span style={{ fontWeight: 600 }}>₹{(nights * parseFloat(form.baseRate || 0)).toFixed(2)}</span>
                {parseFloat(form.extraPersonCharge) > 0 && <>
                  <span>Extra persons</span>
                  <span>₹{(parseFloat(form.extraPersonCharge) * Math.max(0, parseInt(form.numGuests || 1) - 2) * nights).toFixed(2)}</span>
                </>}
                <span>GST ({form.gstPercent}%)</span>
                <span>₹{((parseFloat(form.baseRate || 0) * nights) * (parseFloat(form.gstPercent) / 100)).toFixed(2)}</span>
                <span style={{ fontWeight: 700, color: '#1565c0', borderTop: '1px solid #cde', paddingTop: 4 }}>Total</span>
                <span style={{ fontWeight: 700, color: '#1565c0', borderTop: '1px solid #cde', paddingTop: 4 }}>₹{totalCalc}</span>
              </div>
            </div>
          )}
        </>} */}

        {/* ── Payment Tab ── */}
        {tab === 'payment' && <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={lbl}>
              Total Amount (₹)
              <input type="number" value={form.totalAmount || totalCalc} onChange={update('totalAmount')} style={inp} />
            </label>
            <label style={lbl}>
              Paid Amount (₹)
              <input type="number" value={form.paidAmount} onChange={update('paidAmount')} placeholder="0" style={inp} />
            </label>
            <label style={lbl}>
              Payment Status
              <select value={form.paymentStatus} onChange={update('paymentStatus')} style={inp}>
                {['paid','due','partial'].map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label style={lbl}>
              Payment Mode
              <select value={form.paymentMode} onChange={update('paymentMode')} style={inp}>
                {['cash','card','UPI','bank transfer','cheque'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
          </div>
          <div style={{ background: parseFloat(balance) > 0 ? '#fff5f5' : '#f0fff4', border: `1px solid ${parseFloat(balance) > 0 ? '#fcc' : '#9be9a8'}`, borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#666' }}>Balance Due</span>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: parseFloat(balance) > 0 ? '#e74c3c' : '#27ae60' }}>
                ₹{balance}
              </span>
            </div>
          </div>
        </>}

        {/* ── Notes Tab ── */}
        {tab === 'notes' && <>
          <label style={lbl}>
            Internal Notes
            <textarea value={form.notes} onChange={update('notes')} rows={5} placeholder="Special requests, preferences, internal notes..." style={{ ...inp, resize: 'vertical' }} />
          </label>
          <label style={lbl}>
            Special Requirements
            <textarea value={form.specialRequirements} onChange={update('specialRequirements')} rows={3} placeholder="Extra bed, flowers, early check-in..." style={{ ...inp, resize: 'vertical' }} />
          </label>
        </>}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f7f8fa', flexShrink: 0 }}>
        <div style={{ fontSize: '0.75rem', color: '#888' }}>
          {nights > 0 && <span>{nights} night{nights > 1 ? 's' : ''} · ₹{totalCalc}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '7px 18px', border: '1px solid #ddd', borderRadius: 6, background: '#151414', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500 }}>Cancel</button>
          <button
            onClick={() => {
              if (form.guestName?.trim()) {
                onSaveBooking({ ...form, totalAmount: form.totalAmount || totalCalc, balance });
              }
            }}
            style={{ padding: '7px 20px', border: 'none', borderRadius: 6, background: '#1565c0', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}
          >
            {booking?.id ? 'Update' : 'Save Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingForm;