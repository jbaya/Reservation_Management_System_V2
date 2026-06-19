import { format } from 'date-fns';

// Pure booking-domain logic, kept free of React state so it's easy to read,
// reuse, and (eventually) unit test independently of the useBookings hook.

/** True if newItem overlaps any existing, non-cancelled booking for the same room. */
export function checkOverlap(bookings, newItem, ignoreId = null) {
  const arr1 = new Date(newItem.arrival);
  const dep1 = new Date(newItem.departure);
  return bookings.some(b => {
    if (b.roomName !== newItem.roomName) return false;
    if (ignoreId && b.id === ignoreId) return false;
    const arr2 = new Date(b.arrival);
    const dep2 = new Date(b.departure);
    return arr1 < dep2 && arr2 < dep1 && !['cancelled', 'no-show'].includes(b.status);
  });
}

/** Flattens multi-room bookings into one row per room so the calendar can render each room independently. */
export function normalizeBookings(bookings) {
  return bookings.flatMap(b => {
    if (b.rooms?.length) {
      return b.rooms.map((room, idx) => ({
        ...b,
        roomName: room.roomName,
        roomCategory: room.roomCategory,
        occupancy: room.occupancy || 1,
        extraPersons: room.extraPersons || 0,
        baseRate: room.rate || b.baseRate || 0,
        dnc: room.dnc || false,
        multiRoomIndex: idx + 1,
      }));
    }
    return [{ ...b, dnc: b.tags?.includes('DNC') || false }];
  });
}

/** Applies status/tag/search filters on top of the normalized booking list. */
export function filterBookings(normalizedBookings, { filterStatus, guestTagFilter, search }) {
  const q = (search || '').trim().toLowerCase();
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
      b.guestName || '',
      b.bookingId || '',
      b.roomName || '',
      b.source || '',
      b.otaPlatform || '',
    ].join(' ').toLowerCase();

    return matchStatus && matchTag && haystack.includes(q);
  });
}

/** Dashboard/stats-bar numbers derived from the normalized booking list. */
export function computeBookingStats(normalizedBookings, rooms) {
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  const valid = normalizedBookings.filter(b => rooms.some(r => r.name === b.roomName));

  const activeToday = valid.filter(b =>
    new Date(b.arrival) <= now &&
    new Date(b.departure) > now &&
    !['cancelled', 'no-show', 'blocked'].includes(b.status)
  );

  return {
    activeToday,
    occupancyRate: rooms.length > 0 ? Math.round((activeToday.length / rooms.length) * 100) : 0,
    pendingPayment: valid.filter(b => b.paymentStatus === 'due' || b.paymentStatus === 'partial').length,
    checkinsToday: valid.filter(b => b.arrival === todayStr && !['cancelled', 'no-show', 'blocked'].includes(b.status)).length,
    checkoutsToday: valid.filter(b => b.departure === todayStr && !['cancelled', 'no-show', 'blocked'].includes(b.status)).length,
  };
}
