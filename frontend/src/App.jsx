import { useEffect, useState } from 'react';
import CalendarView from './components/CalendarView.jsx';
import BookingForm from './components/BookingForm.jsx';
import Modal from './components/Modal.jsx';
import { addMonths, subMonths, format, addDays } from 'date-fns';

const AUTO_COLORS = [
  { bg: '#d5e8d4', border: '#27ae60' },
  { bg: '#dae8fc', border: '#2980b9' },
  { bg: '#e1d5e7', border: '#8e44ad' },
  { bg: '#ffe6cc', border: '#e67e22' },
  { bg: '#f8cecc', border: '#e74c3c' },
  { bg: '#fff2cc', border: '#f39c12' },
  { bg: '#d0e0e3', border: '#16a085' },
  { bg: '#f5deb3', border: '#a0522d' },
  { bg: '#e8daef', border: '#6c3483' },
  { bg: '#d6eaf8', border: '#1a5276' },
];

const sampleBookings = [
  { id: 'b1', guestName: 'Amit Mistry', roomName: '104', status: 'confirmed', arrival: '2026-05-03', departure: '2026-05-07', mealPlan: 'MAP', paymentStatus: 'paid', numGuests: 2, phone: '9876543210', notes: 'Early check-in requested', source: 'direct', totalAmount: 12000, paidAmount: 12000, balance: 0, tags: ['VIP'] },
  { id: 'b2', guestName: 'Sanjay Mehta', roomName: '102', status: 'tentative', arrival: '2026-05-04', departure: '2026-05-08', mealPlan: 'EP', paymentStatus: 'due', numGuests: 1, phone: '9123456780', source: 'OTA', totalAmount: 8000, paidAmount: 0, balance: 8000 },
  { id: 'b3', guestName: 'Priya Shah', roomName: '101', status: 'checked-in', arrival: '2026-05-01', departure: '2026-05-05', mealPlan: 'CP', paymentStatus: 'partial', numGuests: 2, source: 'agent', totalAmount: 10000, paidAmount: 5000, balance: 5000, tags: ['DND'] },
];

const initialCategoryColors = {
  'Royal Heritage': { bg: '#c18585', border: '#c0392b' },
  'Heritage':       { bg: '#79a5c6', border: '#1565c0' },
  'Suite':          { bg: '#956eba', border: '#6c3483' },
};

const initialRooms = [
  { name: '101', category: 'Heritage' },
  { name: '102', category: 'Heritage' },
  { name: '103', category: 'Heritage' },
  { name: '104', category: 'Heritage' },
  { name: '111', category: 'Royal Heritage' },
  { name: '112', category: 'Royal Heritage' },
  { name: '113', category: 'Royal Heritage' },
  { name: '121', category: 'Suite' },
  { name: '122', category: 'Suite' },
  { name: '123', category: 'Suite' },
];

const STATUS_COLORS = {
  confirmed: '#1e8449', tentative: '#d4ac0d', cancelled: '#c0392b',
  'checked-in': '#1565c0', 'checked-out': '#546e7a', 'no-show': '#4a235a',
  payment_due: '#ca6f1e', vip: '#6c3483', dnd: '#5d6d7e',
  inquiry: '#2e86c1', blocked: '#7b241c', maintenance: '#784212',
};

// ── Sort function is PURE — takes full list, returns sorted list ───────────────
function sortRoomList(list) {
  const catCount = {};
  list.forEach(r => { catCount[r.category] = (catCount[r.category] || 0) + 1; });
  return [...list].sort((a, b) => {
    const diff = (catCount[a.category] || 0) - (catCount[b.category] || 0);
    if (diff !== 0) return diff;
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return parseInt(a.name) - parseInt(b.name);
  });
}

function App() {
  const [selectedDate,   setSelectedDate]   = useState(new Date());
  const [bookings,       setBookings]        = useState(sampleBookings);
  const [rooms,          setRooms]           = useState(() => sortRoomList(initialRooms));
  const [categoryColors, setCategoryColors]  = useState(initialCategoryColors);
  const [modalOpen,      setModalOpen]       = useState(false);
  const [modalBooking,   setModalBooking]    = useState(null);
  const [roomModalOpen,  setRoomModalOpen]   = useState(false);
  const [blockModalOpen, setBlockModalOpen]  = useState(false);
  const [filterStatus,   setFilterStatus]    = useState('all');
  const [searchQuery,    setSearchQuery]     = useState('');
  const [roomTab,        setRoomTab]         = useState('room');
  const [newRoom,        setNewRoom]         = useState({ name: '', category: 'Royal Heritage', capacity: 2, price: 100 });
  const [newCategory,    setNewCategory]     = useState({ name: '', rangeFrom: '', rangeTo: '' });
  const [blockForm,      setBlockForm]       = useState({ category: 'Royal Heritage', roomName: '', reason: '', arrival: '', departure: '' });

  // ── Re-sort rooms whenever rooms list changes ─────────────────────────────
  // (only re-sort if order is actually wrong, to avoid infinite loop)
  useEffect(() => {
    setRooms(prev => {
      const sorted = sortRoomList(prev);
      // Check if already sorted
      const same = sorted.every((r, i) => r.name === prev[i]?.name);
      return same ? prev : sorted;
    });
  }, [rooms.length]); // trigger when room count changes

  function isOverlap(newItem, ignoreId = null) {
    const arr1 = new Date(newItem.arrival);
    const dep1 = new Date(newItem.departure);
    return bookings.some(b => {
      if (b.roomName !== newItem.roomName) return false;
      if (ignoreId && b.id === ignoreId) return false;
      const arr2 = new Date(b.arrival), dep2 = new Date(b.departure);
      return arr1 < dep2 && arr2 < dep1 && !['cancelled','no-show'].includes(b.status);
    });
  }

  function showOverlapError() {
    window.alert('Room is already booked or blocked for the selected dates.');
  }

  // Hide cancelled bookings unless filter is set to 'cancelled'
  const filteredBookings = bookings.filter(b => {
  const matchStatus = filterStatus === 'all' || b.status === filterStatus;
  const matchSearch = !searchQuery ||
    b.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.roomName?.includes(searchQuery) ||
    b.bookingId?.toLowerCase().includes(searchQuery.toLowerCase()) || // ← ADD THIS
    b.otaPlatform?.toLowerCase().includes(searchQuery.toLowerCase()); // ← ADD THIS
  if (filterStatus !== 'cancelled' && b.status === 'cancelled') return false;
  return matchStatus && matchSearch;
});

  // ── Add Room ────────────────────────────────────────────────────────────────
  const handleAddRoomSubmit = (e) => {
    e.preventDefault();
    if (!newRoom.name) { alert('Room number is empty.'); return; }
    if (rooms.some(r => r.name === newRoom.name)) { alert('Room number already exists.'); return; }
    const merged = [...rooms, { name: newRoom.name, category: newRoom.category }];
    setRooms(sortRoomList(merged));
    setRoomModalOpen(false);
    setNewRoom({ name: '', category: Object.keys(categoryColors)[0] || '', capacity: 2, price: 100 });
  };

  // ── Add Category ────────────────────────────────────────────────────────────
  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    const name = newCategory.name.trim();
    if (!name) return;
    if (categoryColors[name]) { alert('This category already exists.'); return; }

    // Auto-assign color from palette
    const color = AUTO_COLORS[Object.keys(categoryColors).length % AUTO_COLORS.length];

    // Build new rooms from range
    let newRoomsToAdd = [];
    const from = parseInt(newCategory.rangeFrom);
    const to   = parseInt(newCategory.rangeTo);
    if (!isNaN(from) && !isNaN(to) && to >= from && (to - from) <= 100) {
      for (let i = from; i <= to; i++) {
        const roomName = String(i);
        if (!rooms.some(r => r.name === roomName)) {
          newRoomsToAdd.push({ name: roomName, category: name });
        }
      }
    }

    // Build the full merged list BEFORE any setState
    // so sortRoomList can count correctly
    const mergedList = [...rooms, ...newRoomsToAdd];
    const sorted = sortRoomList(mergedList);

    // Now set everything at once
    setCategoryColors(prev => ({ ...prev, [name]: color }));
    setRooms(sorted);
    setNewCategory({ name: '', rangeFrom: '', rangeTo: '' });
    setRoomModalOpen(false);
    setRoomTab('room');
  };

  // ── Block Room ──────────────────────────────────────────────────────────────
  const handleBlockSubmit = (e) => {
    e.preventDefault();
    if (!blockForm.roomName || !blockForm.arrival || !blockForm.departure) return;
    const newBlock = {
      id: `block-${Date.now()}`,
      guestName: blockForm.reason || 'Blocked',
      roomName: blockForm.roomName,
      status: 'blocked',
      arrival: blockForm.arrival,
      departure: blockForm.departure,
      paymentStatus: 'paid',
      numGuests: 0, mealPlan: '—',
      notes: blockForm.reason,
      timestamp: new Date().toISOString(),
    };
    if (isOverlap(newBlock)) { showOverlapError(); return; }
    setBookings(prev => [...prev, newBlock]);
    setBlockModalOpen(false);
    setBlockForm({ category: Object.keys(categoryColors)[0] || '', roomName: '', reason: '', arrival: '', departure: '' });
  };

  const handleSaveBooking = (data) => {
    if (isOverlap(data, data.id)) { showOverlapError(); return; }
    const now = new Date().toISOString();
    setBookings(prev => data.id
      ? prev.map(b => b.id === data.id ? { ...b, ...data, timestamp: now } : b)
      : [...prev, { ...data, id: `b${Date.now()}`, timestamp: now }]
    );
    setModalOpen(false); setModalBooking(null);
  };

  const handleUpdateBooking = (id, updates) => {
    const current = bookings.find(b => b.id === id);
    if (!current) return;
    if (isOverlap({ ...current, ...updates }, id)) { showOverlapError(); return; }
    const now = new Date().toISOString();
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates, timestamp: now } : b));
  };

  const handleQuickBook = (data) => {
    if (isOverlap(data)) { showOverlapError(); return; }
    setBookings(prev => [...prev, { ...data, timestamp: new Date().toISOString() }]);
  };

  const handleContextAction = (action, booking) => {
    switch (action) {
      case 'edit': case 'view': case 'note': case 'changeroom':
        setModalBooking(booking); setModalOpen(true); break;
      case 'checkin':  handleUpdateBooking(booking.id, { status: 'checked-in' });  break;
      case 'checkout': handleUpdateBooking(booking.id, { status: 'checked-out' }); break;
      case 'cancel': case 'unblock':
        handleUpdateBooking(booking.id, { status: 'cancelled' }); break;
      default: break;
    }
  };

  // ── Stats ───────────────────────────────────────────────────────────────────
const now = new Date();
const todayStr = format(now, 'yyyy-MM-dd');

// Only count bookings where the room actually exists in rooms list
const validBookings = bookings.filter(b => rooms.some(r => r.name === b.roomName));

const activeBookings = validBookings.filter(b =>
  new Date(b.arrival) <= now && new Date(b.departure) > now &&
  !['cancelled','no-show','blocked'].includes(b.status)
);
const todayBookings  = activeBookings.length;
const occupancyRate  = rooms.length > 0 ? Math.round((todayBookings / rooms.length) * 100) : 0;
const pendingPayment = validBookings.filter(b => b.paymentStatus === 'due' || b.paymentStatus === 'partial').length;
const checkinsToday  = validBookings.filter(b => b.arrival === todayStr && !['cancelled','no-show','blocked'].includes(b.status)).length;
const checkoutsToday = validBookings.filter(b => b.departure === todayStr && !['cancelled','no-show','blocked'].includes(b.status)).length;

  const getCategoryStats = (cat) => {
  const catRooms = rooms.filter(r => r.category === cat);
  const occupied = catRooms.filter(r =>
    bookings.some(b =>
      b.roomName === r.name &&
      new Date(b.arrival) <= now && new Date(b.departure) > now &&
      !['cancelled','no-show','blocked'].includes(b.status)
    )
  ).length;
  return { total: catRooms.length, occupied, available: catRooms.length - occupied };
};

  const btn = { padding: '6px 14px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' };
  const inp = { padding: '6px 9px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.8rem', width: '100%', boxSizing: 'border-box', outline: 'none' };
  const lbl = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.82rem', color: '#444' };
  const roomsInCat = (cat) => rooms.filter(r => r.category === cat).map(r => r.name);

  // Categories sorted by room count ascending (for display)
  const sortedCategories = Object.keys(categoryColors).sort(
    (a, b) => rooms.filter(r => r.category === a).length - rooms.filter(r => r.category === b).length
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f0f2f5', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── Top Bar ── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1a2e', padding: '0 18px', height: 48, flexShrink: 0, gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>🏨 Hotel RMS</h1>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <button onClick={() => setSelectedDate(new Date())} style={{ ...btn, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.75rem', padding: '4px 10px' }}>Today</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: 6 }}>
            <button onClick={() => setSelectedDate(p => subMonths(p, 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#fff', fontSize: '1rem', padding: '0 4px' }}>‹</button>
            <span style={{ minWidth: 105, textAlign: 'center', fontWeight: 700, fontSize: '0.82rem', color: '#fff' }}>{format(selectedDate, 'MMMM yyyy')}</span>
            <button onClick={() => setSelectedDate(p => addMonths(p, 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#fff', fontSize: '1rem', padding: '0 4px' }}>›</button>
          </div>
          <input
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="🔍 Search guest / room / booking ID..."
            style={{ ...inp, width: 180, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.75rem', padding: '4px 10px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => { setRoomModalOpen(true); setRoomTab('room'); }} style={{ ...btn, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.75rem', padding: '4px 10px' }}>+ Room</button>
          <button onClick={() => setBlockModalOpen(true)} style={{ ...btn, background: '#7b241c', color: '#fff', fontSize: '0.75rem', padding: '4px 10px' }}>🚫 Block</button>
          <button onClick={() => { setModalBooking({ status: 'confirmed' }); setModalOpen(true); }} style={{ ...btn, background: '#1565c0', color: '#fff', fontSize: '0.75rem', padding: '4px 12px' }}>+ Reservation</button>
        </div>
      </header>

      {/* ── Stats Bar ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8eaed', padding: '6px 18px', display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
        {/* Add Check-outs Today to stats bar */}
        {[
          { label: 'Occupied',        value: todayBookings,  color: '#1e8449' },
          { label: 'Occupancy Rate',  value: `${occupancyRate}%`, color: occupancyRate > 80 ? '#1e8449' : occupancyRate > 50 ? '#e67e22' : '#e74c3c' },
          { label: 'Check-ins Today', value: checkinsToday,  color: '#1565c0' },
          { label: 'Check-outs Today', value: checkoutsToday, color: '#784212' },
          { label: 'Payment Pending', value: pendingPayment, color: '#e74c3c' },
          { label: 'Total Rooms',     value: rooms.length,   color: '#555' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: '1rem', fontWeight: 800, color }}>{value}</span>
            <span style={{ fontSize: '0.7rem', color: '#888' }}>{label}</span>
          </div>
        ))}

        <div style={{ width: 1, height: 18, background: '#e0e0e0', margin: '0 2px' }} />

        {/* Category stats — sorted by room count ascending */}
        <select style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.7rem', cursor: 'pointer' }}>
          {sortedCategories.map(cat => {
            const stats = getCategoryStats(cat);
            return <option key={cat}>{cat} ({stats.available} avail / {stats.total} total)</option>;
          })}
        </select>

        <div style={{ width: 1, height: 18, background: '#e0e0e0', margin: '0 2px' }} />

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>
          {['all','confirmed','tentative','checked-in','checked-out','cancelled','blocked'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* ── Hint bar ── */}
      <div style={{ background: '#f7f8fa', borderBottom: '1px solid #eee', padding: '4px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 14, fontSize: '0.67rem', color: '#888', whiteSpace: 'nowrap' }}>
          <span>📌 Click empty cell → Quick book</span>
          <span>🖱️ Click bar → Quick edit</span>
          <span>↔️ Double-click → Full edit</span>
          <span>↔️ Drag right edge → Extend stay</span>
          <span>🖱️ Right-click → Actions</span>
        </div>
        <div style={{ display: 'flex', gap: 10, fontSize: '0.65rem' }}>
          {[['confirmed','#1e8449'],['tentative','#d4ac0d'],['checked-in','#1565c0'],['blocked','#7b241c'],['vip','#6c3483']].map(([s,c]) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 7, height: 7, background: c, borderRadius: '50%' }} />
              <span style={{ color: '#888', textTransform: 'capitalize' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Calendar ── */}
      <main style={{ flex: 1, padding: '8px 14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <CalendarView
          rooms={rooms}
          bookings={filteredBookings}
          selectedDate={selectedDate}
          categoryColors={categoryColors}
          onCellClick={(room, day) => { setModalBooking({ roomName: room, arrival: format(day, 'yyyy-MM-dd'), departure: format(addDays(day, 1), 'yyyy-MM-dd'), status: 'confirmed' }); setModalOpen(true); }}
          onBookingClick={(b) => { setModalBooking(b); setModalOpen(true); }}
          onBookingDoubleClick={(b) => { setModalBooking(b); setModalOpen(true); }}
          onUpdateBooking={handleUpdateBooking}
          onQuickBook={handleQuickBook}
          onContextAction={handleContextAction}
        />
      </main>

      {/* ── Booking Modal ── */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setModalBooking(null); }}>
        <BookingForm open={modalOpen} booking={modalBooking} rooms={rooms} onSaveBooking={handleSaveBooking} onClose={() => { setModalOpen(false); setModalBooking(null); }} />
      </Modal>

      {/* ── Add Room / Category Modal ── */}
      <Modal open={roomModalOpen} onClose={() => setRoomModalOpen(false)}>
        <div style={{ width: 360, display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
          <div style={{ display: 'flex', borderBottom: '2px solid #e8eaed', background: '#f7f8fa' }}>
            {[['room','🏠 Add Room'],['category','🎨 Add Category']].map(([key, label]) => (
              <button key={key} onClick={() => setRoomTab(key)} style={{
                flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                background: roomTab === key ? '#fff' : 'transparent',
                fontWeight: roomTab === key ? 700 : 500,
                color: roomTab === key ? '#1565c0' : '#666',
                fontSize: '0.8rem',
                borderBottom: roomTab === key ? '2px solid #1565c0' : '2px solid transparent',
                marginBottom: -2,
              }}>{label}</button>
            ))}
          </div>

          {/* Add Room tab */}
          {roomTab === 'room' && (
            <form onSubmit={handleAddRoomSubmit} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Add New Room</h3>
              <label style={lbl}>Room Number
                <input value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} placeholder="e.g. 107" required style={inp} autoFocus />
              </label>
              <label style={lbl}>Category
                <select value={newRoom.category} onChange={e => setNewRoom({ ...newRoom, category: e.target.value })} style={inp}>
                  {/* Show categories sorted by room count ascending */}
                  {sortedCategories.map(c => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label style={lbl}>Capacity
                <input type="number" min="1" value={newRoom.capacity} onChange={e => setNewRoom({ ...newRoom, capacity: +e.target.value })} style={inp} />
              </label>
              <label style={lbl}>Base Price (₹)
                <input type="number" min="0" value={newRoom.price} onChange={e => setNewRoom({ ...newRoom, price: +e.target.value })} style={inp} />
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setRoomModalOpen(false)} style={{ ...btn, background: '#f5f5f5', color: '#333', border: '1px solid #ddd' }}>Cancel</button>
                <button type="submit" style={{ ...btn, background: '#1565c0', color: '#fff' }}>Add Room</button>
              </div>
            </form>
          )}

          {/* Add Category tab */}
          {roomTab === 'category' && (
            <form onSubmit={handleAddCategorySubmit} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Add Room Category</h3>
              <label style={lbl}>Category Name
                <input value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="e.g. Presidential Suite" required style={inp} autoFocus />
              </label>

              {/* Range inputs */}
              <div>
                <div style={{ fontSize: '0.8rem', color: '#444', fontWeight: 600, marginBottom: 6 }}>
                  Room Number Range <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
                  <input type="number" value={newCategory.rangeFrom} onChange={e => setNewCategory({ ...newCategory, rangeFrom: e.target.value })} placeholder="From (e.g. 500)" style={inp} />
                  <span style={{ color: '#aaa', fontWeight: 700, textAlign: 'center' }}>→</span>
                  <input type="number" value={newCategory.rangeTo} onChange={e => setNewCategory({ ...newCategory, rangeTo: e.target.value })} placeholder="To (e.g. 510)" style={inp} />
                </div>

                {/* Live preview */}
                {newCategory.rangeFrom && newCategory.rangeTo && (() => {
                  const from = parseInt(newCategory.rangeFrom);
                  const to   = parseInt(newCategory.rangeTo);
                  if (!isNaN(from) && !isNaN(to) && to >= from && (to - from) <= 100) {
                    const count = to - from + 1;
                    const existing = Array.from({ length: count }, (_, i) => String(from + i)).filter(n => rooms.some(r => r.name === n));
                    return (
                      <div style={{ marginTop: 6, padding: '6px 10px', background: '#f0f7ff', border: '1px solid #b3d1f5', borderRadius: 6, fontSize: '0.72rem', color: '#1565c0' }}>
                        ✅ Will create <strong>{count - existing.length}</strong> room{count - existing.length !== 1 ? 's' : ''} ({from} – {to})
                        {existing.length > 0 && <span style={{ color: '#e67e22' }}> · {existing.length} already exist and will be skipped</span>}
                      </div>
                    );
                  }
                  if (!isNaN(from) && !isNaN(to) && to < from)
                    return <div style={{ marginTop: 6, fontSize: '0.72rem', color: '#e74c3c' }}>⚠️ "To" must be ≥ "From"</div>;
                  if (!isNaN(from) && !isNaN(to) && (to - from) > 100)
                    return <div style={{ marginTop: 6, fontSize: '0.72rem', color: '#e74c3c' }}>⚠️ Max 100 rooms at once.</div>;
                  return null;
                })()}
              </div>

              {/* Existing categories sorted by count */}
              <div>
                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 6 }}>Existing (fewest → most rooms):</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
                  {sortedCategories.map(cat => {
                    const c = categoryColors[cat];
                    return (
                      <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 5, background: c.bg, border: `1px solid ${c.border}`, fontSize: '0.75rem' }}>
                        <div style={{ width: 10, height: 10, background: c.border, borderRadius: '50%' }} />
                        <span style={{ fontWeight: 600 }}>{cat}</span>
                        <span style={{ color: '#666', marginLeft: 'auto' }}>{rooms.filter(r => r.category === cat).length} rooms</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ background: '#f0f7ff', border: '1px solid #b3d1f5', borderRadius: 6, padding: '8px 12px', fontSize: '0.73rem', color: '#1565c0' }}>
                🎨 A unique color will be automatically assigned.
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setRoomModalOpen(false)} style={{ ...btn, background: '#f5f5f5', color: '#333', border: '1px solid #ddd' }}>Cancel</button>
                <button type="submit" style={{ ...btn, background: '#1565c0', color: '#fff' }}>Add Category</button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* ── Block Room Modal ── */}
      <Modal open={blockModalOpen} onClose={() => setBlockModalOpen(false)}>
        <form onSubmit={handleBlockSubmit} style={{ width: 340, padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#7b241c' }}>🚫 Block Room</h3>
          <label style={lbl}>Category
            <select value={blockForm.category} onChange={e => setBlockForm({ ...blockForm, category: e.target.value, roomName: '' })} style={inp}>
              {sortedCategories.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label style={lbl}>Room
            <select value={blockForm.roomName} onChange={e => setBlockForm({ ...blockForm, roomName: e.target.value })} required style={inp}>
              <option value="">Select room</option>
              {roomsInCat(blockForm.category).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label style={lbl}>From<input type="date" value={blockForm.arrival} onChange={e => setBlockForm({ ...blockForm, arrival: e.target.value })} required style={inp} /></label>
            <label style={lbl}>To<input type="date" value={blockForm.departure} onChange={e => setBlockForm({ ...blockForm, departure: e.target.value })} required style={inp} /></label>
          </div>
          <label style={lbl}>Reason
            <textarea value={blockForm.reason} onChange={e => setBlockForm({ ...blockForm, reason: e.target.value })} rows={2} style={{ ...inp, resize: 'vertical' }} />
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setBlockModalOpen(false)} style={{ ...btn, background: '#f5f5f5', color: '#333', border: '1px solid #ddd' }}>Cancel</button>
            <button type="submit" style={{ ...btn, background: '#7b241c', color: '#fff' }}>Block</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default App;