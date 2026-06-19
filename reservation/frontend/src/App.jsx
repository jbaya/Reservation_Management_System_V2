import { useCallback, useMemo, useState } from 'react';
import { addMonths, subMonths, format, addDays } from 'date-fns';

// ── Components ─────────────────────────────────────────────────────────────────
import CalendarView from './components/CalendarView.jsx';
import Modal from './components/Modal.jsx';
import DncManager from './components/DncManager';

import LoginPage from './pages/LoginPage.jsx';
import UserPage  from './pages/UserPage.jsx';

import { Home, LogOut } from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
import { sidebarMenus } from './constants/sidebarMenus.jsx';

// ── Hooks ─────────────────────────────────────────────────────────────────────
// All data-fetching, mutation, and domain logic that used to live inline in
// this component has been extracted into hooks. App.jsx is now responsible
// only for wiring hooks together and rendering — no direct API calls here.
import { useAuth } from './hooks/useAuth.js';
import { useSearch } from './hooks/useSearch.js';
import { useReferenceData } from './hooks/useReferenceData.js';
import { useBookings } from './hooks/useBookings.js';
import { useDncOverride } from './hooks/useDncOverride.js';
import { useCategoryActions } from './hooks/useCategoryActions.js';
import { useRoomActions } from './hooks/useRoomActions.js';
import { useBlockRoom } from './hooks/useBlockRoom.js';

// ── Pages ─────────────────────────────────────────────────────────────────────
import RoomCategoryPage from './pages/RoomCategoryPage.jsx';
import RoomNoPage from './pages/RoomNoPage.jsx';
import NewReservationPage from './pages/NewReservationPage.jsx';
import MultiRoomReservationPage from './pages/MultiRoomReservationPage.jsx';
import ViewReservationPage from './pages/ViewReservationPage.jsx';
import ViewTariffPage from './pages/ViewTariffPage.jsx';
import EditTariffPage from './pages/EditTariffPage.jsx';
import TravelAgentPage from './pages/TravelAgentPage.jsx';
import TravelAgentRateConfig from './pages/TravelAgentRateConfig.jsx';
import SeasonConfigPage from './pages/SeasonConfigPage.jsx';
import FloorPage from './pages/FloorPage.jsx';
import Dashboard2 from './pages/Dashboard2.jsx';
import SpecialDatesPage from './pages/SpecialDatesPage.jsx';

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
function App() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const { loggedUser, login, logout } = useAuth();

  // ── Search ────────────────────────────────────────────────────────────────
  const { searchQuery, setSearchQuery, debouncedSearch, isSearching } = useSearch();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [showCalendar,   setShowCalendar]   = useState(true);
  const [showDashboard,  setShowDashboard]  = useState(false);
  const [selectedDate,   setSelectedDate]   = useState(new Date());
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [guestTagFilter, setGuestTagFilter] = useState('all');
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [activePage,     setActivePage]     = useState(null);
  const [expandedMenu,   setExpandedMenu]   = useState(null);
  const [floorFilter,    setFloorFilter]    = useState('all');
  const [editingBooking, setEditingBooking] = useState(null);
  const [modalOpen,      setModalOpen]      = useState(false);  // kept for future modal use
  const [blockModalOpen, setBlockModalOpen] = useState(false);

  // ── Reference data (categories, rooms, floors, agents, seasons, ...) ───────
  const {
    travelAgents,     setTravelAgents,
    seasons,           setSeasons,
    travelAgentRates,  setTravelAgentRates,
    thirdParties,      setThirdParties,
    rooms,             setRooms,
    categoryColors,    setCategoryColors,
    floors,            setFloors,
    specialDates,      setSpecialDates,
  } = useReferenceData(loggedUser);

  // ── Bookings (data + overlap check + derived lists/stats + mutations) ─────
  const {
    bookings, setBookings,
    isOverlap,
    normalizedBookings,
    filteredBookings,
    stats: { activeToday, occupancyRate, pendingPayment, checkinsToday, checkoutsToday },
    saveBooking: persistBooking,
    updateBooking: handleUpdateBooking,
    quickBook: handleQuickBook,
  } = useBookings(loggedUser, rooms, { filterStatus, guestTagFilter, search: debouncedSearch });

  // ── DNC override flow ───────────────────────────────────────────────────────
  const {
    dncOverrideOpen, dncBooking, dncTargetRoom,
    requestDncOverride, handleDncApprove, handleDncCancel,
  } = useDncOverride({ setBookings, loggedUser, onResolved: () => setActivePage(null) });

  // ── Category / room CRUD ────────────────────────────────────────────────────
  const { handleAddCategory, handleEditCategory, handleDeleteCategory } =
    useCategoryActions({ categoryColors, setCategoryColors, rooms, setRooms, bookings });

  const { handleAddRoom, handleDeleteRoom, handleUpdateRoom } =
    useRoomActions({ bookings, setRooms });

  // ── Block room ───────────────────────────────────────────────────────────────
  const { blockForm, setBlockForm, handleBlockSubmit } =
    useBlockRoom({ isOverlap, setBookings, onBlocked: () => setBlockModalOpen(false) });

  // ── Save booking (thin UI-nav wrapper around the hook mutation) ────────────
  const handleSaveBooking = useCallback(async (data) => {
    const ok = await persistBooking(data);
    if (ok) {
      setModalOpen(false);
      setEditingBooking(null);
      setActivePage(null);
      setShowCalendar(true);
    }
  }, [persistBooking]);

  // ── Context-menu actions ──────────────────────────────────────────────────
  const handleContextAction = useCallback((action, booking) => {
    switch (action) {
      case 'edit':
      case 'view':
        setEditingBooking(booking);
        setActivePage(booking.isMultiRoom ? 'multi-room-reservation' : 'new-reservation');
        break;

      case 'note':
        // TODO: open a focused note/comment panel instead of full edit
        setEditingBooking(booking);
        setActivePage(booking.isMultiRoom ? 'multi-room-reservation' : 'new-reservation');
        break;

      case 'changeroom':
        // TODO: open a dedicated room-change dialog
        setEditingBooking(booking);
        setActivePage(booking.isMultiRoom ? 'multi-room-reservation' : 'new-reservation');
        break;

      case 'checkin':
        handleUpdateBooking(booking.id, { status: 'checked-in' });
        break;

      case 'checkout':
        handleUpdateBooking(booking.id, { status: 'checked-out' });
        break;

      case 'cancel':
      case 'unblock':
        handleUpdateBooking(booking.id, { status: 'cancelled' });
        break;

      default:
        break;
    }
  }, [handleUpdateBooking]);

  // ── Derived UI data ───────────────────────────────────────────────────────
  const sortedCategories = useMemo(() =>
    Object.keys(categoryColors).sort(
      (a, b) => rooms.filter(r => r.category === a).length - rooms.filter(r => r.category === b).length
    ),
  [categoryColors, rooms]);

  const roomsInCat = useCallback(
    (cat) => rooms.filter(r => r.category === cat).map(r => r.name),
    [rooms]
  );

  // ── Shared inline styles (kept minimal — move to CSS file when ready) ──────
  const btn = { padding: '6px 14px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' };
  const inp = { padding: '6px 9px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.8rem', width: '100%', boxSizing: 'border-box', outline: 'none' };
  const lbl = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.82rem', color: '#444' };

   if (!loggedUser) {
    return <LoginPage onLoginSuccess={login} />;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f0f2f5', overflow: 'auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── Top Bar ── */}
      <header className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1a2e', flexShrink: 0, zIndex: 200 }}>
        <div className="topbar-left" style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => setSidebarOpen(p => !p)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: '1.2rem', padding: '4px 6px', borderRadius: 5, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', justifyContent: 'center' }}
            aria-label="Toggle sidebar"
          >
            <span style={{ display: 'block', width: 20, height: 2, background: '#fff', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 20, height: 2, background: '#fff', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 20, height: 2, background: '#fff', borderRadius: 2 }} />
          </button>

          <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>🏨 Hotel RMS</h1>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />

          <button
            onClick={() => { setShowCalendar(true); setFloorFilter('all'); setActivePage(null); setShowDashboard(false); }}
            style={{ ...btn, background: showCalendar ? '#f39c12' : 'rgba(255,255,255,0.12)', color: '#fff', border: showCalendar ? '2px solid #f1c40f' : '1px solid rgba(255,255,255,0.25)', fontSize: '0.75rem', padding: '4px 12px', boxShadow: showCalendar ? '0 0 8px rgba(243,156,18,0.5)' : 'none', transition: 'all 0.2s' }}
          >
            📅 Calendar
          </button>

          {showCalendar && (
            <>
              <button
                onClick={() => setSelectedDate(new Date())}
                style={{ ...btn, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.75rem', padding: '4px 10px' }}
              >
                Today
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: 6 }}>
                <button onClick={() => setSelectedDate(p => subMonths(p, 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#fff', fontSize: '1rem', padding: '0 4px' }}>‹</button>
                <span style={{ minWidth: 105, textAlign: 'center', fontWeight: 700, fontSize: '0.82rem', color: '#fff' }}>{format(selectedDate, 'MMMM yyyy')}</span>
                <button onClick={() => setSelectedDate(p => addMonths(p, 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#fff', fontSize: '1rem', padding: '0 4px' }}>›</button>
              </div>
            </>
          )}

          {showCalendar && (
            <div style={{ position: 'relative', width: 'min(420px, 100%)', flex: 1, minWidth: 220 }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Booking ID / Guest Name / Source"
                style={{ ...inp, width: '100%', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.75rem', padding: '4px 36px 4px 12px' }}
              />
              {isSearching && (
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#fff', fontSize: '0.7rem' }}>⏳</span>
              )}
              {!isSearching && searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', padding: 2 }}
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {showCalendar && (
          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setShowDashboard(p => !p)}
              style={{ ...btn, background: showDashboard ? '#1e3a8a' : '#2563eb', color: '#fff', fontSize: '0.75rem', padding: '4px 12px', boxShadow: showDashboard ? '0 0 8px rgba(37,99,235,0.4)' : 'none' }}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setBlockModalOpen(true)}
              style={{ ...btn, background: '#7b241c', color: '#fff', fontSize: '0.75rem', padding: '4px 10px' }}
            >
              🚫 Block
            </button>
            <button
              onClick={() => { setEditingBooking(null); setSidebarOpen(true); setExpandedMenu('reservation'); setActivePage('new-reservation'); }}
              style={{ ...btn, background: '#1565c0', color: '#fff', fontSize: '0.75rem', padding: '4px 12px' }}
            >
              + Reservation
            </button>
          </div>
        )}
      </header>

      {/* ── Main layout ── */}
      <div className="main-layout" style={{ flex: 1, display: 'flex', overflow: 'visible', position: 'relative' }}>

        {/* ── Sidebar ── */}
        <div className="sidebar-panel" style={{ width: sidebarOpen ? 240 : 0, minWidth: sidebarOpen ? 240 : 0, background: '#1e2a3a', transition: 'width 0.25s ease, min-width 0.25s ease', overflow: 'hidden', flexShrink: 0, display: 'flex', flexDirection: 'column', zIndex: 100, boxShadow: sidebarOpen ? '4px 0 16px rgba(0,0,0,0.2)' : 'none' }}>
          <div style={{ width: 240, flex: 1, overflowY: 'auto' }}>

            {/* User card */}
            <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1565c0, #42a5f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>
                {loggedUser?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem' }}>{loggedUser?.name || 'Admin'}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem' }}>{loggedUser?.role || 'Administrator'}</div>
              </div>
            </div>

            {/* Home */}
            <div
              onClick={() => { setActivePage(null); setShowCalendar(true); setShowDashboard(false); setFloorFilter('all'); }}
              style={{ padding: '10px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: activePage === null ? '#64b5f6' : 'rgba(255,255,255,0.7)', background: activePage === null ? 'rgba(100,181,246,0.1)' : 'transparent', borderLeft: activePage === null ? '3px solid #64b5f6' : '3px solid transparent', fontSize: '0.85rem', fontWeight: activePage === null ? 700 : 500, transition: 'all 0.15s' }}
              onMouseEnter={e => { if (activePage !== null) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if (activePage !== null) e.currentTarget.style.background = 'transparent'; }} 
            >
              <Home size={16} />
              <span>Home</span>
            </div>

            {/* Accordion menus */}
            {sidebarMenus.map(menu => (
              <div key={menu.key}>
                <div
                  onClick={() => setExpandedMenu(expandedMenu === menu.key ? null : menu.key)}
                  style={{ padding: '10px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'rgba(255,255,255,0.85)', background: expandedMenu === menu.key ? 'rgba(255,255,255,0.05)' : 'transparent', fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.15s', borderTop: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = expandedMenu === menu.key ? 'rgba(255,255,255,0.05)' : 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
  {menu.icon}
  <span>{menu.label}</span>
</div>
                  <span style={{ fontSize: '0.7rem', transition: 'transform 0.2s', transform: expandedMenu === menu.key ? 'rotate(180deg)' : 'none' }}>▼</span>
                </div>

                {expandedMenu === menu.key && (
                  <div style={{ background: 'rgba(0,0,0,0.15)' }}>
                    {menu.children.map(child => (
                      <div
                        key={child.key}
                        onClick={() => {
                          // Clear editing state when navigating to reservation forms
                          if (child.key === 'new-reservation' || child.key === 'multi-room-reservation') {
                            setEditingBooking(null);
                          }
                          setActivePage(child.key);
                          setSidebarOpen(true);
                        }}
                        style={{ padding: '8px 18px 8px 36px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: activePage === child.key ? '#64b5f6' : 'rgba(255,255,255,0.6)', background: activePage === child.key ? 'rgba(100,181,246,0.12)' : 'transparent', borderLeft: activePage === child.key ? '3px solid #64b5f6' : '3px solid transparent', fontSize: '0.8rem', fontWeight: activePage === child.key ? 700 : 400, transition: 'all 0.12s' }}
                        onMouseEnter={e => { if (activePage !== child.key) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={e => { if (activePage !== child.key) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span style={{ color: activePage === child.key ? '#64b5f6' : 'rgba(255,255,255,0.5)', flexShrink: 0, display: 'flex' }}>
  {child.icon}
</span>
{child.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Logout */}
            <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', padding: 16 }}>
              <button
                onClick={logout}
                style={{ width: '100%', padding: '8px 0', border: '1px solid rgba(255,100,100,0.3)', borderRadius: 6, background: 'rgba(255,0,0,0.1)', color: '#ff8a80', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
  <LogOut size={14} /> Logout
</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Main Content Area ── */}
        <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'all 0.25s ease' }}>
          {activePage === null ? (
            <>
              {/* Stats Bar */}
              <div className="stats-bar" style={{ background: '#fff', borderBottom: '1px solid #e8eaed', display: 'flex', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                {[
                  { label: 'Occupied',        value: activeToday.length,  color: '#1e8449' },
                  { label: 'Occupancy Rate',  value: `${occupancyRate}%`, color: occupancyRate > 80 ? '#1e8449' : occupancyRate > 50 ? '#e67e22' : '#e74c3c' },
                  { label: 'Check-ins Today', value: checkinsToday,       color: '#1565c0' },
                  { label: 'Check-outs Today',value: checkoutsToday,      color: '#784212' },
                  { label: 'Payment Pending', value: pendingPayment,      color: '#e74c3c' },
                  { label: 'Total Rooms',     value: rooms.length,        color: '#555' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color }}>{value}</span>
                    <span style={{ fontSize: '0.7rem', color: '#888' }}>{label}</span>
                  </div>
                ))}

                
                <div style={{ width: 1, height: 18, background: '#e0e0e0', margin: '0 2px' }} />

                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {['all', 'confirmed', 'tentative', 'checked-in', 'checked-out', 'cancelled', 'blocked'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  value={guestTagFilter}
                  onChange={e => setGuestTagFilter(e.target.value)}
                  style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  <option value="all">All Guests</option>
                  <option value="VIP">VIP</option>
                  <option value="DNC">DNC</option>
                </select>

                

                {/* Category colour legend */}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                  {Object.entries(categoryColors).map(([cat, c]) => (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.65rem' }}>
                      <div style={{ width: 9, height: 9, background: c.bg, border: `2px solid ${c.border}`, borderRadius: 2 }} />
                      <span style={{ color: '#666' }}>{cat}</span>
                    </div>
                  ))}
                   {/* Hint bar */}
              <div style={{ background: '#f7f8fa', borderBottom: '1px solid #eee', padding: '3px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
               
                <div style={{ display: 'flex', gap: 10, fontSize: '0.65rem' }}>
                  {[['Paid', '#27ae60'], ['Partial', '#f39c12'], ['Due', '#e74c3c']].map(([s, c]) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 7, height: 7, background: c, borderRadius: '50%' }} />
                      <span style={{ color: '#888' }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
                </div>

              </div>

              {/* Dashboard overlay */}
              {showDashboard && (
                <Dashboard2
                  rooms={floorFilter === 'all' ? rooms : rooms.filter(r => String(r.floor) === String(floorFilter))}
                  bookings={normalizedBookings}
                  selectedDate={selectedDate}
                  categoryColors={categoryColors}
                  onClose={() => setShowDashboard(false)}
                />
              )}

             

              {/* Calendar */}
              <main className="calendar-main" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {filteredBookings.length === 0 && debouncedSearch ? (
                  <div style={{ flex: 1, background: '#fff', border: '1px solid #ddd', borderRadius: 8, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#777', gap: 10 }}>
                    <div style={{ fontSize: '2rem' }}>🔍</div>
                    <div style={{ fontWeight: 700 }}>No Records Found</div>
                    <div style={{ fontSize: '0.8rem' }}>Try another search</div>
                  </div>
                ) : (
                  <CalendarView
                    requestDncOverride={requestDncOverride}
                    rooms={rooms}
                    bookings={filteredBookings}
                    selectedDate={selectedDate}
                    specialDates={specialDates}
                    categoryColors={categoryColors}
                    onCellClick={(roomName, day) => {
  setEditingBooking({
    _prefill: true,
    roomName: roomName,
    roomCategory: rooms.find(r => r.name === roomName)?.category || '',
    arrival: format(day, 'yyyy-MM-dd'),
    departure: format(addDays(day, 1), 'yyyy-MM-dd'),
  });
  setSidebarOpen(true);
  setExpandedMenu('reservation');
  setActivePage('new-reservation');
}}
                    onFullEdit={booking => {
                      setModalOpen(false);
                      setSidebarOpen(true);
                      setExpandedMenu('reservation');
                      setEditingBooking(booking);
                      setActivePage(booking.isMultiRoom ? 'multi-room-reservation' : 'new-reservation');
                    }}
                    onBookingDoubleClick={booking => {
                      setModalOpen(false);
                      setSidebarOpen(true);
                      setExpandedMenu('reservation');
                      setEditingBooking(booking);
                      setActivePage(booking.isMultiRoom ? 'multi-room-reservation' : 'new-reservation');
                    }}
                    onUpdateBooking={handleUpdateBooking}
                    onQuickBook={handleQuickBook}
                    onContextAction={handleContextAction}
                  />
                )}
              </main>
            </>
          ) : (
            /* ── Page views ── */
            <div style={{ flex: 1, overflowY: 'auto', background: '#f8f9fa' }}>
              {/* Breadcrumb */}
              <div className="page-breadcrumb" style={{ background: '#fff', borderBottom: '1px solid #e8eaed', display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setActivePage(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1565c0', fontSize: '0.82rem', fontWeight: 600, padding: 0 }}
                >
                  🏠 Home
                </button>
                <span style={{ color: '#ccc' }}>›</span>
                <span style={{ fontSize: '0.82rem', color: '#555', fontWeight: 600, textTransform: 'capitalize' }}>
                  {activePage?.replace(/-/g, ' ')}
                </span>
              </div>

            {activePage === 'room-category' && (
  <RoomCategoryPage
    categoryColors={categoryColors}
    rooms={rooms}
    floors={floors}          
    onAddCategory={handleAddCategory}
    onDeleteCategory={handleDeleteCategory}
    onEditCategory={handleEditCategory}
  />
)}

              {activePage === 'room-no' && (
                <RoomNoPage
  rooms={rooms}
  floors={floors}
  categoryColors={categoryColors}
  onAddRoom={handleAddRoom}
  onDeleteRoom={handleDeleteRoom}
   onUpdateRoom={handleUpdateRoom}
/>
              )}

              {activePage === 'new-reservation' && (
                <NewReservationPage
                  key={editingBooking?.id ?? 'new'}   // re-initialise form when booking changes
                  requestDncOverride={requestDncOverride}
                  editingBooking={editingBooking}
                  currentUser={loggedUser}
                  rooms={rooms}
                  categoryColors={categoryColors}
                  bookings={bookings}
                  onSave={handleSaveBooking}
                  travelAgents={travelAgents}
                  thirdParties={thirdParties}
                  seasons={seasons}
                  travelAgentRates={travelAgentRates}
                />
              )}

              {activePage === 'multi-room-reservation' && (
                <MultiRoomReservationPage
                  key={editingBooking?.id ?? 'new'}   // re-initialise form when booking changes
                  editingBooking={editingBooking}
                  currentUser={loggedUser}
                  rooms={rooms}
                  categoryColors={categoryColors}
                  bookings={bookings}
                  onSave={handleSaveBooking}
                  travelAgents={travelAgents}
                  thirdParties={thirdParties}
                  seasons={seasons}
                  travelAgentRates={travelAgentRates}
                />
              )}

              {activePage === 'view-reservation' && (
                <ViewReservationPage
                  bookings={bookings}
                  rooms={rooms}
                  categoryColors={categoryColors}
                  currentUser={loggedUser}
                  travelAgents={travelAgents}
                  seasons={seasons}
                  travelAgentRates={travelAgentRates}
                  onUpdateBooking={handleUpdateBooking}
                />
              )}

              {activePage === 'room-tariff'      && <ViewTariffPage categoryColors={categoryColors} />}
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
                <SeasonConfigPage seasons={seasons} onSeasonsChange={setSeasons} />
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

              {activePage === 'special-dates' && (
  <SpecialDatesPage
    specialDates={specialDates}
    onSpecialDatesChange={setSpecialDates}
  />
)}

{activePage === 'users' && (
  <UserPage />
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
        <form onSubmit={handleBlockSubmit} style={{ width: 'min(340px, 100%)', padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#7b241c' }}>🚫 Block Room</h3>

          <label style={lbl}>Category
            <select
              value={blockForm.category}
              onChange={e => setBlockForm({ ...blockForm, category: e.target.value, roomName: '' })}
              style={inp}
            >
              <option value="">Select category</option>
              {Object.keys(categoryColors).map(c => <option key={c}>{c}</option>)}
            </select>
          </label>

          <label style={lbl}>Room
            <select
              value={blockForm.roomName}
              onChange={e => setBlockForm({ ...blockForm, roomName: e.target.value })}
              required
              style={inp}
            >
              <option value="">Select room</option>
              {roomsInCat(blockForm.category).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label style={lbl}>From
              <input type="date" value={blockForm.arrival}   onChange={e => setBlockForm({ ...blockForm, arrival: e.target.value })}   required style={inp} />
            </label>
            <label style={lbl}>To
              <input type="date" value={blockForm.departure} onChange={e => setBlockForm({ ...blockForm, departure: e.target.value })} required style={inp} />
            </label>
          </div>

          <label style={lbl}>Reason
            <textarea
              value={blockForm.reason}
              onChange={e => setBlockForm({ ...blockForm, reason: e.target.value })}
              rows={2}
              style={{ ...inp, resize: 'vertical' }}
            />
          </label>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setBlockModalOpen(false)} style={{ ...btn, background: '#f5f5f5', color: '#333', border: '1px solid #ddd' }}>Cancel</button>
            <button type="submit" style={{ ...btn, background: '#7b241c', color: '#fff' }}>Block</button>
          </div>
        </form>
      </Modal>

      {/* ── DNC Override Manager ── */}
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
