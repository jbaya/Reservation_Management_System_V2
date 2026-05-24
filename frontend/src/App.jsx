import { useEffect, useState } from 'react';
import { addMonths, subMonths, format } from 'date-fns';


// ── Components (you already have these) ───────────────────────────────────────
import CalendarView from './components/CalendarView.jsx';
import BookingForm from './components/BookingForm.jsx';
import Modal from './components/Modal.jsx';
import DncManager from './components/DncManager';

// ── Constants ─────────────────────────────────────────────────────────────────
import { AUTO_COLORS, initialCategoryColors } from './constants/colors.js';
import { sampleBookings, initialRooms, initialThirdParties } from './constants/rooms.js';

// ── Utils ─────────────────────────────────────────────────────────────────────
import { sortRoomList } from './utils/roomUtils.js';

// ── Pages ─────────────────────────────────────────────────────────────────────

import RoomCategoryPage from './pages/RoomCategoryPage.jsx';
import RoomNoPage from './pages/RoomNoPage.jsx';
import NewReservationPage from './pages/NewReservationPage.jsx';
import ViewReservationPage from './pages/ViewReservationPage.jsx';
import ViewTariffPage from './pages/ViewTariffPage.jsx';
import EditTariffPage from './pages/EditTariffPage.jsx';
import TravelAgentPage from './pages/TravelAgentPage.jsx';
import TravelAgentRateConfig from './pages/TravelAgentRateConfig.jsx';
import SeasonConfigPage from './pages/SeasonConfigPage.jsx';
import FloorPage from './pages/FloorPage.jsx';
import Dashboard2 from './pages/Dashboard2.jsx';

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
function App() {
  const [travelAgents, setTravelAgents] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [travelAgentRates, setTravelAgentRates] = useState([]);
  const [thirdParties, setThirdParties] = useState(initialThirdParties);
  const [showCalendar, setShowCalendar] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState(sampleBookings);
  const [rooms, setRooms] = useState(() => sortRoomList(initialRooms));
  const [categoryColors, setCategoryColors] = useState(initialCategoryColors);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalBooking, setModalBooking] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');
const [isSearching, setIsSearching] = useState(false);
  const [guestTagFilter, setGuestTagFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState(null);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [blockForm, setBlockForm] = useState({ category: '', roomName: '', reason: '', arrival: '', departure: '' });
  const [floorFilter, setFloorFilter] = useState('all');
  const [editingBooking, setEditingBooking] = useState(null);
  const [dncOverrideOpen, setDncOverrideOpen] = useState(false);
const [dncBooking, setDncBooking] = useState(null);
const [dncTargetRoom, setDncTargetRoom] = useState(null);

const [floors, setFloors] = useState(() =>
  [...new Set(
    initialRooms.map(r => {
      // Always prefer explicit floor field first
      if (r.floor !== undefined && r.floor !== null && r.floor !== '') {
        if (r.floor === 'Basement') return -1;
        if (r.floor === 'Ground')   return 0;
        const parsed = parseInt(r.floor);
        if (!isNaN(parsed)) return parsed;
      }
      // Fallback: derive from room name
      const n = parseInt(r.name);
      if (isNaN(n) || n < 100) return 1;
      return Math.floor(n / 100);
    })
  )].sort((a, b) => a - b)
);
  const loggedUser = JSON.parse(localStorage.getItem('rms_loggedIn') || '{"name":"Admin"}');

 useEffect(() => {
    setRooms(prev => {
      const sorted = sortRoomList(prev);
      const same = sorted.every((r, i) => r.name === prev[i]?.name);
      return same ? prev : sorted;
    });
  }, [rooms.length]);

  // Keep floors in sync when rooms are added/removed
 useEffect(() => {
    const roomFloors = rooms.map(r => {
      if (r.floor !== undefined && r.floor !== null && r.floor !== '') {
        if (r.floor === 'Basement') return -1;
        if (r.floor === 'Ground')   return 0;
        const parsed = parseInt(r.floor);
        if (!isNaN(parsed)) return parsed;
      }
      const n = parseInt(r.name);
      if (isNaN(n) || n < 100) return 1;
      return Math.floor(n / 100);
    });
    const uniqueFloors = [...new Set(roomFloors)].sort((a, b) => a - b);
    setFloors(prev => {
      const merged = [...new Set([...prev, ...uniqueFloors])].sort((a, b) => a - b);
      return JSON.stringify(merged) === JSON.stringify(prev) ? prev : merged;
    });
  }, [rooms.length]);

  useEffect(() => {
  setIsSearching(true);

  const timer = setTimeout(() => {
    setDebouncedSearch(searchQuery);
    setIsSearching(false);
  }, 250);

  return () => clearTimeout(timer);
}, [searchQuery]);

  function isOverlap(newItem, ignoreId = null) {
    const arr1 = new Date(newItem.arrival), dep1 = new Date(newItem.departure);
    return bookings.some(b => {
      if (b.roomName !== newItem.roomName) return false;
      if (ignoreId && b.id === ignoreId) return false;
      const arr2 = new Date(b.arrival), dep2 = new Date(b.departure);
      return arr1 < dep2 && arr2 < dep1 && !['cancelled', 'no-show'].includes(b.status);
    });
  }
const normalizedBookings = bookings.flatMap((b) => {
  // NEW structured room model
  if (b.rooms?.length) {
    return b.rooms.map((room, idx) => ({
      ...b,
      roomName: room.roomName,
      roomCategory: room.roomCategory,
      occupancy: room.occupancy || 1,
      extraPersons: room.extraPersons || 0,
      baseRate: room.rate || b.baseRate || 0,
      dnc:
        room.dnc ||
        false,
      multiRoomIndex: idx + 1
    }));
  }

  // LEGACY single booking support
  return [
    {
      ...b,
      dnc:
        b.tags?.includes('DNC') ||
        false
    }
  ];
});
  const filteredBookings = normalizedBookings.filter((b) => {
  const q = debouncedSearch.trim().toLowerCase();

  const matchStatus =
    filterStatus === 'all' || b.status === filterStatus;

  const matchTag =
    guestTagFilter === 'all' ||
    (guestTagFilter === 'VIP' && b.tags?.includes('VIP')) ||
    (guestTagFilter === 'DNC' && b.tags?.includes('DNC'));

  if (!q) {
    return matchStatus && matchTag;
  }

  const searchableFields = [
    b.guestName || '',
    b.bookingId || '',
    b.roomName || '',
    b.source || '',
    b.otaPlatform || '',
  ]
    .join(' ')
    .toLowerCase();

  const matchSearch = searchableFields.includes(q);

  if (filterStatus !== 'cancelled' && b.status === 'cancelled')
    return false;

  return matchStatus && matchTag && matchSearch;
});

  const handleSaveBooking = (data) => {
    if (isOverlap(data, data.id)) { alert('Room overlap!'); return; }
    const now = new Date().toISOString();
    setBookings(prev => data.id && prev.find(b => b.id === data.id)
      ? prev.map(b => b.id === data.id ? { ...b, ...data, timestamp: now } : b)
      : [...prev, { ...data, id: data.id || `b${Date.now()}`, timestamp: now }]
    );
    setModalOpen(false); setModalBooking(null);
  };

  const handleUpdateBooking = (id, updates) => {
    const cur = bookings.find(b => b.id === id); if (!cur) return;
    if (isOverlap({ ...cur, ...updates }, id)) { alert('Overlap!'); return; }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates, timestamp: new Date().toISOString() } : b));
  };

  const handleQuickBook = (data) => {
    if (isOverlap(data)) { alert('Overlap!'); return; }
    setBookings(prev => [...prev, { ...data, timestamp: new Date().toISOString() }]);
  };

  const requestDncOverride = (booking, targetRoom) => {
  setDncBooking(booking);
  setDncTargetRoom(targetRoom);
  setDncOverrideOpen(true);
};

const handleDncApprove = (overrideData) => {
  if (!dncBooking || !dncTargetRoom) return;

  setBookings(prev =>
    prev.map(b =>
      b.id === dncBooking.id
        ? {
            ...b,
            roomName: dncTargetRoom.name,
            timestamp: new Date().toISOString(),
            auditTrail: [
              ...(b.auditTrail || []),
              {
                action: 'DNC_OVERRIDE',
                ...overrideData
              }
            ]
          }
        : b
    )
  );

  setDncOverrideOpen(false);
  setDncBooking(null);
  setDncTargetRoom(null);
};

const handleDncCancel = () => {
  setDncOverrideOpen(false);
  setDncBooking(null);
  setDncTargetRoom(null);
};

  const handleContextAction = (action, booking) => {
  switch (action) {
    case 'edit':
    case 'view':
    case 'note':
    case 'changeroom':
  setEditingBooking(booking);
setActivePage('new-reservation');
  break;

    case 'checkin':
      handleUpdateBooking(booking.id, {
        status: 'checked-in'
      });
      break;

    case 'checkout':
      handleUpdateBooking(booking.id, {
        status: 'checked-out'
      });
      break;

    case 'cancel':
    case 'unblock':
      handleUpdateBooking(booking.id, {
        status: 'cancelled'
      });
      break;

    default:
      break;
  }
};

  const handleAddCategory = (name, numRooms) => {
    const color = AUTO_COLORS[Object.keys(categoryColors).length % AUTO_COLORS.length];
    let newRooms = [];
    if (numRooms && !isNaN(numRooms) && numRooms > 0) {
      const existingNumbers = rooms.map(r => parseInt(r.name)).filter(n => !isNaN(n));
      let startNum = 101;
      if (existingNumbers.length > 0) startNum = Math.max(...existingNumbers) + 1;
      for (let i = 0; i < numRooms; i++) {
        let rn = String(startNum + i);
        while (rooms.some(r => r.name === rn) || newRooms.some(r => r.name === rn)) {
          startNum++;
          rn = String(startNum + i);
        }
        newRooms.push({ name: rn, category: name, floor: '1' });
      }
    }
    setCategoryColors(prev => ({ ...prev, [name]: color }));
    if (newRooms.length > 0) setRooms(sortRoomList([...rooms, ...newRooms]));
  };

  const handleDeleteCategory = (name) => {
    if (rooms.some(r => r.category === name)) { alert(`Cannot delete "${name}" — rooms exist in this category`); return; }
    if (!window.confirm(`Delete category "${name}"?`)) return;
    setCategoryColors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleAddRoom = (room) => {
    if (rooms.some(r => r.name === room.name)) return;
    const roomWithFloor = { ...room, floor: room.floor || '1' };
    setRooms(sortRoomList([...rooms, roomWithFloor]));
  };

  const handleDeleteRoom = (name) => {
    if (bookings.some(b => b.roomName === name && !['cancelled', 'no-show'].includes(b.status))) { alert('Cannot delete room with active bookings'); return; }
    if (!window.confirm(`Delete room ${name}?`)) return;
    setRooms(prev => prev.filter(r => r.name !== name));
  };

  const handleBlockSubmit = (e) => {
    e.preventDefault();
    if (!blockForm.roomName || !blockForm.arrival || !blockForm.departure) return;
    const newBlock = { id: `block-${Date.now()}`, guestName: blockForm.reason || 'Blocked', roomName: blockForm.roomName, status: 'blocked', arrival: blockForm.arrival, departure: blockForm.departure, paymentStatus: 'paid', numGuests: 0, mealPlan: '—', notes: blockForm.reason, timestamp: new Date().toISOString(), comments: [] };
    if (isOverlap(newBlock)) { alert('Room overlap!'); return; }
    setBookings(prev => [...prev, newBlock]);
    setBlockModalOpen(false);
    setBlockForm({ category: '', roomName: '', reason: '', arrival: '', departure: '' });
  };

  // Stats
  const now2 = new Date();
const todayStr = format(now2, 'yyyy-MM-dd');

const validBookings = normalizedBookings.filter(
  b => rooms.some(r => r.name === b.roomName)
);

const activeToday = validBookings.filter(
  b =>
    new Date(b.arrival) <= now2 &&
    new Date(b.departure) > now2 &&
    !['cancelled', 'no-show', 'blocked'].includes(b.status)
);

const occupancyRate =
  rooms.length > 0
    ? Math.round((activeToday.length / rooms.length) * 100)
    : 0;

const pendingPayment = validBookings.filter(
  b => b.paymentStatus === 'due' || b.paymentStatus === 'partial'
).length;

const checkinsToday = validBookings.filter(
  b =>
    b.arrival === todayStr &&
    !['cancelled', 'no-show', 'blocked'].includes(b.status)
).length;

const checkoutsToday = validBookings.filter(
  b =>
    b.departure === todayStr &&
    !['cancelled', 'no-show', 'blocked'].includes(b.status)
).length;

  const sortedCategories = Object.keys(categoryColors).sort(
    (a, b) => rooms.filter(r => r.category === a).length - rooms.filter(r => r.category === b).length
  );

  const sidebarMenus = [
    {
      key: 'room', label: '🛏️ Room Management',
      children: [
        { key: 'room-category', label: 'Room Category' },
        { key: 'room-floor', label: 'Floor' },
        { key: 'room-no', label: 'Room No.' },
        { key: 'room-tariff', label: 'View Tariff' },
        { key: 'room-edit-tariff', label: 'Edit Tariff' },
      ],
    },
    {
      key: 'reservation', label: '📋 Reservation',
      children: [
        { key: 'new-reservation', label: 'New Reservation' },
        { key: 'view-reservation', label: 'View Reservation Details' },
        { key: 'cancel-list', label: 'Cancel List' },
        { key: 'travel-agent', label: 'Travel Agent/Third Party' },
        { key: 'season-config', label: 'Season Configuration' },
         {
    key: 'travel-agent-rate',
    label: 'Travel Agent Rate Configuration'
  },
      ],
    },
  ];

  const btn = { padding: '6px 14px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' };
  const inp = { padding: '6px 9px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.8rem', width: '100%', boxSizing: 'border-box', outline: 'none' };
  const lbl = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.82rem', color: '#444' };
  const roomsInCat = (cat) => rooms.filter(r => r.category === cat).map(r => r.name);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f0f2f5', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── Top Bar ── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1a2e', padding: '0 18px', height: 48, flexShrink: 0, gap: 10, zIndex: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Hamburger */}
          <button onClick={() => setSidebarOpen(p => !p)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: '1.2rem', padding: '4px 6px', borderRadius: 5, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ display: 'block', width: 20, height: 2, background: '#fff', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 20, height: 2, background: '#fff', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 20, height: 2, background: '#fff', borderRadius: 2 }} />
          </button>

          <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>🏨 Hotel RMS</h1>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />

          <button
   onClick={() => {
  setShowCalendar(true);
  setFloorFilter('all');
  setActivePage(null);
  setShowDashboard(false);
}}
            style={{ ...btn, background: showCalendar ? '#f39c12' : 'rgba(255,255,255,0.12)', color: '#fff', border: showCalendar ? '2px solid #f1c40f' : '1px solid rgba(255,255,255,0.25)', fontSize: '0.75rem', padding: '4px 12px', boxShadow: showCalendar ? '0 0 8px rgba(243,156,18,0.5)' : 'none', transition: 'all 0.2s' }}
          >
            📅 Calendar
          </button>

          {showCalendar && <>
            <button onClick={() => setSelectedDate(new Date())} style={{ ...btn, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.75rem', padding: '4px 10px' }}>Today</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: 6 }}>
              <button onClick={() => setSelectedDate(p => subMonths(p, 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#fff', fontSize: '1rem', padding: '0 4px' }}>‹</button>
              <span style={{ minWidth: 105, textAlign: 'center', fontWeight: 700, fontSize: '0.82rem', color: '#fff' }}>{format(selectedDate, 'MMMM yyyy')}</span>
              <button onClick={() => setSelectedDate(p => addMonths(p, 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#fff', fontSize: '1rem', padding: '0 4px' }}>›</button>
            </div>
          </>}

          {showCalendar && (
  <div
  style={{
    position: 'relative',
    width: 'min(420px, 100%)',
    flex: 1,
    minWidth: 220
  }}
>
  <input
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search by Booking ID / Guest Name / Source"
    style={{
      ...inp,
      width: '100%',
      background: 'rgba(255,255,255,0.1)',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.2)',
      fontSize: '0.75rem',
      padding: '4px 36px 4px 12px'
    }}
  />

  {isSearching && (
    <span
      style={{
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#fff',
        fontSize: '0.7rem'
      }}
    >
      ⏳
    </span>
  )}

  {!isSearching && searchQuery && (
    <button
      onClick={() => setSearchQuery('')}
      style={{
        position: 'absolute',
        right: 8,
        top: '50%',
        transform: 'translateY(-50%)',
        border: 'none',
        background: 'transparent',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '0.9rem',
        padding: 2
      }}
    >
      ✕
    </button>
  )}
</div>
)}
        </div>
       {showCalendar && (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>

    <button
      onClick={() => setShowDashboard(p => !p)}
      style={{
        ...btn,
        background: showDashboard ? '#1e3a8a' : '#2563eb',
        color: '#fff',
        fontSize: '0.75rem',
        padding: '4px 12px',
        boxShadow: showDashboard ? '0 0 8px rgba(37,99,235,0.4)' : 'none'
      }}
    >
      📊 Dashboard
    </button>

    <button
      onClick={() => setBlockModalOpen(true)}
      style={{
        ...btn,
        background: '#7b241c',
        color: '#fff',
        fontSize: '0.75rem',
        padding: '4px 10px'
      }}
    >
      🚫 Block
    </button>

    <button
      onClick={() => {
        setSidebarOpen(true);
        setExpandedMenu('reservation');
        setActivePage('new-reservation');
      }}
      style={{
        ...btn,
        background: '#1565c0',
        color: '#fff',
        fontSize: '0.75rem',
        padding: '4px 12px'
      }}
    >
      + Reservation
    </button>

  </div>
)}
      </header>

      {/* ── Main layout ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* ── Sidebar ── */}
        <div style={{ width: sidebarOpen ? 240 : 0, minWidth: sidebarOpen ? 240 : 0, background: '#1e2a3a', transition: 'width 0.25s ease, min-width 0.25s ease', overflow: 'hidden', flexShrink: 0, display: 'flex', flexDirection: 'column', zIndex: 100, boxShadow: sidebarOpen ? '4px 0 16px rgba(0,0,0,0.2)' : 'none' }}>
          <div style={{ width: 240, flex: 1, overflowY: 'auto' }}>

            {/* Sidebar header */}
            <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1565c0, #42a5f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>
                {loggedUser?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem' }}>{loggedUser?.name || 'Admin'}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem' }}>{loggedUser?.role || 'Administrator'}</div>
              </div>
            </div>

            {/* Home link */}
           <div onClick={() => {
  setActivePage(null);
  setShowCalendar(true);
  setShowDashboard(false);
  setFloorFilter('all');
}}
              style={{ padding: '10px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: activePage === null ? '#64b5f6' : 'rgba(255,255,255,0.7)', background: activePage === null ? 'rgba(100,181,246,0.1)' : 'transparent', borderLeft: activePage === null ? '3px solid #64b5f6' : '3px solid transparent', fontSize: '0.85rem', fontWeight: activePage === null ? 700 : 500, transition: 'all 0.15s' }}
              onMouseEnter={e => { if (activePage !== null) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if (activePage !== null) e.currentTarget.style.background = 'transparent'; }}>
              🏠 <span>Home</span>
            </div>

            {/* Menu sections */}
            {sidebarMenus.map(menu => (
              <div key={menu.key}>
                <div onClick={() => setExpandedMenu(expandedMenu === menu.key ? null : menu.key)}
                  style={{ padding: '10px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'rgba(255,255,255,0.85)', background: expandedMenu === menu.key ? 'rgba(255,255,255,0.05)' : 'transparent', fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.15s', borderTop: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = expandedMenu === menu.key ? 'rgba(255,255,255,0.05)' : 'transparent'}>
                  <span>{menu.label}</span>
                  <span style={{ fontSize: '0.7rem', transition: 'transform 0.2s', transform: expandedMenu === menu.key ? 'rotate(180deg)' : 'none' }}>▼</span>
                </div>
                {expandedMenu === menu.key && (
                  <div style={{ background: 'rgba(0,0,0,0.15)' }}>
                    {menu.children.map(child => (
                      <div key={child.key} onClick={() => { setActivePage(child.key); setSidebarOpen(true); }}
                        style={{ padding: '8px 18px 8px 36px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: activePage === child.key ? '#64b5f6' : 'rgba(255,255,255,0.6)', background: activePage === child.key ? 'rgba(100,181,246,0.12)' : 'transparent', borderLeft: activePage === child.key ? '3px solid #64b5f6' : '3px solid transparent', fontSize: '0.8rem', fontWeight: activePage === child.key ? 700 : 400, transition: 'all 0.12s' }}
                        onMouseEnter={e => { if (activePage !== child.key) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={e => { if (activePage !== child.key) e.currentTarget.style.background = 'transparent'; }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: activePage === child.key ? '#64b5f6' : 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                        {child.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Logout */}
            <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', padding: 16 }}>
              <button onClick={() => { localStorage.removeItem('rms_loggedIn'); window.location.reload(); }}
                style={{ width: '100%', padding: '8px 0', border: '1px solid rgba(255,100,100,0.3)', borderRadius: 6, background: 'rgba(255,0,0,0.1)', color: '#ff8a80', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                🚪 Logout
              </button>
            </div>
          </div>
        </div>

        {/* ── Main Content Area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'all 0.25s ease' }}>
         {activePage === null ? (
                  
              <>
                {/* Stats Bar */}
                <div style={{ background: '#fff', borderBottom: '1px solid #e8eaed', padding: '6px 18px', display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Occupied', value: activeToday.length, color: '#1e8449' },
                    { label: 'Occupancy Rate', value: `${occupancyRate}%`, color: occupancyRate > 80 ? '#1e8449' : occupancyRate > 50 ? '#e67e22' : '#e74c3c' },
                    { label: 'Check-ins Today', value: checkinsToday, color: '#1565c0' },
                    { label: 'Check-outs Today', value: checkoutsToday, color: '#784212' },
                    { label: 'Payment Pending', value: pendingPayment, color: '#e74c3c' },
                    { label: 'Total Rooms', value: rooms.length, color: '#555' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color }}>{value}</span>
                      <span style={{ fontSize: '0.7rem', color: '#888' }}>{label}</span>
                    </div>
                  ))}
                  <div style={{ width: 1, height: 18, background: '#e0e0e0', margin: '0 2px' }} />
                  <select style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.7rem', cursor: 'pointer' }}>
                    {sortedCategories.map(cat => {
                      const catRooms = rooms.filter(r => r.category === cat);
                      const occ = catRooms.filter(r => activeToday.some(b => b.roomName === r.name)).length;
                      return <option key={cat}>{cat} ({catRooms.length - occ} avail / {catRooms.length} total)</option>;
                    })}
                  </select>
                  <div style={{ width: 1, height: 18, background: '#e0e0e0', margin: '0 2px' }} />
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>
                    {['all', 'confirmed', 'tentative', 'checked-in', 'checked-out', 'cancelled', 'blocked'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select
  value={guestTagFilter}
  onChange={(e) => setGuestTagFilter(e.target.value)}
  style={{
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid #ddd',
    fontSize: '0.7rem',
    fontWeight: 600,
    cursor: 'pointer'
  }}
>
  <option value="all">All Guests</option>
  <option value="VIP">VIP</option>
  <option value="DNC">DNC</option>
</select>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                    {Object.entries(categoryColors).map(([cat, c]) => (
                      <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.65rem' }}>
                        <div style={{ width: 9, height: 9, background: c.bg, border: `2px solid ${c.border}`, borderRadius: 2 }} />
                        <span style={{ color: '#666' }}>{cat}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {showDashboard && (
  <Dashboard2
    rooms={
  floorFilter === 'all'
    ? rooms
    : rooms.filter(r => String(r.floor) === String(floorFilter))
}
    bookings={normalizedBookings}
    selectedDate={selectedDate}
    categoryColors={categoryColors}
    onClose={() => setShowDashboard(false)}
  />
)}

                {/* Hint bar */}
                <div style={{ background: '#f7f8fa', borderBottom: '1px solid #eee', padding: '3px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: 14, fontSize: '0.67rem', color: '#aaa' }}>
                    <span>📌 Click cell → Quick book</span>
                    <span>🖱️ Click bar → Quick edit</span>
                    <span>↔️ Double-click → Full edit</span>
                    <span>↔️ Drag right → Extend</span>
                    <span>🖱️ Right-click → Actions</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, fontSize: '0.65rem' }}>
  {[
    ['Paid', '#27ae60'],
    ['Partial', '#f39c12'],
    ['Due', '#e74c3c']
  ].map(([s, c]) => (
    <div
      key={s}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4
      }}
    >
      <div
        style={{
          width: 7,
          height: 7,
          background: c,
          borderRadius: '50%'
        }}
      />
      <span style={{ color: '#888' }}>
        {s}
      </span>
    </div>
  ))}
</div>
                </div>

                {/* Calendar */}
                
                <main style={{ flex: 1, padding: '8px 14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {filteredBookings.length === 0 && debouncedSearch ? (
  <div
    style={{
      flex: 1,
      background: '#fff',
      border: '1px solid #ddd',
      borderRadius: 8,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#777',
      gap: 10
    }}
  >
    <div style={{ fontSize: '2rem' }}>🔍</div>
    <div style={{ fontWeight: 700 }}>No Records Found</div>
    <div style={{ fontSize: '0.8rem' }}>
      Try another search
    </div>
  </div>
) : (
  <CalendarView
  requestDncOverride={requestDncOverride}
    rooms={rooms}
    bookings={filteredBookings}
    selectedDate={selectedDate}
    categoryColors={categoryColors}
    onCellClick={() => {
      setSidebarOpen(true);
      setExpandedMenu('reservation');
      setActivePage('new-reservation');
    }}
    onFullEdit={(booking) => {
  setModalOpen(false);
  setSidebarOpen(true);
  setExpandedMenu('reservation');
  setActivePage('new-reservation');
  setEditingBooking(booking);
}}
   onBookingDoubleClick={(booking) => {
  setModalOpen(false);
  setSidebarOpen(true);
  setExpandedMenu('reservation');
  setActivePage('new-reservation');
  setEditingBooking(booking);
}}
    onUpdateBooking={handleUpdateBooking}
    onQuickBook={handleQuickBook}
    onContextAction={handleContextAction}
  />
)}
                </main>
              </>
          ) : (
            // ── SIDEBAR PAGE CONTENT ──
            <div style={{ flex: 1, overflowY: 'auto', background: '#f8f9fa' }}>
              <div style={{ background: '#fff', borderBottom: '1px solid #e8eaed', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => setActivePage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1565c0', fontSize: '0.82rem', fontWeight: 600, padding: 0 }}>🏠 Home</button>
                <span style={{ color: '#ccc' }}>›</span>
                <span style={{ fontSize: '0.82rem', color: '#555', fontWeight: 600, textTransform: 'capitalize' }}>{activePage?.replace(/-/g, ' ')}</span>
              </div>

              {activePage === 'room-category' && <RoomCategoryPage categoryColors={categoryColors} rooms={rooms} onAddCategory={handleAddCategory} onDeleteCategory={handleDeleteCategory} />}
              {activePage === 'room-no' && <RoomNoPage rooms={rooms} categoryColors={categoryColors} onAddRoom={handleAddRoom} onDeleteRoom={handleDeleteRoom} />}
              {activePage === 'new-reservation' && <NewReservationPage  editingBooking={editingBooking}
  currentUser={loggedUser}
  rooms={rooms}
  categoryColors={categoryColors}
  bookings={bookings}
  onSave={handleSaveBooking}
  travelAgents={travelAgents}
  thirdParties={thirdParties}
  seasons={seasons}
  travelAgentRates={travelAgentRates}
/>}
             {activePage === 'view-reservation' && <ViewReservationPage bookings={bookings} rooms={rooms} categoryColors={categoryColors} currentUser={loggedUser} travelAgents={travelAgents} seasons={seasons} travelAgentRates={travelAgentRates} onUpdateBooking={handleUpdateBooking} />}
              {activePage === 'room-tariff' && <ViewTariffPage categoryColors={categoryColors} />}
              {activePage === 'room-edit-tariff' && <EditTariffPage categoryColors={categoryColors} />}
              {activePage === 'travel-agent' && (
  <TravelAgentPage
    agents={travelAgents}
    thirdParties={thirdParties}
    onAgentsChange={setTravelAgents}
    onThirdPartyChange={setThirdParties}
  />
)}

{activePage === 'season-config' && (
  <SeasonConfigPage
    seasons={seasons}
    onSeasonsChange={setSeasons}
  />
)}

{activePage === 'travel-agent-rate' && (
  <TravelAgentRateConfig
    agents={travelAgents}
    seasons={seasons}
    categoryColors={categoryColors}
    travelAgentRates={travelAgentRates}
    onRatesChange={setTravelAgentRates}
  />
)}

{activePage === 'room-floor' && (
  <FloorPage
    floors={floors}
    rooms={rooms}
    floorFilter={floorFilter}
    setFloorFilter={setFloorFilter}
    setFloors={setFloors}
    categoryColors={categoryColors}
  />
)}

{activePage === 'cancel-list' && (
  <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>
    <div style={{ fontSize: '3rem', marginBottom: 12 }}>🚧</div>
    <h3 style={{ color: '#555', margin: '0 0 8px' }}>Coming Soon</h3>
    <p style={{ fontSize: '0.85rem' }}>This section is under development.</p>
  </div>
)}
            </div>
          )}
        </div>
      </div>

      

      {/* ── Block Room Modal ── */}
      <Modal open={blockModalOpen} onClose={() => setBlockModalOpen(false)}>
        <form onSubmit={handleBlockSubmit} style={{ width: 340, padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#7b241c' }}>🚫 Block Room</h3>
          <label style={lbl}>Category
            <select value={blockForm.category} onChange={e => setBlockForm({ ...blockForm, category: e.target.value, roomName: '' })} style={inp}>
              <option value="">Select category</option>
              {Object.keys(categoryColors).map(c => <option key={c}>{c}</option>)}
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
      <DncManager
  open={dncOverrideOpen}
  booking={dncBooking}
  targetRoom={dncTargetRoom}
  onApprove={handleDncApprove}
  onCancel={handleDncCancel}
/>
    </div>
  );
}


export default App;