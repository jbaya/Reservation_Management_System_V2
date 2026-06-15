import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const OTA_PLATFORMS = ['Booking.com', 'MakeMyTrip', 'Agoda', 'Expedia', 'Goibibo', 'Airbnb', 'Yatra', 'Other OTA'];

// ── Shared field wrapper ──────────────────────────────────────────────────────
function Field({ label, children, required, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: '0.78rem', color: '#444', fontWeight: 600, display: 'block' }}>
        {label}{required && <span style={{ color: '#e74c3c' }}> *</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize: '0.65rem', color: '#999' }}>{hint}</span>}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function Section({ icon, title, children, accent = '#1565c0' }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ background: `${accent}08`, borderBottom: `2px solid ${accent}22`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1rem' }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
      </div>
      <div style={{ padding: '16px' }}>
        {children}
      </div>
    </div>
  );
}

// ── Rate resolve helper ───────────────────────────────────────────────────────
function resolveRate({ travelAgentRates = [], seasons = [], agent, category, arrival }) {
  if (!agent || !category || !arrival) return { rate: 0, extraPersonRate: 0, source: 'default' };
  const agentRates = travelAgentRates.filter(r => r.agentName === agent.name && r.roomCategory === category);
  if (!agentRates.length) return { rate: 0, extraPersonRate: 0, source: 'default' };
  const arrDate = new Date(arrival);
  const matchedSeason = seasons.find(s => {
    const from = new Date(s.fromDate || s.startDate);
    const to   = new Date(s.toDate   || s.endDate);
    return arrDate >= from && arrDate <= to;
  });
  const seasonalRate  = matchedSeason ? agentRates.find(r => r.seasonId === matchedSeason.id) : null;
  const offSeasonRate = agentRates.find(r => !r.seasonId || r.seasonId === 'off');
  const resolved      = seasonalRate || offSeasonRate || agentRates[0];
  return {
    rate: resolved.roomRate ?? resolved.ratePerNight ?? 0,
    extraPersonRate: resolved.extraPersonRate ?? 0,
    source: 'agent',
    agentName: agent.name,
    seasonName: matchedSeason?.name || 'Off-Season',
  };
}

// ── Main Component ────────────────────────────────────────────────────────────
function MultiRoomReservationPage({
  editingBooking,
  rooms,
  categoryColors,
  bookings,
  onSave,
  travelAgents = [],
  thirdParties = [],
  seasons = [],
  travelAgentRates = [],
  currentUser,
  requestDncOverride,
}) {
  const [loggedUser] = useState(() => {
    if (currentUser) return currentUser;
    try { return JSON.parse(localStorage.getItem('rms_loggedIn') || '{"name":"Staff","role":"Staff"}'); }
    catch { return { name: 'Staff', role: 'Staff' }; }
  });

  const roomIdCounter = useRef(1000);
  const newRoomId = useCallback(() => { roomIdCounter.current += 1; return roomIdCounter.current; }, []);

  const newRoomRow = useCallback(() => ({
    id: newRoomId(),
    roomCategory: '', roomName: '',
    occupancy: 1, extraPersons: 0,
    mealPlan: 'EP',
    rate: 0, extraPersonRate: 0,
    dnc: false,
    isRateOverridden: false, originalRateDetails: null,
    rateOverriddenBy: null, rateOverriddenAt: null,
  }), [newRoomId]);

  // ── Empty form ────────────────────────────────────────────────────────────
  const buildEmptyForm = useCallback(() => ({
    // Guest
    guestName: '', phone: '', email: '', nationality: '',
    // Stay
    arrival: '', departure: '', arrivalTime: '12:00', departureTime: '10:00',
    // Booking source
    source: 'direct', otaPlatform: '', bookingId: '', agentName: '',
    // Tags & flags
    tags: [], dnc: false,
    status: 'confirmed',
    // Rooms
    rooms: [newRoomRow()],
    // Billing
    discount: 0,
    advanceParticulars: 0, advancePaymentType: 'None',
    paymentMode: '',
    paymentStatus: 'due',
    // Notes
    comments: [],
    specialRequests: '',
  }), [newRoomRow]);

  // ── Build from existing booking ───────────────────────────────────────────
  const buildFormFromBooking = useCallback((b) => ({
    guestName:          b.guestName          || '',
    phone:              b.phone              || '',
    email:              b.email              || '',
    nationality:        b.nationality        || '',
    arrival:            b.arrival            || '',
    departure:          b.departure          || '',
    arrivalTime:        b.arrivalTime        || '12:00',
    departureTime:      b.departureTime      || '10:00',
    source:             b.source             || 'direct',
    otaPlatform:        b.otaPlatform        || '',
    bookingId:          b.bookingId          || '',
    agentName:          b.agentName          || '',
    tags:               b.tags               || [],
    dnc:                b.dnc                || false,
    status:             b.status             || 'confirmed',
    rooms: b.rooms?.length
      ? b.rooms.map(r => ({ ...newRoomRow(), ...r, id: r.id ?? newRoomId() }))
      : [newRoomRow()],
    discount:           b.discount           || 0,
    advanceParticulars: b.advanceParticulars || 0,
    advancePaymentType: b.advancePaymentType || 'None',
    paymentMode:        b.paymentMode        || '',
    paymentStatus:      b.paymentStatus      || 'due',
    comments:           b.comments           || [],
    specialRequests:    b.specialRequests    || '',
  }), [newRoomRow, newRoomId]);

  const [form, setForm]       = useState(() => editingBooking ? buildFormFromBooking(editingBooking) : buildEmptyForm());
  const [success, setSuccess] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    setForm(editingBooking ? buildFormFromBooking(editingBooking) : buildEmptyForm());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingBooking?.id]);

  // ── Agent rate auto-apply ─────────────────────────────────────────────────
  const roomCategoriesString = form.rooms.map(r => r.roomCategory).join(',');
  useEffect(() => {
    if (form.source !== 'agent' || !form.agentName || !form.arrival) return;
    const agent = travelAgents.find(a => a.name === form.agentName);
    if (!agent) return;
    setForm(prev => {
      const updated = prev.rooms.map(room => {
        if (room.isRateOverridden || !room.roomCategory) return room;
        const resolved = resolveRate({ travelAgentRates, seasons, agent, category: room.roomCategory, arrival: prev.arrival });
        return resolved.source !== 'default' ? { ...room, rate: resolved.rate, originalRateDetails: resolved } : room;
      });
      if (JSON.stringify(updated) === JSON.stringify(prev.rooms)) return prev;
      return { ...prev, rooms: updated };
    });
  }, [form.source, form.agentName, form.arrival, roomCategoriesString, travelAgents, travelAgentRates, seasons]);

  // ── Available rooms per row ───────────────────────────────────────────────
  const availableRoomsByCategory = useCallback((category, currentRowId) => {
    const booked = bookings.flatMap(b => {
      if (editingBooking && b.id === editingBooking.id) return [];
      if (!form.arrival || !form.departure) return [];
      const overlaps = new Date(form.arrival) < new Date(b.departure) && new Date(form.departure) > new Date(b.arrival);
      if (!overlaps) return [];
      return b.rooms?.length ? b.rooms.map(r => r.roomName) : (b.roomName ? [b.roomName] : []);
    });
    const selectedElsewhere = form.rooms.filter(r => r.id !== currentRowId).map(r => r.roomName).filter(Boolean);
    return rooms.filter(r => r.category === category && !booked.includes(r.name) && !selectedElsewhere.includes(r.name));
  }, [bookings, editingBooking, form.arrival, form.departure, form.rooms, rooms]);

  // ── Room row actions ──────────────────────────────────────────────────────
  const addRoom    = () => setForm(p => ({ ...p, rooms: [...p.rooms, newRoomRow()] }));
  const removeRoom = (id) => {
    if (form.rooms.length === 1) { alert('At least one room required'); return; }
    if (!window.confirm('Remove this room?')) return;
    setForm(p => ({ ...p, rooms: p.rooms.filter(r => r.id !== id) }));
  };
  const updateRoom = (id, field, value) => {
    setForm(p => ({
      ...p,
      rooms: p.rooms.map(room => {
        if (room.id !== id) return room;
        let u = { ...room, [field]: value };
        if (field === 'rate' && !room.isRateOverridden) {
          u.isRateOverridden = true;
          u.rateOverriddenBy = loggedUser?.name || 'Staff';
          u.rateOverriddenAt = new Date().toISOString();
          if (!u.originalRateDetails) u.originalRateDetails = { rate: room.rate };
        }
        if (field === 'roomCategory') {
          u.roomName = ''; u.isRateOverridden = false;
          u.originalRateDetails = null; u.rateOverriddenBy = null; u.rateOverriddenAt = null;
        }
        return u;
      }),
    }));
  };

  // ── Billing computations ──────────────────────────────────────────────────
  const nights = form.arrival && form.departure
    ? Math.max(0, Math.round((new Date(form.departure) - new Date(form.arrival)) / 86400000))
    : 0;

  const roomsTotal = useMemo(() =>
    form.rooms.reduce((sum, r) => sum + (parseFloat(r.rate || 0) * nights), 0),
  [form.rooms, nights]);

  const extraPersonTotal = useMemo(() =>
    form.rooms.reduce((sum, r) => sum + (parseFloat(r.extraPersonRate || 0) * (parseInt(r.extraPersons) || 0) * nights), 0),
  [form.rooms, nights]);

  const subTotal  = roomsTotal + extraPersonTotal;
  const avgRate   = form.rooms.length > 0 ? roomsTotal / Math.max(nights, 1) / form.rooms.length : 0;
  const autoGst   = avgRate > 7499 ? 18 : avgRate > 2499 ? 12 : 5;
  const gstAmt    = subTotal * (autoGst / 100);
  const totalCharges = subTotal + gstAmt;
  const discount  = parseFloat(form.discount || 0);
  const netAmount = Math.max(0, totalCharges - discount);
  const advance   = parseFloat(form.advanceParticulars || 0);
  const balanceDue = Math.max(0, netAmount - advance);

  // ── Tags ─────────────────────────────────────────────────────────────────
  const toggleTag = (tag) => setForm(p => ({
    ...p,
    tags: p.tags?.includes(tag) ? p.tags.filter(t => t !== tag) : [...(p.tags || []), tag],
  }));

  const toggleDnc = () => setForm(p => {
    const newDnc = !p.dnc;
    let tags = [...(p.tags || [])];
    if (newDnc) { if (!tags.includes('DNC')) tags.push('DNC'); }
    else tags = tags.filter(t => t !== 'DNC');
    return { ...p, dnc: newDnc, tags };
  });

  // ── Comments ──────────────────────────────────────────────────────────────
  const addComment = () => {
    if (!newComment.trim()) return;
    setForm(p => ({
      ...p,
      comments: [...(p.comments || []), {
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: newComment.trim(),
        author: loggedUser?.name || 'Staff',
        createdAt: new Date().toISOString(),
      }],
    }));
    setNewComment('');
  };
  const deleteComment = (id) => setForm(p => ({ ...p, comments: (p.comments || []).filter(c => c.id !== id) }));

  // ── Shared input style ────────────────────────────────────────────────────
  const inp = {
    padding: '6px 9px', borderRadius: 5, border: '1px solid #ccc',
    fontSize: '0.8rem', width: '100%', boxSizing: 'border-box',
    outline: 'none', background: '#fff', color: '#1a1a2e',
  };

  const dateInp = {
  padding: '6px 9px',
  borderRadius: 5,
  border: '1px solid #ccc',
  fontSize: '0.8rem',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
  background: '#fff',
  color: '#1a1a2e',
  cursor: 'pointer',
  // Force calendar icon always visible
  colorScheme: 'light',
};
  const readonlyInp = { ...inp, background: '#f0f7ff', fontWeight: 700, color: '#1565c0', cursor: 'default' };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!form.guestName?.trim())          { alert('❌ Guest name is required.');          return; }
    if (form.guestName.trim().length < 2) { alert('❌ Guest name must be at least 2 characters.'); return; }
    if (!form.arrival || !form.departure) { alert('❌ Check-In and Check-Out dates are required.'); return; }
    if (new Date(form.departure) <= new Date(form.arrival)) { alert('❌ Check-Out must be after Check-In.'); return; }
    if (nights > 365) { alert('❌ Stay cannot exceed 365 nights.'); return; }
    if (!form.nationality)                { alert('❌ Nationality is required.');          return; }
    if (form.source === 'OTA' && !form.bookingId?.trim()) { alert('❌ Booking ID is required for OTA.'); return; }
    if (form.source === 'agent' && !form.agentName)       { alert('❌ Please select a Travel Agent.'); return; }
    if (form.rooms.some(r => !r.roomName))                { alert('❌ Please select all room numbers.'); return; }
    if (new Set(form.rooms.map(r => r.roomName)).size !== form.rooms.length) { alert('❌ Same room cannot be assigned twice.'); return; }
    if (advance > netAmount && netAmount > 0) { alert(`❌ Advance (₹${advance}) cannot exceed net amount (₹${netAmount.toFixed(2)}).`); return; }
    if (advance > 0 && form.advancePaymentType === 'None') { alert('❌ Select Advance Payment Type.'); return; }

    const bookingPayload = {
      ...form,
      id:           editingBooking?.id || `b${Date.now()}`,
      isMultiRoom:  true,
      totalAmount:  netAmount.toFixed(2),
      balance:      balanceDue.toFixed(2),
      paymentStatus: balanceDue <= 0 ? 'paid' : advance > 0 ? 'partial' : 'due',
      numGuests:    form.rooms.reduce((s, r) => s + (parseInt(r.occupancy) || 1), 0),
      timestamp:    new Date().toISOString(),
    };

    try {
      await onSave(bookingPayload);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setForm(buildEmptyForm()); }, 2500);
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save reservation.');
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
      <h2 style={{ color: '#1e8449', margin: '0 0 8px' }}>Multi-Room Reservation Saved!</h2>
      <p style={{ color: '#666', fontSize: '0.88rem', textAlign: 'center' }}>
        <strong>{form.guestName}</strong> — {form.rooms.length} room{form.rooms.length > 1 ? 's' : ''}<br />
        {form.arrival} → {form.departure} ({nights} night{nights !== 1 ? 's' : ''})
      </p>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1100, fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#1a1a2e' }}>🏨 Multi Room Reservation</h2>
        {editingBooking && (
          <span style={{ background: '#fff3cd', color: '#856404', padding: '4px 12px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
            ✏️ Editing Booking
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── SECTION 1: Stay Details ── */}
        <Section icon="📅" title="Stay Details" accent="#1565c0">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
            <Field label="Check-In Date" required>
              <input
  type="date"
  value={form.arrival}
  onChange={e => setForm(p => ({ ...p, arrival: e.target.value }))}
  style={{ ...inp, ...dateInp }}
/>
            </Field>
            <Field label="Check-Out Date" required>
              <input
  type="date"
  value={form.departure}
  min={form.arrival || ''}
  onChange={e => {
    if (form.arrival && e.target.value <= form.arrival) {
      alert('❌ Check-Out must be after Check-In.');
      return;
    }
    setForm(p => ({ ...p, departure: e.target.value }));
  }}
  style={{ ...inp, ...dateInp }}
/>
            </Field>
            <Field label="Check-In Time">
              <input type="time" value={form.arrivalTime}
                onChange={e => setForm(p => ({ ...p, arrivalTime: e.target.value }))}
                style={inp} />
            </Field>
            <Field label="Check-Out Time">
              <input type="time" value={form.departureTime}
                onChange={e => setForm(p => ({ ...p, departureTime: e.target.value }))}
                style={inp} />
            </Field>
          </div>

          {nights > 0 && (
            <div style={{ background: '#e3f0ff', border: '1px solid #90caf9', borderRadius: 6, padding: '7px 12px', fontSize: '0.75rem', color: '#1565c0', fontWeight: 700 }}>
              📅 {nights} night{nights !== 1 ? 's' : ''} stay &nbsp;·&nbsp; {form.rooms.length} room{form.rooms.length !== 1 ? 's' : ''}
              &nbsp;·&nbsp; Total pax: {form.rooms.reduce((s, r) => s + (parseInt(r.occupancy) || 1), 0)}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <Field label="Reservation Status">
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={inp}>
                {['inquiry', 'tentative', 'confirmed', 'checked-in'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </Field>
            <Field label="Meal Plan (default for all rooms)">
              <select value={form.mealPlan || 'EP'} onChange={e => setForm(p => ({ ...p, mealPlan: e.target.value }))} style={inp}>
                {['EP', 'CP', 'MAP', 'AP'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
          </div>
        </Section>

        {/* ── SECTION 2: Guest Details ── */}
        <Section icon="👤" title="Guest Details" accent="#1e8449">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <Field label="Guest Name" required>
              <input value={form.guestName}
                onChange={e => setForm(p => ({ ...p, guestName: e.target.value }))}
                placeholder="Full name" style={inp} />
            </Field>
            <Field label="Phone">
              <input value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+91 XXXXX" style={inp} />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="guest@email.com" style={inp} />
            </Field>
            <Field label="Nationality" required>
              <select value={form.nationality}
                onChange={e => setForm(p => ({ ...p, nationality: e.target.value }))}
                style={inp}>
                <option value="">--Select--</option>
                <option value="Indian">Indian</option>
                <option value="Foreigner">Foreigner</option>
              </select>
            </Field>
          </div>

          {/* Tags */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', marginBottom: 7 }}>Guest Tags</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['VIP', 'DND', 'Honeymoon', 'Anniversary', 'Birthday', 'Corporate'].map(tag => {
                const active = form.tags?.includes(tag);
                return (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)}
                    style={{
                      padding: '3px 10px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                      border: active ? '2px solid #1565c0' : '2px solid #ddd',
                      background: active ? '#e3f0ff' : '#f8f9fa',
                      color: active ? '#1565c0' : '#666', transition: 'all 0.12s',
                    }}>
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DNC */}
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, border: `1px solid ${form.dnc ? '#e74c3c' : '#ddd'}`, background: form.dnc ? '#fff5f5' : '#fafafa', display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, flexShrink: 0 }}>
              <input type="checkbox" checked={form.dnc} onChange={toggleDnc} style={{ display: 'none' }} />
              <span style={{ position: 'absolute', inset: 0, background: form.dnc ? '#e74c3c' : '#bbb', borderRadius: 20, cursor: 'pointer', transition: '0.2s' }} />
              <span style={{ position: 'absolute', top: 3, left: form.dnc ? 22 : 3, width: 18, height: 18, background: '#fff', borderRadius: '50%', transition: '0.2s' }} />
            </label>
            <div>
              <div style={{ fontWeight: 700, color: form.dnc ? '#c0392b' : '#444', fontSize: '0.82rem' }}>
                🚫 DNC — Do Not Change
                {form.dnc && <span style={{ marginLeft: 8, background: '#e74c3c', color: '#fff', padding: '1px 7px', borderRadius: 8, fontSize: '0.65rem' }}>ACTIVE</span>}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#777', marginTop: 2 }}>Admin approval required for room changes on this reservation.</div>
            </div>
          </div>
        </Section>

        {/* ── SECTION 3: Booking Source ── */}
        <Section icon="📋" title="Booking Source" accent="#7b241c">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <Field label="Booking Reference" required>
              <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value, agentName: '', otaPlatform: '', bookingId: '' }))} style={inp}>
                {['direct', 'OTA', 'agent', 'walkin', 'corporate'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </Field>

            {form.source === 'OTA' && <>
              <Field label="OTA Platform">
                <select value={form.otaPlatform} onChange={e => setForm(p => ({ ...p, otaPlatform: e.target.value }))} style={inp}>
                  <option value="">--Select OTA--</option>
                  {(thirdParties.length ? thirdParties.map(p => p.name) : OTA_PLATFORMS).map(p => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Field>
              <Field label="Booking ID" required>
                <input value={form.bookingId}
                  onChange={e => { const v = e.target.value.toUpperCase(); if (/^[A-Z0-9]*$/.test(v)) setForm(p => ({ ...p, bookingId: v })); }}
                  placeholder="OTA Booking ID" style={inp} />
              </Field>
            </>}

            {form.source === 'agent' && (
              <Field label="Travel Agent" required>
                <select value={form.agentName} onChange={e => setForm(p => ({ ...p, agentName: e.target.value }))} style={{ ...inp, border: '1.5px solid #1565c0' }}>
                  <option value="">--Select Agent--</option>
                  {travelAgents.map(a => (
                    <option key={a.id} value={a.name}>{a.name}{a.company ? ` (${a.company})` : ''}</option>
                  ))}
                </select>
              </Field>
            )}
          </div>
        </Section>

        {/* ── SECTION 4: Room Allocation ── */}
        <Section icon="🛏️" title="Room Allocation" accent="#6c3483">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button type="button" onClick={addRoom}
              style={{ padding: '7px 16px', border: 'none', borderRadius: 6, background: '#1565c0', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
              + Add Room
            </button>
          </div>

          {form.rooms.map((room, idx) => (
            <div key={room.id} style={{
              border: `1px solid ${room.isRateOverridden ? '#f39c12' : '#e5e7eb'}`,
              borderRadius: 8, marginBottom: 14,
              background: room.isRateOverridden ? '#fffbea' : idx % 2 === 0 ? '#fafafa' : '#fff',
              overflow: 'hidden',
            }}>
              {/* Room row header */}
              <div style={{ background: room.isRateOverridden ? '#fff3cd' : '#f0f2f5', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.85rem' }}>Room {idx + 1}</span>
                  {room.roomName && <span style={{ background: '#1565c020', color: '#1565c0', fontSize: '0.68rem', fontWeight: 700, padding: '1px 7px', borderRadius: 4 }}>#{room.roomName}</span>}
                  {room.roomCategory && <span style={{ background: '#6c348320', color: '#6c3483', fontSize: '0.65rem', fontWeight: 600, padding: '1px 6px', borderRadius: 4 }}>{room.roomCategory}</span>}
                  {room.isRateOverridden && <span style={{ background: '#f39c12', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '1px 6px', borderRadius: 4 }}>✏️ OVERRIDE</span>}
                </div>
                <button type="button" onClick={() => removeRoom(room.id)}
                  style={{ border: 'none', background: '#ffebee', color: '#c62828', padding: '5px 12px', borderRadius: 5, cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>
                  Remove
                </button>
              </div>

              {/* Room row fields */}
              <div style={{ padding: '12px 14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 10 }}>
                  <Field label="Room Type" required>
                    <select value={room.roomCategory} onChange={e => updateRoom(room.id, 'roomCategory', e.target.value)} style={inp}>
                      <option value="">Select Category</option>
                      {Object.keys(categoryColors).map(c => <option key={c}>{c}</option>)}
                    </select>
                  </Field>

                  <Field label="Room Number" required>
                    <select value={room.roomName} onChange={e => updateRoom(room.id, 'roomName', e.target.value)} style={inp}>
                      <option value="">Select Room</option>
                      {availableRoomsByCategory(room.roomCategory, room.id).map(r => (
                        <option key={r.name} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Meal Plan">
                    <select value={room.mealPlan || 'EP'} onChange={e => updateRoom(room.id, 'mealPlan', e.target.value)} style={inp}>
                      {['EP', 'CP', 'MAP', 'AP'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </Field>

                  <Field label="Occupancy">
                    <input type="number" min="1" value={room.occupancy}
                      onChange={e => updateRoom(room.id, 'occupancy', e.target.value)} style={inp} />
                  </Field>

                  <Field label="Extra Persons">
                    <input type="number" min="0" value={room.extraPersons}
                      onChange={e => updateRoom(room.id, 'extraPersons', e.target.value)} style={inp} />
                  </Field>

                  <Field label="DNC Lock">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 6 }}>
                      <input type="checkbox" checked={room.dnc || false}
                        onChange={e => updateRoom(room.id, 'dnc', e.target.checked)} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c0392b' }}>⛔ DNC</span>
                    </div>
                  </Field>
                </div>

                {/* Rates row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, background: '#f8f9fa', borderRadius: 6, padding: '10px 12px' }}>
                  <Field label="Rate / Night (₹)">
                    <div style={{ display: 'flex', gap: 4 }}>
                      <input type="number" min="0" value={room.rate}
                        onChange={e => updateRoom(room.id, 'rate', e.target.value)}
                        style={{ ...inp, flex: 1, border: room.isRateOverridden ? '2px solid #f39c12' : '1px solid #ccc' }} />
                      {room.isRateOverridden && (
                        <button type="button" title="Reset to original"
                          onClick={() => setForm(p => ({ ...p, rooms: p.rooms.map(r => r.id !== room.id ? r : { ...r, isRateOverridden: false, originalRateDetails: null, rateOverriddenBy: null, rateOverriddenAt: null }) }))}
                          style={{ padding: '0 6px', border: '1px solid #e74c3c', borderRadius: 4, background: '#fff5f5', color: '#e74c3c', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>↺</button>
                      )}
                    </div>
                    {!room.isRateOverridden && room.originalRateDetails?.source === 'agent' && (
                      <div style={{ fontSize: '0.6rem', color: '#1e8449', fontWeight: 700, marginTop: 2 }}>✓ Auto: {room.originalRateDetails.agentName}</div>
                    )}
                  </Field>

                  <Field label="Extra Person Rate (₹)">
                    <input type="number" min="0" value={room.extraPersonRate || 0}
                      onChange={e => updateRoom(room.id, 'extraPersonRate', e.target.value)} style={inp} />
                  </Field>

                  <Field label="Room Total (₹)">
                    <input value={`₹${(parseFloat(room.rate || 0) * nights).toLocaleString('en-IN')}`} readOnly style={readonlyInp} />
                  </Field>

                  <Field label="Extra Persons Total (₹)">
                    <input value={`₹${(parseFloat(room.extraPersonRate || 0) * (parseInt(room.extraPersons) || 0) * nights).toLocaleString('en-IN')}`} readOnly style={readonlyInp} />
                  </Field>
                </div>
              </div>
            </div>
          ))}

          {/* Rooms summary */}
          {nights > 0 && (
            <div style={{ background: '#1a1a2e', borderRadius: 8, padding: '12px 16px', marginTop: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  ['Rooms Subtotal', `₹${roomsTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
                  ['Extra Persons', `₹${extraPersonTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
                  ['GST (%)', `${autoGst}%`],
                  ['GST Amount', `₹${gstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.6rem', color: '#aaa', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* ── SECTION 5: Billing ── */}
        <Section icon="💰" title="Billing Details" accent="#d4ac0d">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
            <Field label="Total Charges (₹)">
              <input value={totalCharges.toFixed(2)} readOnly style={readonlyInp} />
            </Field>
            <Field label="Discount (₹)">
              <input type="number" min="0" value={form.discount}
                onChange={e => setForm(p => ({ ...p, discount: e.target.value }))} style={inp} placeholder="0" />
            </Field>
            <Field label="Net Amount (₹)">
              <input value={netAmount.toFixed(2)} readOnly style={{ ...readonlyInp, color: '#1e8449' }} />
            </Field>
            <Field label="GST % (auto)">
              <input value={`${autoGst}% GST`} readOnly style={readonlyInp} />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
            <Field label="Advance Payment (₹)">
              <input type="number" min="0" value={form.advanceParticulars}
                onChange={e => setForm(p => ({ ...p, advanceParticulars: e.target.value }))} style={inp} placeholder="0" />
            </Field>
            <Field label="Advance Payment Type" required={advance > 0}>
              <select value={form.advancePaymentType}
                onChange={e => setForm(p => ({ ...p, advancePaymentType: e.target.value }))} style={inp}>
                {['None', 'Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque'].map(m => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Balance Due (₹)">
              <input value={balanceDue.toFixed(2)} readOnly
                style={{ ...inp, fontWeight: 800, fontSize: '0.9rem', background: balanceDue > 0 ? '#fff5f5' : '#f0fff4', color: balanceDue > 0 ? '#e74c3c' : '#27ae60' }} />
            </Field>
            <Field label="Payment Status">
              <input value={balanceDue <= 0 ? '✅ Paid' : advance > 0 ? '⚡ Partial' : '❌ Due'} readOnly
                style={{ ...inp, fontWeight: 700, color: balanceDue <= 0 ? '#1e8449' : advance > 0 ? '#e67e22' : '#e74c3c', background: '#f8f9fa' }} />
            </Field>
          </div>

          {/* Billing summary strip */}
          {nights > 0 && (
            <div style={{ background: '#e3f0ff', border: '1px solid #90caf9', borderRadius: 6, padding: '7px 12px', fontSize: '0.72rem', color: '#1565c0', fontWeight: 600 }}>
              📅 {nights} night{nights !== 1 ? 's' : ''} × {form.rooms.length} room{form.rooms.length !== 1 ? 's' : ''}
              &nbsp;|&nbsp; Subtotal: ₹{subTotal.toFixed(0)}
              &nbsp;|&nbsp; GST ({autoGst}%): ₹{gstAmt.toFixed(0)}
              &nbsp;|&nbsp; Total: ₹{totalCharges.toFixed(0)}
              {discount > 0 && <> &nbsp;|&nbsp; Discount: -₹{discount.toFixed(0)}</>}
              &nbsp;|&nbsp; <strong>Net: ₹{netAmount.toFixed(0)}</strong>
            </div>
          )}
        </Section>

        {/* ── SECTION 6: Payment Mode ── */}
        <Section icon="💳" title="Payment Mode" accent="#c0392b">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, alignItems: 'end' }}>
            <Field label="Payment Mode" required={form.source === 'direct' || form.source === 'agent'}>
              <select value={form.paymentMode}
                onChange={e => setForm(p => ({ ...p, paymentMode: e.target.value }))}
                style={{ ...inp, border: (form.source === 'direct' || form.source === 'agent') && !form.paymentMode ? '1.5px solid #e74c3c' : '1px solid #ccc' }}>
                <option value="">--Select--</option>
                {['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque'].map(m => <option key={m}>{m}</option>)}
              </select>
            </Field>
            {(form.source === 'direct' || form.source === 'agent') && (
              <div style={{ background: '#fef5e7', border: '1px solid #f8c471', borderRadius: 5, padding: '7px 10px', fontSize: '0.7rem', color: '#d35400', fontWeight: 600 }}>
                ⚠️ Payment mode is mandatory for {form.source === 'direct' ? 'Direct' : 'Travel Agent'} bookings.
              </div>
            )}
          </div>
        </Section>

        {/* ── SECTION 7: Special Requests & Comments ── */}
        <Section icon="📝" title="Special Requests & Comments" accent="#546e7a">
          <div style={{ marginBottom: 12 }}>
            <Field label="Special Requests / Notes">
              <textarea value={form.specialRequests}
                onChange={e => setForm(p => ({ ...p, specialRequests: e.target.value }))}
                placeholder="Room preferences, early check-in, late check-out, special occasions, dietary requirements..."
                rows={2}
                style={{ ...inp, resize: 'vertical', minHeight: 60,maxWidth: 420 }} />
            </Field>
          </div>

          {/* Comment thread */}
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', marginBottom: 8 }}>💬 Internal Comments</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, maxWidth: 480 }}>
              <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                placeholder="Internal note or remark..."
                maxLength={500} rows={2}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(); } }}
                style={{ flex: 1, minHeight: 60, resize: 'none', padding: '6px 8px', borderRadius: 5, border: '1px solid #ccc', fontSize: '0.78rem', fontFamily: 'inherit', outline: 'none' }} />
              <button type="button" onClick={addComment} disabled={!newComment.trim()}
                style={{ padding: '6px 14px', border: 'none', borderRadius: 5, background: newComment.trim() ? '#1565c0' : '#b0c4de', color: '#fff', cursor: newComment.trim() ? 'pointer' : 'default', fontWeight: 700, fontSize: '0.72rem', alignSelf: 'flex-start' }}>
                Post
              </button>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#aaa', marginBottom: 8 }}>{newComment.length}/500 · Enter to post, Shift+Enter for newline</div>

            {(form.comments || []).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                {[...(form.comments || [])].reverse().map(c => (
                  <div key={c.id} style={{ background: '#fffde7', border: '1px solid #ffe082', borderRadius: 6, padding: '7px 10px', display: 'flex', gap: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1565c0', color: '#fff', fontSize: '0.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {(c.author || 'S')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5d4037' }}>{c.author}</span>
                        <span style={{ fontSize: '0.6rem', color: '#bbb' }}>{new Date(c.createdAt).toLocaleString('en-IN')}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#6d4c00', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{c.text}</p>
                    </div>
                    <button type="button" onClick={() => deleteComment(c.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '0.8rem', flexShrink: 0, alignSelf: 'flex-start' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#e74c3c'}
                      onMouseLeave={e => e.currentTarget.style.color = '#ccc'}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* ── Submit bar ── */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '16px 0', borderTop: '2px solid #e8eaed' }}>
          <button type="submit"
            style={{ padding: '10px 32px', border: 'none', borderRadius: 7, background: '#1e8449', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}>
            {editingBooking ? '💾 Update Reservation' : '✅ Save Multi Room Reservation'}
          </button>
          <button type="button" onClick={() => setForm(buildEmptyForm())}
            style={{ padding: '10px 24px', border: '1px solid #ddd', borderRadius: 7, background: '#f5f5f5', color: '#555', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
            Reset
          </button>
          {nights > 0 && (
            <div style={{ marginLeft: 'auto', fontSize: '0.88rem', fontWeight: 800, color: '#1a1a2e' }}>
              Total: <span style={{ color: '#1565c0' }}>₹{netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>

      </form>
    </div>
  );
}

export default MultiRoomReservationPage;