import { useEffect, useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { resolveRate, calcTotals, canUserOverrideRates, shouldShowRateFields, isRateEditable, applyRateOverride, resetRateOverride, BOOKING_SOURCES } from '../utils/Rateutil';
import RateOverrideIndicator from './RateOverrideIndicater';

const OTA_PLATFORMS = [
  'Booking.com', 'MakeMyTrip', 'Agoda', 'Expedia',
  'Goibibo', 'Airbnb', 'Yatra', 'TripAdvisor', 'Other OTA',
];

const emptyBooking = {
  guestName: '', phone: '', email: '', nationality: '',
  arrival: '', departure: '', numGuests: 1, numChildren: 0,
  childrenAges: [],
  roomName: '', category: '',
  mealPlan: 'EP', status: 'confirmed', paymentStatus: 'due',
  source: 'direct', otaPlatform: '', bookingId: '',
  baseRate: '', extraPersonCharge: 0, extraChildCharge: 0, gstPercent: 12,
  totalAmount: '', paidAmount: '', balance: '',
  paymentMode: '',
  comments: [], tags: [],
};

// ── Comment Item ──────────────────────────────────────────────────────────────
function CommentItem({ comment, onDelete, onEdit, currentUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText,  setEditText]  = useState(comment.text);

  const canModify = comment.author === currentUser;

  return (
    <div style={{
      background: '#fff', border: '1px solid #e8eaed', borderRadius: 8,
      padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1565c0, #42a5f5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '0.7rem', fontWeight: 800, flexShrink: 0,
          }}>
            {comment.author?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1a1a2e' }}>
              {comment.author}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#aaa' }}>
              {comment.timestamp
                ? format(new Date(comment.timestamp), 'hh:mm a, d MMM yyyy')
                : ''}
              {comment.edited && <span style={{ marginLeft: 5, color: '#bbb', fontStyle: 'italic' }}>(edited)</span>}
            </div>
          </div>
        </div>

        {/* Action buttons — only for comment author */}
        {canModify && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', color: '#1565c0', padding: '2px 6px', borderRadius: 4 }}
              title="Edit"
            >✏️</button>
            <button
              onClick={() => onDelete(comment.id)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', color: '#e74c3c', padding: '2px 6px', borderRadius: 4 }}
              title="Delete"
            >🗑️</button>
          </div>
        )}
      </div>

      {/* Comment text / edit mode */}
      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={2}
            autoFocus
            style={{ padding: '7px 10px', borderRadius: 6, border: '1.5px solid #1565c0', fontSize: '0.82rem', resize: 'none', fontFamily: 'inherit', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setIsEditing(false); setEditText(comment.text); }}
              style={{ padding: '3px 10px', border: '1px solid #ddd', borderRadius: 5, background: '#fff', cursor: 'pointer', fontSize: '0.72rem' }}
            >Cancel</button>
            <button
              onClick={() => { onEdit(comment.id, editText); setIsEditing(false); }}
              style={{ padding: '3px 10px', border: 'none', borderRadius: 5, background: '#1565c0', color: '#fff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}
            >Save</button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '0.82rem', color: '#333', lineHeight: 1.5, paddingLeft: 35 }}>
          {comment.text}
        </div>
      )}
    </div>
  );
}

// ── Main BookingForm ──────────────────────────────────────────────────────────
function BookingForm({ open, booking, rooms = [], onSaveBooking, onClose, currentUser = 'Admin', travelAgents = [], travelAgentRates = [], seasons = [] }) {
  const [form,       setForm]       = useState(emptyBooking);
  const [tab,        setTab]        = useState('stay');
  const [newComment, setNewComment] = useState('');
  const [rateInfo,   setRateInfo]   = useState(null); // stores resolved rate metadata

  useEffect(() => {
    setForm(booking ? { ...emptyBooking, ...booking, comments: booking.comments || [] } : emptyBooking);
    setTab('stay');
    setNewComment('');
  }, [booking, open]);

 // Auto-resolve agent rate when source/agent/category/arrival changes
  useEffect(() => {
    if (form.source !== BOOKING_SOURCES.AGENT || !form.agentName || !form.arrival || !form.category) return;
    if (form.isRateOverridden) return; // don't overwrite manual override
    const agent = travelAgents.find(a => a.name === form.agentName);
    if (!agent) return;
    const resolved = resolveRate({ travelAgentRates, seasons, agent, category: form.category, arrival: form.arrival, source: form.source });
    if (resolved.source === 'agent') {
      setForm(p => ({ ...p, baseRate: resolved.rate, extraPersonCharge: resolved.extraPersonRate }));
      setRateInfo(resolved);
    }
  }, [form.source, form.agentName, form.category, form.arrival]);

  if (!open) return null;

  const update = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const toggleTag = (tag) => setForm(p => ({
    ...p, tags: p.tags?.includes(tag)
      ? p.tags.filter(t => t !== tag)
      : [...(p.tags || []), tag],
  }));

  // ── Children handlers ──────────────────────────────────────────────────────
  const handleChildrenCount = (e) => {
    const count    = Math.max(0, parseInt(e.target.value) || 0);
    const newAges  = Array.from({ length: count }, (_, i) => form.childrenAges?.[i] ?? '');
    setForm(p => ({ ...p, numChildren: count, childrenAges: newAges }));
  };

  const handleChildAge = (index, value) => {
    const newAges   = [...(form.childrenAges || [])];
    newAges[index]  = value;
    setForm(p => ({ ...p, childrenAges: newAges }));
  };

  const childrenAbove6 = (form.childrenAges || []).filter(a => !isNaN(parseInt(a)) && parseInt(a) > 6).length;
  const childrenBelow6 = (form.childrenAges || []).filter(a => !isNaN(parseInt(a)) && parseInt(a) <= 6).length;

  // ── Comment handlers ───────────────────────────────────────────────────────
  const handlePostComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id:        `c${Date.now()}`,
      author:    currentUser,
      text:      newComment.trim(),
      timestamp: new Date().toISOString(),
      edited:    false,
    };
    setForm(p => ({ ...p, comments: [...(p.comments || []), comment] }));
    setNewComment('');
  };

  const handleDeleteComment = (id) => {
    setForm(p => ({ ...p, comments: (p.comments || []).filter(c => c.id !== id) }));
  };

  const handleEditComment = (id, newText) => {
    setForm(p => ({
      ...p,
      comments: (p.comments || []).map(c =>
        c.id === id ? { ...c, text: newText, edited: true } : c
      ),
    }));
  };

  // ── Nights & Price ─────────────────────────────────────────────────────────
  const nights = form.arrival && form.departure
    ? Math.max(0, differenceInDays(new Date(form.departure), new Date(form.arrival)))
    : 0;

  const calcTotal = () => {
    const base        = parseFloat(form.baseRate || 0);
    const extraPerson = parseFloat(form.extraPersonCharge || 0) * Math.max(0, parseInt(form.numGuests || 1) - 2);
    const extraChild  = parseFloat(form.extraChildCharge || 0) * childrenAbove6;
    const sub         = (base + extraPerson + extraChild) * nights;
    const autoGst = parseFloat(form.baseRate || 0) > 7499 ? 12 : 5;
const gst = sub * (autoGst / 100);
    return (sub + gst).toFixed(2);
  };

  const totalCalc = calcTotal();
  const balance   = (parseFloat(totalCalc) - parseFloat(form.paidAmount || 0)).toFixed(2);
 const isOTA                  = form.source === 'OTA';
  const isPaymentModeMandatory = form.source === 'direct' || form.source === 'agent';
  const loggedUser             = typeof currentUser === 'object' ? currentUser : { name: currentUser, role: 'Admin' };
  const showRates              = shouldShowRateFields(form.source);
  const ratesEditable          = isRateEditable(form.source, loggedUser);

  // ── Styles ─────────────────────────────────────────────────────────────────
  const inp = {
    padding: '8px 10px', borderRadius: 7, border: '1.5px solid #ddd',
    fontSize: '0.82rem', width: '100%', boxSizing: 'border-box',
    fontFamily: 'inherit', outline: 'none', background: '#fff',
    color: '#1a1a2e', transition: 'border 0.15s',
  };
  const lbl       = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem', color: '#555', fontWeight: 600 };
  const focusInp  = e => e.target.style.border = '1.5px solid #1565c0';
  const blurInp   = e => e.target.style.border = '1.5px solid #ddd';
  const statusList = ['inquiry','tentative','confirmed','checked-in','checked-out','cancelled','no-show'];
  const tabs       = ['stay', 'payment', 'comments'];

  return (
    <div style={{ width: 540, maxHeight: '90vh', display: 'flex', flexDirection: 'column', fontFamily: 'inherit', overflowY: 'auto', overflowX: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #1565c0, #1976d2)', padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem' }}>
            {booking?.id ? '✏️ Edit Reservation' : '🏨 New Reservation'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {nights > 0 && <span>📅 {nights} night{nights > 1 ? 's' : ''}</span>}
            {form.bookingId && <span>🔖 {form.bookingId}</span>}
            {(form.comments || []).length > 0 && (
              <span>💬 {form.comments.length} comment{form.comments.length > 1 ? 's' : ''}</span>
            )}
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
            {t === 'stay' ? '🏨 Stay'
              : t === 'payment' ? '💳 Payment'
              : `💬 Comments${(form.comments||[]).length > 0 ? ` (${form.comments.length})` : ''}`}
          </button>
        ))}
      </div>

      <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>

        {/* ══════════ STAY TAB ══════════ */}
        {tab === 'stay' && <>
          <label style={lbl}>Guest Name *
            <input value={form.guestName} onChange={update('guestName')} placeholder="Full name" required style={inp} autoFocus onFocus={focusInp} onBlur={blurInp} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={lbl}>Phone
              <input value={form.phone} onChange={update('phone')} placeholder="+91 XXXXX" style={inp} onFocus={focusInp} onBlur={blurInp} />
            </label>
            <label style={lbl}>Email
              <input type="email" value={form.email} onChange={update('email')} placeholder="email@..." style={inp} onFocus={focusInp} onBlur={blurInp} />
            </label>
          </div>

          <label style={lbl}>Nationality
            <input value={form.nationality} onChange={update('nationality')} placeholder="e.g. Indian, American, British..." style={inp} onFocus={focusInp} onBlur={blurInp} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={lbl}>Check-in
              <input type="date" value={form.arrival} onChange={update('arrival')} required style={inp} onFocus={focusInp} onBlur={blurInp} />
            </label>
            <label style={lbl}>Check-out
              <input type="date" value={form.departure} onChange={update('departure')} required style={inp} onFocus={focusInp} onBlur={blurInp} />
            </label>
          </div>

          {nights > 0 && (
            <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#1565c0', fontWeight: 700, background: '#e3f0ff', borderRadius: 6, padding: '5px 0' }}>
              📅 {nights} night{nights > 1 ? 's' : ''}
            </div>
          )}

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

          {/* Guest Details */}
          <div style={{ background: '#f8f9fa', border: '1px solid #e8eaed', borderRadius: 9, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>👥 Guest Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={lbl}>Adults
                <input type="number" min="1" max="20" value={form.numGuests} onChange={update('numGuests')} style={inp} onFocus={focusInp} onBlur={blurInp} />
              </label>
              <label style={lbl}>Children
                <input type="number" min="0" max="20" value={form.numChildren} onChange={handleChildrenCount} style={inp} onFocus={focusInp} onBlur={blurInp} />
              </label>
            </div>

            {parseInt(form.numChildren) > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>Children Ages <span style={{ color: '#aaa', fontWeight: 400 }}>(years)</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
                  {(form.childrenAges || []).map((age, idx) => {
                    const ageNum   = parseInt(age);
                    const isAbove6 = !isNaN(ageNum) && ageNum > 6;
                    const isFree   = !isNaN(ageNum) && ageNum <= 6;
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ fontSize: '0.7rem', color: '#777', fontWeight: 600 }}>Child {idx + 1}</div>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="number" min="0" max="17" value={age}
                            onChange={e => handleChildAge(idx, e.target.value)}
                            placeholder="Age"
                            style={{ ...inp, border: isAbove6 ? '1.5px solid #e67e22' : isFree ? '1.5px solid #27ae60' : '1.5px solid #ddd', paddingRight: age !== '' ? 28 : 10 }}
                          />
                          {age !== '' && (
                            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem' }}>
                              {isAbove6 ? '💰' : '✅'}
                            </span>
                          )}
                        </div>
                        {age !== '' && (
                          <div style={{ fontSize: '0.62rem', fontWeight: 600, color: isAbove6 ? '#e67e22' : '#27ae60' }}>
                            {isAbove6 ? 'Extra charge' : 'Free (≤6 yrs)'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {(form.childrenAges || []).some(a => a !== '') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
                    {childrenBelow6 > 0 && (
                      <div style={{ background: '#eafaf1', border: '1px solid #a9dfbf', borderRadius: 6, padding: '6px 10px', fontSize: '0.75rem', color: '#1e8449', display: 'flex', alignItems: 'center', gap: 6 }}>
                        ✅ <strong>{childrenBelow6}</strong> child{childrenBelow6 > 1 ? 'ren' : ''} (≤6 yrs) — <strong>Free</strong>
                      </div>
                    )}
                    {childrenAbove6 > 0 && (
                      <div style={{ background: '#fef5e7', border: '1px solid #f8c471', borderRadius: 6, padding: '6px 10px', fontSize: '0.75rem', color: '#d35400', display: 'flex', alignItems: 'center', gap: 6 }}>
                        ⚠️ <strong>{childrenAbove6}</strong> child{childrenAbove6 > 1 ? 'ren' : ''} (&gt;6 yrs) — <strong>Extra charge</strong>
                        <span style={{ color: '#aaa', marginLeft: 4 }}>→ Add in Payment tab</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <label style={lbl}>Status
            <select value={form.status} onChange={update('status')} style={inp}>
              {statusList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          {/* Source Section */}
          <div style={{ background: '#f8f9fa', border: '1px solid #e8eaed', borderRadius: 9, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>📡 Booking Source</div>
            <label style={lbl}>Source
              <select value={form.source} onChange={update('source')} style={inp}>
                {['direct','OTA','agent','walkin','corporate'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
           {form.source === BOOKING_SOURCES.AGENT && (
              <label style={lbl}>Travel Agent *
                <select value={form.agentName} onChange={e => { setForm(p => ({ ...p, agentName: e.target.value, isRateOverridden: false, originalRateDetails: null })); setRateInfo(null); }} style={{ ...inp, border: '1.5px solid #1565c0' }}>
                  <option value="">-- Select Agent --</option>
                  {travelAgents.map(a => <option key={a.id} value={a.name}>{a.name}{a.company ? ` (${a.company})` : ''}</option>)}
                </select>
              </label>
            )}
            {isOTA && (
              <>
                <div style={{ height: 1, background: '#dee2e6' }} />
                <label style={lbl}>OTA Platform *
                  <select value={form.otaPlatform} onChange={update('otaPlatform')} style={{ ...inp, border: '1.5px solid #1565c0' }}>
                    <option value="">Select OTA Platform</option>
                    {OTA_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
                <label style={lbl}>Booking ID
                  <div style={{ position: 'relative' }}>
                    <input value={form.bookingId} onChange={update('bookingId')} placeholder="e.g. 6503176304"
                      style={{ ...inp, border: '1.5px solid #1565c0', paddingLeft: 32 }}
                      onFocus={e => e.target.style.border = '1.5px solid #0d47a1'}
                      onBlur={e => e.target.style.border = '1.5px solid #1565c0'} />
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>🔖</span>
                  </div>
                </label>
                {form.otaPlatform && form.bookingId && (
                  <div style={{ background: '#e3f0ff', border: '1px solid #90caf9', borderRadius: 6, padding: '8px 12px', fontSize: '0.75rem', color: '#1565c0' }}>
                    ✅ <strong>{form.otaPlatform}</strong> · ID: <strong>{form.bookingId}</strong>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Tags */}
          <div>
            <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tags</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['VIP','DNC','DND','Honeymoon','Anniversary','Birthday','Corporate'].map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)} style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  border: form.tags?.includes(tag) ? '2px solid #1565c0' : '2px solid #dee2e6',
                  background: form.tags?.includes(tag) ? '#e3f0ff' : '#f8f9fa',
                  color: form.tags?.includes(tag) ? '#1565c0' : '#666',
                }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </>}

        {/* ══════════ PAYMENT TAB ══════════ */}
        {tab === 'payment' && <>
         {/* OTA notice */}
          {!showRates && (
            <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: '#7d5a00', fontWeight: 600 }}>
              🔒 OTA Booking — Room rates are managed externally by {form.otaPlatform || 'the OTA platform'}. No rate entry required.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Base Rate */}
            <label style={lbl}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                Base Rate / Night (₹)
                {showRates && rateInfo && !form.isRateOverridden && (
                  <RateOverrideIndicator isOverride={false} label={rateInfo.label} />
                )}
                {showRates && form.isRateOverridden && (
                  <RateOverrideIndicator
                    isOverride={true}
                    originalRate={form.originalRateDetails?.rate}
                    currentRate={form.baseRate}
                    overriddenBy={form.rateOverriddenBy}
                    overriddenAt={form.rateOverriddenAt}
                    source={rateInfo?.label}
                  />
                )}
              </div>
              {showRates ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="number"
                    value={form.baseRate}
                    onChange={e => {
                      if (!ratesEditable) return;
                      const newRate = e.target.value;
                      if (form.source === BOOKING_SOURCES.AGENT && rateInfo && !form.isRateOverridden) {
                        const updated = applyRateOverride({ ...form, roomName: form.roomName, roomCategory: form.category, rate: form.baseRate }, parseFloat(newRate), loggedUser);
                        setForm(p => ({ ...p, baseRate: newRate, isRateOverridden: true, rateOverriddenBy: updated.rateOverriddenBy, rateOverriddenAt: updated.rateOverriddenAt, originalRateDetails: updated.originalRateDetails }));
                      } else {
                        setForm(p => ({ ...p, baseRate: newRate }));
                      }
                    }}
                    placeholder="0.00"
                    readOnly={!ratesEditable}
                    title={!ratesEditable ? 'Only Admin/Manager can edit agent rates' : ''}
                    style={{ ...inp, flex: 1, background: !ratesEditable ? '#f5f5f5' : '#fff', cursor: !ratesEditable ? 'not-allowed' : 'text', border: form.isRateOverridden ? '1.5px solid #f39c12' : '1.5px solid #ddd' }}
                    onFocus={focusInp} onBlur={blurInp}
                  />
                  {form.isRateOverridden && ratesEditable && (
                    <button type="button" title="Reset to agent rate"
                      onClick={() => {
                        const reset = resetRateOverride({ rate: form.baseRate, isRateOverridden: form.isRateOverridden, originalRateDetails: form.originalRateDetails }, loggedUser);
                        setForm(p => ({ ...p, baseRate: reset.rate, isRateOverridden: false, rateOverriddenBy: null, rateOverriddenAt: null, originalRateDetails: null }));
                        if (rateInfo) setRateInfo(rateInfo);
                      }}
                      style={{ padding: '4px 8px', border: '1px solid #e74c3c', borderRadius: 5, background: '#fff5f5', color: '#e74c3c', cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0 }}>
                      ↺
                    </button>
                  )}
                </div>
              ) : (
                <input value="Managed by OTA" readOnly style={{ ...inp, background: '#f5f5f5', color: '#999', cursor: 'not-allowed' }} />
              )}
              {!ratesEditable && showRates && (
                <div style={{ fontSize: '0.65rem', color: '#e67e22', marginTop: 2 }}>🔒 Rate editing requires Admin/Manager role</div>
              )}
            </label>

            {/* Extra Person Rate */}
            <label style={lbl}>Extra Person / Night (₹)
              {showRates ? (
                <input
                  type="number"
                  value={form.extraPersonCharge}
                  onChange={e => ratesEditable && setForm(p => ({ ...p, extraPersonCharge: e.target.value }))}
                  placeholder="0"
                  readOnly={!ratesEditable}
                  style={{ ...inp, background: !ratesEditable ? '#f5f5f5' : '#fff', cursor: !ratesEditable ? 'not-allowed' : 'text' }}
                  onFocus={focusInp} onBlur={blurInp}
                />
              ) : (
                <input value="Managed by OTA" readOnly style={{ ...inp, background: '#f5f5f5', color: '#999', cursor: 'not-allowed' }} />
              )}
            </label>
            <label style={{ ...lbl, gridColumn: '1/-1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Extra Child Charge / Night (₹)</span>
                {childrenAbove6 > 0 && (
                  <span style={{ fontSize: '0.68rem', background: '#fef5e7', color: '#d35400', border: '1px solid #f8c471', borderRadius: 10, padding: '2px 8px', fontWeight: 700 }}>
                    ⚠️ {childrenAbove6} child{childrenAbove6 > 1 ? 'ren' : ''} &gt;6 yrs
                  </span>
                )}
              </div>
              <input type="number" value={form.extraChildCharge} onChange={update('extraChildCharge')} placeholder="0"
                style={{ ...inp, border: childrenAbove6 > 0 ? '1.5px solid #e67e22' : '1.5px solid #ddd' }}
                onFocus={focusInp} onBlur={blurInp} />
              {childrenAbove6 > 0 && (
                <div style={{ fontSize: '0.7rem', color: '#d35400' }}>
                  Total: ₹{(parseFloat(form.extraChildCharge || 0) * childrenAbove6 * nights).toFixed(0)} ({childrenAbove6} child × ₹{form.extraChildCharge || 0} × {nights} nights)
                </div>
              )}
            </label>
            <label style={lbl}>GST %
  <input 
    value={`${parseFloat(form.baseRate||0) > 7499 ? 12 : 5}% (auto)`}
    style={{ ...inp, background: '#f0f7ff', fontWeight: 700, color: '#1565c0' }} 
    readOnly 
  />
</label>
            <label style={lbl}>Total Amount (₹)
              <input type="number" value={form.totalAmount || totalCalc} onChange={update('totalAmount')} style={inp} onFocus={focusInp} onBlur={blurInp} />
            </label>
            <label style={lbl}>Paid Amount (₹)
              <input type="number" value={form.paidAmount} onChange={update('paidAmount')} placeholder="0" style={inp} onFocus={focusInp} onBlur={blurInp} />
            </label>
            <label style={lbl}>Payment Status
              <select value={form.paymentStatus} onChange={update('paymentStatus')} style={inp}>
                {['paid','due','partial'].map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label style={lbl}>Payment Mode
              <select value={form.paymentMode} onChange={update('paymentMode')} style={{ ...inp, border: isPaymentModeMandatory && !form.paymentMode ? '1.5px solid #e74c3c' : '1.5px solid #ddd' }}>
                <option value="">--Select Payment Mode--</option>
                {['cash','card','UPI','bank transfer','cheque'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {isPaymentModeMandatory && !form.paymentMode && (
                <div style={{ fontSize: '0.7rem', color: '#e74c3c', marginTop: 4, fontWeight: 600 }}>
                  ⚠️ Payment mode is required for {form.source === 'direct' ? 'Direct' : 'Travel Agent'} bookings
                </div>
              )}
            </label>
          </div>

          {/* Price breakdown */}
          {nights > 0 && form.baseRate && (
            <div style={{ background: '#f0f7ff', border: '1px solid #b3d1f5', borderRadius: 8, padding: '12px 14px', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 700, color: '#1565c0', marginBottom: 8 }}>💰 Price Breakdown</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 12px', color: '#444' }}>
                <span>Base ({nights}N × ₹{form.baseRate})</span>
                <span style={{ fontWeight: 600, textAlign: 'right' }}>₹{(nights * parseFloat(form.baseRate || 0)).toFixed(0)}</span>
                {parseFloat(form.extraPersonCharge) > 0 && <>
                  <span>Extra adults</span>
                  <span style={{ fontWeight: 600, textAlign: 'right' }}>₹{(parseFloat(form.extraPersonCharge) * Math.max(0, parseInt(form.numGuests || 1) - 2) * nights).toFixed(0)}</span>
                </>}
                {childrenAbove6 > 0 && parseFloat(form.extraChildCharge) > 0 && <>
                  <span>Children &gt;6 yrs ({childrenAbove6})</span>
                  <span style={{ fontWeight: 600, color: '#e67e22', textAlign: 'right' }}>₹{(parseFloat(form.extraChildCharge) * childrenAbove6 * nights).toFixed(0)}</span>
                </>}
                {childrenBelow6 > 0 && <>
                  <span style={{ color: '#27ae60' }}>Children ≤6 yrs ({childrenBelow6})</span>
                  <span style={{ fontWeight: 600, color: '#27ae60', textAlign: 'right' }}>FREE</span>
                </>}
                <span>GST ({parseFloat(form.baseRate||0) > 7499 ? 12 : 5}%)</span>
                <span style={{ fontWeight: 600, textAlign: 'right' }}>₹{(((parseFloat(form.baseRate || 0) * nights) + (parseFloat(form.extraChildCharge || 0) * childrenAbove6 * nights)) * (parseFloat(form.gstPercent) / 100)).toFixed(0)}</span>
                <span style={{ fontWeight: 700, color: '#1565c0', borderTop: '1px solid #cde', paddingTop: 6 }}>Total</span>
                <span style={{ fontWeight: 800, color: '#1565c0', borderTop: '1px solid #cde', paddingTop: 6, textAlign: 'right' }}>₹{totalCalc}</span>
              </div>
            </div>
          )}

          {/* Balance */}
          <div style={{ background: parseFloat(balance) > 0 ? '#fff5f5' : '#f0fff4', border: `1.5px solid ${parseFloat(balance) > 0 ? '#fcc' : '#9be9a8'}`, borderRadius: 8, padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#555', fontSize: '0.85rem', fontWeight: 600 }}>Balance Due</span>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: parseFloat(balance) > 0 ? '#e74c3c' : '#27ae60' }}>₹{balance}</span>
            </div>
            {parseFloat(balance) > 0 && <div style={{ fontSize: '0.72rem', color: '#e74c3c', marginTop: 4 }}>⚠️ Payment pending</div>}
          </div>
        </>}

        {/* ══════════ COMMENTS TAB ══════════ */}
        {tab === 'comments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Add new comment box */}
            <div style={{ background: '#f8f9fa', border: '1px solid #e8eaed', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #1565c0, #42a5f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                  {currentUser?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1a1a2e' }}>{currentUser}</span>
              </div>
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment... (e.g. Guest requested lake view room)"
                rows={3}
                style={{ padding: '8px 10px', borderRadius: 7, border: '1.5px solid #ddd', fontSize: '0.82rem', resize: 'none', fontFamily: 'inherit', outline: 'none', transition: 'border 0.15s' }}
                onFocus={e => e.target.style.border = '1.5px solid #1565c0'}
                onBlur={e => e.target.style.border = '1.5px solid #ddd'}
                onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') handlePostComment(); }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: '#bbb' }}>Ctrl+Enter to post</span>
                <button
                  onClick={handlePostComment}
                  disabled={!newComment.trim()}
                  style={{ padding: '6px 18px', border: 'none', borderRadius: 7, background: newComment.trim() ? '#1565c0' : '#ddd', color: newComment.trim() ? '#fff' : '#999', cursor: newComment.trim() ? 'pointer' : 'not-allowed', fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.15s' }}
                >
                  💬 Post
                </button>
              </div>
            </div>

            {/* Comments list */}
            {(form.comments || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#bbb', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>💬</div>
                No comments yet. Add the first one!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600 }}>
                  {(form.comments || []).length} Comment{(form.comments || []).length > 1 ? 's' : ''}
                </div>
                {/* Latest first */}
                {[...(form.comments || [])].reverse().map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUser={currentUser}
                    onDelete={handleDeleteComment}
                    onEdit={handleEditComment}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '12px 22px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f7f8fa', flexShrink: 0, position: 'sticky', bottom: 0 }}>
        <div style={{ fontSize: '0.75rem', color: '#888', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {nights > 0 && <span>📅 {nights}N · ₹{totalCalc}</span>}
          {childrenAbove6 > 0 && <span style={{ color: '#e67e22' }}>⚠️ {childrenAbove6} child &gt;6</span>}
          {form.bookingId && <span style={{ color: '#1565c0' }}>🔖 {form.bookingId}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid #ddd', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500 }}>Cancel</button>
          <button
            onClick={() => {
              if (!form.guestName?.trim()) {
                alert('Guest name is required');
                return;
              }
              if (isPaymentModeMandatory && !form.paymentMode) {
                alert('Payment mode is required for Direct and Travel Agent bookings.');
                return;
              }
              onSaveBooking({ ...form, totalAmount: form.totalAmount || totalCalc, balance });
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