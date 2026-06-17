import { useCallback, useEffect, useMemo, useState } from 'react';
import { addMonths, subMonths, format, addDays } from 'date-fns';

// ── Components ─────────────────────────────────────────────────────────────────
import CalendarView from './components/CalendarView.jsx';
import Modal from './components/Modal.jsx';
import DncManager from './components/DncManager';

// ── Constants ─────────────────────────────────────────────────────────────────
import { AUTO_COLORS, initialCategoryColors } from './constants/colors.js';
import { initialThirdParties } from './constants/rooms.js';// add to existing import line

import LoginPage from './pages/LoginPage.jsx';
import UserPage  from './pages/UserPage.jsx';

import {
  Home, BedDouble, CalendarDays, Users, Settings,
  Building2, ClipboardList, UserCog, Star, Hotel,
  LogOut, LayoutDashboard, ShieldAlert, PlusCircle
} from 'lucide-react';


// ── Utils ─────────────────────────────────────────────────────────────────────
import { sortRoomList } from './utils/roomUtils.js';
import {
  getCategories,
  saveCategory,
  getBookings,
  updateCategory,
  deleteCategory,
getRooms,
getAllRoomNumbers,
saveRoom,
deleteRoom,
updateRoom,
  updateRoomCategory,

  getAgents,
  saveAgent,
  deleteAgent,

  getThirdParties,
  saveThirdParty,
  deleteThirdParty,

  getSeasons,
saveSeason,
updateSeason,
deleteSeason,

getRates,

getFloors,
saveFloor,
deleteFloor,

 updateBooking,
 saveBooking,
 getSpecialDates

} from './api.js';

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

// ── Helpers ───────────────────────────────────────────────────────────────────
/**
 * Parse a room's floor value into a sortable integer.
 * Basement → -1, Ground → 0, numeric string → that number,
 * fallback derives from room name (e.g. "302" → floor 3).
 */
function parseFloor(r) {
  if (r.floor !== undefined && r.floor !== null && r.floor !== '') {
    if (r.floor === 'Basement') return -1;
    if (r.floor === 'Ground')   return 0;
    const p = parseInt(r.floor);
    if (!isNaN(p)) return p;
  }
  const n = parseInt(r.name);
  if (isNaN(n) || n < 100) return 1;
  return Math.floor(n / 100);
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
function App() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  // Read once on mount; avoids JSON.parse on every render.
  const [loggedUser, setLoggedUser] = useState(() => {
  try {
    const stored = localStorage.getItem('rms_loggedIn');
    return stored ? JSON.parse(stored) : null;  // null = not logged in
  } catch {
    return null;
  }
});



  // ── Core data ─────────────────────────────────────────────────────────────
  const [travelAgents,     setTravelAgents]     = useState([]);
  const [seasons,          setSeasons]           = useState([]);
  const [travelAgentRates, setTravelAgentRates]  = useState([]);
  const [thirdParties,     setThirdParties]      = useState(initialThirdParties);
  const [bookings, setBookings] = useState([]);
 const [rooms, setRooms] = useState([]);
const [categoryColors, setCategoryColors] = useState({});

  // ── UI state ──────────────────────────────────────────────────────────────
  const [showCalendar,   setShowCalendar]   = useState(true);
  const [showDashboard,  setShowDashboard]  = useState(false);
  const [selectedDate,   setSelectedDate]   = useState(new Date());
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [guestTagFilter, setGuestTagFilter] = useState('all');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [debouncedSearch,setDebouncedSearch]= useState('');
  const [isSearching,    setIsSearching]    = useState(false);
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [activePage,     setActivePage]     = useState(null);
  const [expandedMenu,   setExpandedMenu]   = useState(null);
  const [floorFilter,    setFloorFilter]    = useState('all');
  const [editingBooking, setEditingBooking] = useState(null);
  const [modalOpen,      setModalOpen]      = useState(false);  // kept for future modal use
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [specialDates, setSpecialDates] = useState([]);
  const [blockForm,      setBlockForm]      = useState({ category: '', roomName: '', reason: '', arrival: '', departure: '' });

  // ── DNC override state ────────────────────────────────────────────────────
  const [dncOverrideOpen, setDncOverrideOpen] = useState(false);
  const [dncBooking,      setDncBooking]      = useState(null);
  const [dncTargetRoom,   setDncTargetRoom]   = useState(null);
  /**
   * Storing a function in state requires the () => fn pattern so React
   * doesn't invoke it immediately as an updater. Always set via:
   *   setDncAfterApprove(() => myCallback)
   * and read via:
   *   if (dncAfterApprove) dncAfterApprove()
   */
  const [dncAfterApprove, setDncAfterApprove] = useState(null);

  // ── Floors ────────────────────────────────────────────────────────────────
const [floors, setFloors] = useState([]);

  // Re-sort rooms whenever the list length changes (e.g. add/delete).
  useEffect(() => {
    setRooms(prev => {
      const sorted = sortRoomList(prev);
      const same = sorted.every((r, i) => r.name === prev[i]?.name);
      return same ? prev : sorted;
    });
  }, [rooms.length]);

  // ── Search debounce ───────────────────────────────────────────────────────
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setIsSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load all data — only when user is logged in
useEffect(() => {
  if (!loggedUser) return;   // ← skip if not authenticated

  getCategories().then(rows => {
    if (Array.isArray(rows) && rows.length > 0) {
      const colors = {};
      rows.forEach(row => {
        const hex = row.color || '#1565c0';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        colors[row.category] = {
          bg: `rgba(${r}, ${g}, ${b}, 0.18)`,
          border: hex,
          num_rooms: row.num_rooms
        };
      });
      setCategoryColors(colors);
    }
  }).catch(console.error);

  getRooms().then(data => {
    if (Array.isArray(data) && data.length > 0) {
      setRooms(sortRoomList(data));
    }
  }).catch(console.error);

  getAgents()
  .then(data => {
    setTravelAgents(Array.isArray(data) ? data : []);
  })
  .catch(console.error);

  getThirdParties()
  .then(data => {
    setThirdParties(Array.isArray(data) ? data : []);
  })
  .catch(console.error);

  getSeasons()
  .then(data => {
    setSeasons(Array.isArray(data) ? data : []);
  })
  .catch(console.error);

  getRates()
  .then(data => {
    setTravelAgentRates(Array.isArray(data) ? data : []);
  })
  .catch(console.error);

  getBookings()
  .then(data => {
    setBookings(Array.isArray(data) ? data : []);
  })
  .catch(console.error);

  getFloors()
  .then(data => {
    if (Array.isArray(data) && data.length > 0) {
      setFloors(
        data.map(f => f.floorNo).sort((a,b) => a-b)
      );
    }
  })
  .catch(console.error);

  getSpecialDates()
  .then(data => setSpecialDates(Array.isArray(data) ? data : []))
  .catch(console.error);

}, [loggedUser]);

  // ── Overlap check (single source of truth) ────────────────────────────────
  /**
   * Returns true if newItem overlaps any existing booking for the same room.
   * Pass ignoreId to exclude the booking being edited.
   */
  const isOverlap = useCallback((newItem, ignoreId = null) => {
    const arr1 = new Date(newItem.arrival);
    const dep1 = new Date(newItem.departure);
    return bookings.some(b => {
      if (b.roomName !== newItem.roomName) return false;
      if (ignoreId && b.id === ignoreId)   return false;
      const arr2 = new Date(b.arrival);
      const dep2 = new Date(b.departure);
      return arr1 < dep2 && arr2 < dep1 && !['cancelled', 'no-show'].includes(b.status);
    });
  }, [bookings]);

  // ── Derived booking lists (memoized) ──────────────────────────────────────
  /**
   * Flatten multi-room bookings into one row per room so the calendar
   * can render each room independently.
   */
  const normalizedBookings = useMemo(() =>
    bookings.flatMap(b => {
      if (b.rooms?.length) {
        return b.rooms.map((room, idx) => ({
          ...b,
          roomName:      room.roomName,
          roomCategory:  room.roomCategory,
          occupancy:     room.occupancy     || 1,
          extraPersons:  room.extraPersons  || 0,
          baseRate:      room.rate || b.baseRate || 0,
          dnc:           room.dnc           || false,
          multiRoomIndex: idx + 1,
        }));
      }
      return [{ ...b, dnc: b.tags?.includes('DNC') || false }];
    }),
  [bookings]);

  const filteredBookings = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return normalizedBookings.filter(b => {
      const matchStatus = filterStatus === 'all' || b.status === filterStatus;
      const matchTag =
        guestTagFilter === 'all' ||
        (guestTagFilter === 'VIP' && b.tags?.includes('VIP')) ||
        (guestTagFilter === 'DNC' && b.tags?.includes('DNC'));

      // Always hide cancelled from other status views
      if (filterStatus !== 'cancelled' && b.status === 'cancelled') return false;

      if (!q) return matchStatus && matchTag;

      const haystack = [
        b.guestName   || '',
        b.bookingId   || '',
        b.roomName    || '',
        b.source      || '',
        b.otaPlatform || '',
      ].join(' ').toLowerCase();

      return matchStatus && matchTag && haystack.includes(q);
    });
  }, [normalizedBookings, filterStatus, guestTagFilter, debouncedSearch]);

  // ── Stats (memoized) ──────────────────────────────────────────────────────
  const { activeToday, occupancyRate, pendingPayment, checkinsToday, checkoutsToday } = useMemo(() => {
    const now     = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const valid   = normalizedBookings.filter(b => rooms.some(r => r.name === b.roomName));

    const activeToday = valid.filter(b =>
      new Date(b.arrival) <= now &&
      new Date(b.departure) > now &&
      !['cancelled', 'no-show', 'blocked'].includes(b.status)
    );

    return {
      activeToday,
      occupancyRate:   rooms.length > 0 ? Math.round((activeToday.length / rooms.length) * 100) : 0,
      pendingPayment:  valid.filter(b => b.paymentStatus === 'due' || b.paymentStatus === 'partial').length,
      checkinsToday:   valid.filter(b => b.arrival   === todayStr && !['cancelled', 'no-show', 'blocked'].includes(b.status)).length,
      checkoutsToday:  valid.filter(b => b.departure === todayStr && !['cancelled', 'no-show', 'blocked'].includes(b.status)).length,
    };
  }, [normalizedBookings, rooms]);

  // ── Booking handlers ──────────────────────────────────────────────────────
  const handleSaveBooking = useCallback(async (data) => {

  if (!data.isMultiRoom && isOverlap(data, data.id)) {
    alert('Room overlap! Please choose different dates or a different room.');
    return;
  }

  try {
    const now = new Date().toISOString();
    const isEdit = data.id && bookings.some(b => b.id === data.id);

    if (isEdit) {
      // ✅ Existing booking — PUT (update)
      await updateBooking(data.id, {
        ...data,
        timestamp: now,
      });
    } else {
      // ✅ New booking — POST (insert)
      const bookingToSave = {
        ...data,
        id: data.id || `b${Date.now()}`,
        timestamp: now,
      };
      await saveBooking(bookingToSave);
    }

    // Fresh data reload
    const freshBookings = await getBookings();
    setBookings(Array.isArray(freshBookings) ? freshBookings : []);

    setModalOpen(false);
    setEditingBooking(null);
    setActivePage(null);
    setShowCalendar(true);

  } catch (err) {
    console.error('❌ Booking save failed', err);
    alert('Failed to save booking');
  }

}, [isOverlap, bookings]);

  // ── DNC handlers ──────────────────────────────────────────────────────────
  const requestDncOverride = useCallback((booking, targetRoom = null, afterApprove = null) => {
    setDncBooking(booking);
    setDncTargetRoom(targetRoom);
    // () => afterApprove stores the function, not its return value.
    setDncAfterApprove(() => afterApprove);
    setDncOverrideOpen(true);
  }, []);

  const handleDncApprove = useCallback((payload) => {
    const reason = typeof payload === 'string' ? payload : payload?.reason || '';
    if (!reason.trim()) {
      alert('Override reason is required');
      return;
    }

    setBookings(prev =>
      prev.map(b =>
        b.id === dncBooking?.id
          ? {
              ...b,
              roomName: dncTargetRoom?.name || b.roomName,
              auditTrail: [
                ...(b.auditTrail || []),
                {
                  action:       'DNC_OVERRIDE',
                  admin:        loggedUser?.name || 'Admin',
                  reason,
                  previousRoom: b.roomName,
                  newRoom:      dncTargetRoom?.name || b.roomName,
                  timestamp:    new Date().toISOString(),
                },
              ],
            }
          : b
      )
    );

    if (dncAfterApprove) dncAfterApprove();

    setDncOverrideOpen(false);
    setDncBooking(null);
    setDncTargetRoom(null);
    setDncAfterApprove(null);
    setActivePage(null);
  }, [dncBooking, dncTargetRoom, dncAfterApprove, loggedUser]);

  const handleDncCancel = useCallback(() => {
    setDncOverrideOpen(false);
    setDncBooking(null);
    setDncTargetRoom(null);
    setDncAfterApprove(null);
  }, []);

  // ── Quick-book (from calendar cell click) ─────────────────────────────────
  const handleQuickBook = useCallback((data) => {
    if (isOverlap(data)) { alert('Room overlap!'); return; }
    setBookings(prev => [...prev, { ...data, id: `b${Date.now()}`, timestamp: new Date().toISOString() }]);
  }, [isOverlap]);

const handleUpdateBooking = useCallback(async (id, updates) => {
  try {
    // ✅ Pehle existing booking dhundho
    const existingBooking = bookings.find(b => b.id === id);
    if (!existingBooking) {
      console.error('Booking not found:', id);
      return;
    }

    // ✅ Existing booking ke saath merge karo — null kabhi nahi aayega
    const mergedBooking = {
      ...existingBooking,
      ...updates,
    };

    await updateBooking(id, mergedBooking);

    const freshBookings = await getBookings();
    setBookings(Array.isArray(freshBookings) ? freshBookings : []);

  } catch (err) {
    console.error('Update booking failed', err);
    alert('Failed to update booking');
  }
}, [bookings]);

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

  // ── In App.jsx — replace handleAddCategory ───────────────────────────────────
const handleAddCategory = useCallback(async (name, roomCount, fromRoom = null, toRoom = null, floor = '1') => {
  const color = AUTO_COLORS[Object.keys(categoryColors).length % AUTO_COLORS.length];
  let newRooms = [];

  if (roomCount && !isNaN(roomCount) && roomCount > 0) {
    const allRoomNumbers = await getAllRoomNumbers();
    const existingNumbers = new Set(allRoomNumbers.map(n => String(n)));

    if (fromRoom !== null && toRoom !== null) {
      for (let num = fromRoom; num <= toRoom; num++) {
        const rn = String(num);
        if (existingNumbers.has(rn)) {
          alert(`Room number ${rn} already exists. Choose a different range.`);
          return;
        }
        newRooms.push({ name: rn, category: name, floor });
      }
    } else {
      const parsedNumbers = allRoomNumbers
        .map(n => parseInt(n, 10))
        .filter(n => !isNaN(n));
      let startNum = parsedNumbers.length > 0 ? Math.max(...parsedNumbers) + 1 : 101;

      for (let i = 0; i < roomCount; i++) {
        let rn = String(startNum + i);
        while (rooms.some(r => r.name === rn) || newRooms.some(r => r.name === rn)) {
          startNum++;
          rn = String(startNum + i);
        }
        newRooms.push({ name: rn, category: name, floor });
      }
    }
  }

  try {
    await saveCategory(name, roomCount || 0, color.border, floor); // pass floor

    for (const room of newRooms) {
      await saveRoom(room);
    }

    setCategoryColors(prev => ({
      ...prev,
      [name]: { ...color, floor },
    }));
    if (newRooms.length > 0) {
      setRooms(sortRoomList([...rooms, ...newRooms]));
    }

  } catch (err) {
    console.error('❌ Save failed:', err);
    alert('Failed to save! Check console.');
  }
}, [categoryColors, rooms]);

const handleEditCategory = useCallback(async (oldName, newName, newColor, newRoomCount, newFloor) => {
  if (oldName !== newName && categoryColors[newName] !== undefined) {
    alert('Category already exists');
    return;
  }

  const targetCount = parseInt(newRoomCount);
  if (isNaN(targetCount) || targetCount < 0) {
    alert('Invalid room count');
    return;
  }

  try {
    // 1. Update category in DB (name, count, color, floor)
    const allCats = await getCategories();
    const catRow  = allCats.find(r => r.category === oldName);
    if (catRow) {
      await updateCategory(catRow.id, newName, targetCount, newColor, newFloor);
    }

    // 2. Rename category on rooms AND update their floor in one call
    if (oldName !== newName || newFloor) {
      await updateRoomCategory(oldName, newName, newFloor);
    }

    // 3. Current rooms for THIS category
    const currentRooms = rooms.filter(
      r => r.category === oldName || r.category === newName
    );
    const currentCount = currentRooms.length;

    // 4. ADD rooms if needed
    if (targetCount > currentCount) {
      // ✅ Use THIS category's own max room number, not global max
      const catRoomNumbers = currentRooms
        .map(r => parseInt(r.name, 10))
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);

      let nextNum = catRoomNumbers.length > 0
        ? Math.max(...catRoomNumbers) + 1
        : 101;

      const allRoomNames = new Set(rooms.map(r => r.name));

      for (let i = 0; i < targetCount - currentCount; i++) {
        while (allRoomNames.has(String(nextNum))) nextNum++;
        await saveRoom({
          name:     String(nextNum),
          category: newName,
          floor:    newFloor || '1',   // ✅ new rooms get correct floor
        });
        allRoomNames.add(String(nextNum));
        nextNum++;
      }
    }

    // 5. DELETE rooms if needed
    if (targetCount < currentCount) {
      const roomsToRemove = currentRooms.slice(targetCount).map(r => r.name);
      const hasActive = roomsToRemove.some(rn =>
        bookings.some(
          b => b.roomName === rn && !['cancelled', 'no-show'].includes(b.status)
        )
      );
      if (hasActive) {
        alert('Cannot reduce — some rooms have active bookings!');
        return;
      }
      for (const rn of roomsToRemove) {
        await deleteRoom(rn);
      }
    }

    // 6. Frontend categoryColors state
    const r = parseInt(newColor.slice(1, 3), 16);
    const g = parseInt(newColor.slice(3, 5), 16);
    const b = parseInt(newColor.slice(5, 7), 16);

    setCategoryColors(prev => {
      const updated = { ...prev };
      updated[newName] = {
        bg:        `rgba(${r}, ${g}, ${b}, 0.18)`,
        border:    newColor,
        num_rooms: targetCount,
        floor:     newFloor,           // ✅ store floor in state too
      };
      if (oldName !== newName) delete updated[oldName];
      return updated;
    });

    // 7. Reload fresh rooms from DB — floor_no will now be correct
    const freshRooms = await getRooms();
    setRooms(sortRoomList(freshRooms));

    alert(`"${newName}" updated successfully`);

  } catch (err) {
    console.error('❌ Edit failed:', err);
    alert('Failed to update! Check console.');
  }
}, [categoryColors, bookings, rooms]);

const handleDeleteCategory = useCallback(async (name) => {
  try {

    // active booking check
    const hasActiveBookings = bookings.some(
      b =>
        rooms.some(r => r.category === name && r.name === b.roomName) &&
        !['cancelled', 'no-show'].includes(b.status)
    );

    if (hasActiveBookings) {
      alert('Cannot delete category with active bookings');
      return;
    }

    // get all categories from DB
    const allCats = await getCategories();

    // find category row
    const catRow = allCats.find(c => c.category === name);

    if (!catRow) {
      alert('Category not found');
      return;
    }

    // delete all rooms of this category from DB
    const categoryRooms = rooms.filter(r => r.category === name);

    for (const room of categoryRooms) {
      await deleteRoom(room.name);
    }

    // delete category from DB
    await deleteCategory(catRow.id);

    // reload fresh DB data
    const freshRooms = await getRooms();
    const freshCategories = await getCategories();

    // rebuild category colors
    const colors = {};

    freshCategories.forEach(row => {
      const hex = row.color || '#1565c0';

      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);

      colors[row.category] = {
        bg: `rgba(${r}, ${g}, ${b}, 0.18)`,
        border: hex,
        num_rooms: row.num_rooms
      };
    });

    setCategoryColors(colors);
    setRooms(sortRoomList(freshRooms));

    alert(`"${name}" deleted successfully`);

  } catch (err) {
    console.error('❌ Delete failed:', err);
    alert('Failed to delete category');
  }
}, [bookings, rooms]);
 const handleAddRoom = useCallback(async (room) => {
  try {

    await saveRoom({
      name: room.name,
      category: room.category,
      floor: room.floor || '1',
      capacity: room.capacity || 2
    });

    const freshRooms = await getRooms();

    setRooms(sortRoomList(freshRooms));

  } catch (err) {
    console.error('❌ Save failed:', err);
    alert('Failed to save room');
  }
}, []);

 const handleDeleteRoom = useCallback(async (name) => {

  if (
    bookings.some(
      b =>
        b.roomName === name &&
        !['cancelled', 'no-show'].includes(b.status)
    )
  ) {
    alert('Cannot delete room with active bookings');
    return;
  }

  if (!window.confirm(`Delete room ${name}?`)) return;

  try {

    // delete from DB
    await deleteRoom(name);

    // reload rooms from DB
    const freshRooms = await getRooms();

    setRooms(sortRoomList(freshRooms));

    alert(`Room ${name} deleted successfully`);

  } catch (err) {
    console.error('❌ Delete failed:', err);
    alert('Failed to delete room');
  }

}, [bookings]);

const handleUpdateRoom = useCallback(
  async (oldRoomNo, updatedRoom) => {
    try {

      await updateRoom(oldRoomNo, {
        roomNo: updatedRoom.roomNo,
        category: updatedRoom.category,
        floor: updatedRoom.floor,
        capacity: updatedRoom.capacity || 2
      });

      const freshRooms = await getRooms();

      setRooms(sortRoomList(freshRooms));

      alert('Room updated successfully');

    } catch (err) {

      console.error(err);

      alert(
        err.message ||
        'Room number already exists'
      );
    }
  },
  []
);

  // ── Block room ────────────────────────────────────────────────────────────
  const handleBlockSubmit = useCallback((e) => {
    e.preventDefault();
    if (!blockForm.roomName || !blockForm.arrival || !blockForm.departure) return;

    const newBlock = {
      id:            `block-${Date.now()}`,
      guestName:     blockForm.reason || 'Blocked',
      roomName:      blockForm.roomName,
      status:        'blocked',
      arrival:       blockForm.arrival,
      departure:     blockForm.departure,
      paymentStatus: 'paid',
      numGuests:     0,
      mealPlan:      '—',
      notes:         blockForm.reason,
      timestamp:     new Date().toISOString(),
      comments:      [],
    };

    if (isOverlap(newBlock)) { alert('Room overlap!'); return; }

    setBookings(prev => [...prev, newBlock]);
    setBlockModalOpen(false);
    setBlockForm({ category: '', roomName: '', reason: '', arrival: '', departure: '' });
  }, [blockForm, isOverlap]);

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

  // ── Sidebar menu definition ───────────────────────────────────────────────
const sidebarMenus = [
  {
    key: 'room',
    label: 'Room Management',
    icon: <BedDouble size={16} />,
    children: [
      { key: 'room-category',    label: 'Room Category',   icon: <Building2 size={14} /> },
      { key: 'room-floor',       label: 'Floor',           icon: <Hotel size={14} /> },
      { key: 'room-no',          label: 'Room No.',        icon: <BedDouble size={14} /> },
      { key: 'special-dates',    label: 'Special Dates',   icon: <Star size={14} /> },
      { key: 'room-tariff',      label: 'View Tariff',     icon: <ClipboardList size={14} /> },
      { key: 'room-edit-tariff', label: 'Edit Tariff',     icon: <Settings size={14} /> },
    ],
  },
  {
    key: 'user-management',
    label: 'User Management',
    icon: <UserCog size={16} />,
    children: [
      { key: 'users', label: 'Users', icon: <Users size={14} /> },
    ],
  },
  {
    key: 'reservation',
    label: 'Reservation',
    icon: <CalendarDays size={16} />,
    children: [
      { key: 'new-reservation',       label: 'New Reservation',        icon: <PlusCircle size={14} /> },
      { key: 'view-reservation',      label: 'View Reservation',       icon: <ClipboardList size={14} /> },
      { key: 'cancel-list',           label: 'Cancel List',            icon: <ShieldAlert size={14} /> },
      { key: 'travel-agent',          label: 'Travel Agent',           icon: <Users size={14} /> },
      { key: 'season-config',         label: 'Season Configuration',   icon: <Settings size={14} /> },
      { key: 'travel-agent-rate',     label: 'Agent Rate Config',      icon: <Settings size={14} /> },
    ],
  },
];
  // ── Shared inline styles (kept minimal — move to CSS file when ready) ──────
  const btn = { padding: '6px 14px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' };
  const inp = { padding: '6px 9px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.8rem', width: '100%', boxSizing: 'border-box', outline: 'none' };
  const lbl = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.82rem', color: '#444' };

   if (!loggedUser) {
    return <LoginPage onLoginSuccess={(user) => setLoggedUser(user)} />;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f0f2f5', overflow: 'auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── Top Bar ── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1a2e', padding: '0 18px', height: 48, flexShrink: 0, gap: 10, zIndex: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
      <div style={{ flex: 1, display: 'flex', overflow: 'visible', position: 'relative' }}>

        {/* ── Sidebar ── */}
        <div style={{ width: sidebarOpen ? 240 : 0, minWidth: sidebarOpen ? 240 : 0, background: '#1e2a3a', transition: 'width 0.25s ease, min-width 0.25s ease', overflow: 'hidden', flexShrink: 0, display: 'flex', flexDirection: 'column', zIndex: 100, boxShadow: sidebarOpen ? '4px 0 16px rgba(0,0,0,0.2)' : 'none' }}>
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
                onClick={() => {
  localStorage.removeItem('rms_loggedIn');
  setLoggedUser(null);  // ← add this line
}}
                
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'all 0.25s ease' }}>
          {activePage === null ? (
            <>
              {/* Stats Bar */}
              <div style={{ background: '#fff', borderBottom: '1px solid #e8eaed', padding: '6px 18px', display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
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
              <main style={{ flex: 1, padding: '8px 14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
              <div style={{ background: '#fff', borderBottom: '1px solid #e8eaed', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
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
        <form onSubmit={handleBlockSubmit} style={{ width: 340, padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
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