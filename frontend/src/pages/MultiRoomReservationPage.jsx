import { useState, useEffect } from 'react';

const OTA_PLATFORMS = ['Booking.com', 'MakeMyTrip', 'Agoda', 'Expedia', 'Goibibo', 'Airbnb', 'Yatra', 'Other OTA'];
const RATE_OVERRIDE_ROLES = ['Admin', 'Manager', 'Administrator'];

// ── Field helper ──────────────────────────────────────────────────────────────
function Field({ label, children, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: '0.8rem', color: '#444', fontWeight: 600, marginBottom: 4, display: 'block' }}>
        {label}{required && <span style={{ color: 'red' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

// ── Rate Override Indicator ───────────────────────────────────────────────────
function RateOverrideIndicator({ isOverride, originalRate, currentRate, overriddenBy, overriddenAt }) {
  const [show, setShow] = useState(false);
  if (!isOverride) return null;
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{
          background: '#f39c12', color: '#fff', fontSize: '0.55rem',
          fontWeight: 800, padding: '1px 5px', borderRadius: 3,
          cursor: 'help', letterSpacing: '0.03em', whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        ✏️ OVERRIDE
      </span>
      {show && (
        <div style={{
          position: 'absolute', bottom: '120%', left: 0, zIndex: 99999,
          background: '#1a1a2e', color: '#fff', borderRadius: 6,
          padding: '8px 12px', fontSize: '0.68rem', minWidth: 200,
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)', whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 5, color: '#f39c12' }}>Rate Manually Overridden</div>
          <div>Original: <strong>₹{originalRate ?? '—'}</strong>/night</div>
          <div>Current: <strong>₹{currentRate}</strong>/night</div>
          {overriddenBy && <div style={{ color: '#aaa', marginTop: 4 }}>By: {overriddenBy}</div>}
          {overriddenAt && <div style={{ color: '#aaa' }}>At: {new Date(overriddenAt).toLocaleString('en-IN')}</div>}
          <div style={{ marginTop: 4, color: '#f87171', fontSize: '0.6rem' }}>⚠️ Only applies to this reservation</div>
        </div>
      )}
    </div>
  );
}

// ── resolveRate ───────────────────────────────────────────────────────────────
function resolveRate({ travelAgentRates = [], seasons = [], agent, category, arrival }) {
  if (!agent || !category || !arrival) return { rate: 0, extraPersonRate: 0, source: 'default' };

  const agentRates = travelAgentRates.filter(
    r => r.agentName === agent.name && r.roomCategory === category
  );
  if (!agentRates.length) return { rate: 0, extraPersonRate: 0, source: 'default' };

  const arrDate = new Date(arrival);
  const matchedSeason = seasons.find(s => {
    const from = new Date(s.fromDate || s.startDate);
    const to = new Date(s.toDate || s.endDate);
    return arrDate >= from && arrDate <= to;
  });

  const seasonalRate = matchedSeason ? agentRates.find(r => r.seasonId === matchedSeason.id) : null;
  const offSeasonRate = agentRates.find(r => !r.seasonId || r.seasonId === 'off');
  const resolved = seasonalRate || offSeasonRate || agentRates[0];

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
  rooms,
  categoryColors,
  bookings,
  onSave,
  travelAgents = [],
  thirdParties = [],
  seasons = [],
  travelAgentRates = [],
  currentUser,
}) {
  const loggedUser = currentUser || (() => {
    try { return JSON.parse(localStorage.getItem('rms_loggedIn') || '{"name":"Staff","role":"Staff"}'); }
    catch { return { name: 'Staff', role: 'Staff' }; }
  })();

  const canOverrideRates = RATE_OVERRIDE_ROLES.includes(loggedUser?.role) || loggedUser?.name === 'Admin';

  const inp = {
    padding: '7px 10px', borderRadius: 5, border: '1px solid #ccc',
    fontSize: '0.82rem', width: '100%', boxSizing: 'border-box',
    outline: 'none', background: '#fff', color: '#1a1a2e',
  };

  const newRoom = () => ({
    id: Date.now() + Math.random(),
    roomCategory: '', roomName: '',
    occupancy: 1, extraPersons: 0, rate: 0, dnc: false,
    isRateOverridden: false, originalRateDetails: null,
    rateOverriddenBy: null, rateOverriddenAt: null,
  });

  const [form, setForm] = useState({
    guestName: '', phone: '', email: '',
    arrival: '', departure: '',
    source: 'direct', otaPlatform: '', bookingId: '', agentName: '',
    tags: [],
    rooms: [newRoom()],
  });

  const roomCategoriesString = form.rooms.map(r => r.roomCategory).join(',');

  useEffect(() => {
    if (form.source !== 'agent' || !form.agentName || !form.arrival) return;
    const agent = travelAgents.find(a => a.name === form.agentName);
    if (!agent) return;

    const updatedRooms = form.rooms.map(room => {
      if (room.isRateOverridden || !room.roomCategory) return room;
      const resolved = resolveRate({ travelAgentRates, seasons, agent, category: room.roomCategory, arrival: form.arrival });
      if (resolved.source !== 'default') {
        return { ...room, rate: resolved.rate, originalRateDetails: resolved };
      }
      return room;
    });

    if (JSON.stringify(updatedRooms) !== JSON.stringify(form.rooms)) {
      setForm(p => ({ ...p, rooms: updatedRooms }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.source, form.agentName, form.arrival, roomCategoriesString]);

  const availableRoomsByCategory = (category, currentRoomId) => {
    const bookedRoomNames = bookings.flatMap(b => {
      if (b.arrival && b.departure && form.arrival && form.departure) {
        const overlaps = new Date(form.arrival) < new Date(b.departure) && new Date(form.departure) > new Date(b.arrival);
        if (!overlaps) return [];
      }
      if (b.isMultiRoom && b.rooms?.length) return b.rooms.map(r => r.roomName);
      return [b.roomName];
    });
    const selectedInForm = form.rooms.filter(r => r.id !== currentRoomId).map(r => r.roomName);
    return rooms.filter(r => r.category === category && !bookedRoomNames.includes(r.name) && !selectedInForm.includes(r.name));
  };

  const addRoom = () => setForm(prev => ({ ...prev, rooms: [...prev.rooms, newRoom()] }));

  const removeRoom = (id) => {
    if (form.rooms.length === 1) { alert('At least one room is required'); return; }
    if (!window.confirm('Remove this room?')) return;
    setForm(prev => ({ ...prev, rooms: prev.rooms.filter(r => r.id !== id) }));
  };

  const updateRoom = (id, field, value) => {
    setForm(prev => ({
      ...prev,
      rooms: prev.rooms.map(room => {
        if (room.id !== id) return room;
        let updated = { ...room, [field]: value };

        if (field === 'rate' && canOverrideRates && !room.isRateOverridden) {
          updated.isRateOverridden = true;
          updated.rateOverriddenBy = loggedUser?.name || 'Staff';
          updated.rateOverriddenAt = new Date().toISOString();
          if (!updated.originalRateDetails) {
            updated.originalRateDetails = { rate: room.rate };
          }
        }

        if (field === 'roomCategory') {
          updated.roomName = '';
          updated.isRateOverridden = false;
          updated.originalRateDetails = null;
          updated.rateOverriddenBy = null;
          updated.rateOverriddenAt = null;
        }

        return updated;
      }),
    }));
  };

  const resetRoomOverride = (id) => {
    setForm(prev => ({
      ...prev,
      rooms: prev.rooms.map(room =>
        room.id !== id ? room : {
          ...room,
          isRateOverridden: false, originalRateDetails: null,
          rateOverriddenBy: null, rateOverriddenAt: null,
        }
      ),
    }));
  };

  const totalAmount = form.rooms.reduce((sum, r) => sum + parseFloat(r.rate || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.guestName || !form.arrival || !form.departure) { alert('Please fill required guest details'); return; }
    if (form.source === 'OTA' && !form.bookingId.trim()) { alert('Booking ID required for OTA'); return; }
    if (form.rooms.some(r => !r.roomName)) { alert('Please select all room numbers'); return; }
    if (new Set(form.rooms.map(r => r.roomName)).size !== form.rooms.length) { alert('Same room cannot be assigned twice'); return; }
    if (form.bookingId && bookings.some(b => b.bookingId?.toUpperCase() === form.bookingId.toUpperCase())) { alert('Duplicate Booking ID not allowed'); return; }

    const finalRooms = form.rooms.map(room => {
      if (room.isRateOverridden && room.originalRateDetails) {
        return {
          ...room,
          auditTrail: [...(room.auditTrail || []), {
            action: 'RATE_OVERRIDE',
            user: loggedUser?.name,
            timestamp: new Date().toISOString(),
            previousRate: room.originalRateDetails.rate,
            newRate: room.rate,
            details: `Rate for ${room.roomName} (${room.roomCategory}) changed from ₹${room.originalRateDetails.rate} → ₹${room.rate}`,
          }],
        };
      }
      return room;
    });

    onSave({
      ...form,
      rooms: finalRooms,
      id: `b${Date.now()}`,
      isMultiRoom: true,
      totalAmount,
      status: 'confirmed',
      timestamp: new Date().toISOString(),
    });

    alert('Multi room reservation saved');
    setForm({
      guestName: '', phone: '', email: '', arrival: '', departure: '',
      source: 'direct', otaPlatform: '', bookingId: '', agentName: '',
      tags: [], rooms: [newRoom()],
    });
  };

  return (
    <div style={{ padding: 24, fontFamily: 'inherit' }}>
      <h2 style={{ marginBottom: 20, color: '#1a1a2e' }}>🏨 Multi Room Reservation</h2>

      <form onSubmit={handleSubmit}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
          <Field label="Guest Name" required>
            <input value={form.guestName} onChange={e => setForm(p => ({ ...p, guestName: e.target.value }))} style={inp} placeholder="Enter guest name" />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={inp} placeholder="+91 XXXXX" />
          </Field>
          <Field label="Check-In" required>
            <input type="date" value={form.arrival} onChange={e => setForm(p => ({ ...p, arrival: e.target.value }))} style={inp} />
          </Field>
          <Field label="Check-Out" required>
            <input type="date" value={form.departure} onChange={e => setForm(p => ({ ...p, departure: e.target.value }))} style={inp} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
          <Field label="Booking Source">
            <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} style={inp}>
              <option value="direct">Direct</option>
              <option value="OTA">OTA</option>
              <option value="agent">Travel Agent</option>
              <option value="walkin">Walk-in</option>
            </select>
          </Field>

          {form.source === 'OTA' && <>
            <Field label="OTA Platform">
              <select value={form.otaPlatform} onChange={e => setForm(p => ({ ...p, otaPlatform: e.target.value }))} style={inp}>
                <option value="">Select OTA</option>
                {(thirdParties.length ? thirdParties.map(p => p.name) : OTA_PLATFORMS).map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Booking ID" required>
              <input
                value={form.bookingId}
                onChange={e => { const v = e.target.value.toUpperCase(); if (/^[A-Z0-9]*$/.test(v)) setForm(p => ({ ...p, bookingId: v })); }}
                placeholder="Enter Booking ID"
                style={inp}
              />
            </Field>
          </>}

          {form.source === 'agent' && (
            <Field label="Travel Agent" required>
              <select value={form.agentName} onChange={e => setForm(p => ({ ...p, agentName: e.target.value }))} style={{ ...inp, border: '1.5px solid #1565c0' }}>
                <option value="">--Select Travel Agent--</option>
                {travelAgents.map(a => <option key={a.id} value={a.name}>{a.name}{a.company ? ` (${a.company})` : ''}</option>)}
              </select>
              {!canOverrideRates && (
                <div style={{ fontSize: '0.62rem', color: '#e67e22', marginTop: 3 }}>🔒 Rate editing requires Admin/Manager role</div>
              )}
            </Field>
          )}
        </div>

        <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 10, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, color: '#1a1a2e' }}>Room Allocation</h3>
            <button type="button" onClick={addRoom} style={{ padding: '8px 16px', border: 'none', borderRadius: 6, background: '#1565c0', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>+ Add Room</button>
          </div>

          {form.rooms.map((room, idx) => (
            <div key={room.id} style={{ border: `1px solid ${room.isRateOverridden ? '#f39c12' : '#e5e7eb'}`, borderRadius: 8, padding: 16, marginBottom: 16, background: room.isRateOverridden ? '#fffbea' : '#fff' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <strong style={{ color: '#1a1a2e' }}>Room {idx + 1}</strong>
                  {room.isRateOverridden && (
                    <span style={{ background: '#f39c12', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '2px 7px', borderRadius: 4 }}>✏️ RATE OVERRIDDEN</span>
                  )}
                </div>
                <button type="button" onClick={() => removeRoom(room.id)} style={{ border: 'none', background: '#ffebee', color: '#c62828', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Remove</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: 14 }}>
                <Field label="Room Type">
                  <select value={room.roomCategory} onChange={e => updateRoom(room.id, 'roomCategory', e.target.value)} style={inp}>
                    <option value="">Select Category</option>
                    {Object.keys(categoryColors).map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>

                <Field label="Room Number">
                  <select value={room.roomName} onChange={e => updateRoom(room.id, 'roomName', e.target.value)} style={inp}>
                    <option value="">Select Room</option>
                    {availableRoomsByCategory(room.roomCategory, room.id).map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                  </select>
                </Field>

                <Field label="Occupancy">
                  <input type="number" min="1" value={room.occupancy} onChange={e => updateRoom(room.id, 'occupancy', e.target.value)} style={inp} />
                </Field>

                <Field label="Extra Persons">
                  <input type="number" min="0" value={room.extraPersons} onChange={e => updateRoom(room.id, 'extraPersons', e.target.value)} style={inp} />
                </Field>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.8rem', color: '#444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    Room Rate
                    <RateOverrideIndicator
                      isOverride={room.isRateOverridden}
                      originalRate={room.originalRateDetails?.rate}
                      currentRate={room.rate}
                      overriddenBy={room.rateOverriddenBy}
                      overriddenAt={room.rateOverriddenAt}
                    />
                  </label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input
                      type="number" min="0"
                      value={room.rate}
                      onChange={e => updateRoom(room.id, 'rate', e.target.value)}
                      readOnly={!canOverrideRates}
                      title={!canOverrideRates ? 'Only Admin/Manager can edit rates' : ''}
                      style={{
                        ...inp, flex: 1,
                        border: room.isRateOverridden ? '2px solid #f39c12' : '1px solid #ccc',
                        background: !canOverrideRates ? '#f5f5f5' : '#fff',
                        cursor: !canOverrideRates ? 'not-allowed' : 'text',
                      }}
                    />
                    {room.isRateOverridden && canOverrideRates && (
                      <button type="button" onClick={() => resetRoomOverride(room.id)} title="Reset to agent rate"
                        style={{ padding: '4px 6px', border: '1px solid #e74c3c', borderRadius: 4, background: '#fff5f5', color: '#e74c3c', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
                        ↺
                      </button>
                    )}
                  </div>
                  {!room.isRateOverridden && room.originalRateDetails?.source === 'agent' && (
                    <div style={{ fontSize: '0.6rem', color: '#1e8449', fontWeight: 700 }}>
                      ✓ Auto: {room.originalRateDetails.agentName} · {room.originalRateDetails.seasonName}
                    </div>
                  )}
                </div>

                <Field label="DNC Lock">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8 }}>
                    <input type="checkbox" checked={room.dnc || false} onChange={e => updateRoom(room.id, 'dnc', e.target.checked)} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c0392b' }}>⛔ DNC</span>
                  </div>
                </Field>
              </div>

              {room.isRateOverridden && (
                <div style={{ marginTop: 10, background: '#fffbea', border: '1px solid #ffe082', borderRadius: 5, padding: '6px 10px', fontSize: '0.7rem', color: '#7d5a00', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                  <span>
                    <strong>Rate changed:</strong> ₹{room.originalRateDetails?.rate ?? '—'} → ₹{room.rate}/night
                    &nbsp;·&nbsp; By: <strong>{room.rateOverriddenBy}</strong>
                    {room.rateOverriddenAt && <> &nbsp;·&nbsp; {new Date(room.rateOverriddenAt).toLocaleString('en-IN')}</>}
                  </span>
                  <span style={{ color: '#e67e22', fontWeight: 700, fontSize: '0.62rem' }}>⚠️ Master agent rates unchanged</span>
                </div>
              )}
            </div>
          ))}

          <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '1rem', color: '#1a1a2e', paddingTop: 8, borderTop: '1px solid #eee' }}>
            Total: ₹{totalAmount.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button type="submit" style={{ padding: '10px 28px', border: 'none', borderRadius: 6, background: '#1e8449', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
            Save Multi Room Reservation
          </button>
        </div>
      </form>
    </div>
  );
}

export default MultiRoomReservationPage;