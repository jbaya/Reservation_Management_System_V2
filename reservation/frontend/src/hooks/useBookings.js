import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBookings, saveBooking as apiSaveBooking, updateBooking as apiUpdateBooking } from '../api.js';
import { checkOverlap, normalizeBookings, filterBookings, computeBookingStats } from '../utils/bookingLogic.js';

/**
 * Owns booking data plus every booking-domain operation: loading, overlap
 * checks, the normalized/filtered views the calendar renders, dashboard
 * stats, and the save/update/quick-book mutations.
 *
 * UI navigation (closing modals, switching pages) is the caller's
 * responsibility — saveBooking/updateBooking/quickBook return a success
 * boolean so the caller knows whether to navigate away, matching the
 * original App.jsx behaviour exactly.
 */
export function useBookings(loggedUser, rooms, { filterStatus, guestTagFilter, search }) {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!loggedUser) return;
    getBookings()
      .then(data => setBookings(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [loggedUser]);

  const reloadBookings = useCallback(async () => {
    const fresh = await getBookings();
    setBookings(Array.isArray(fresh) ? fresh : []);
    return fresh;
  }, []);

  const isOverlap = useCallback(
    (newItem, ignoreId = null) => checkOverlap(bookings, newItem, ignoreId),
    [bookings]
  );

  const normalizedBookings = useMemo(() => normalizeBookings(bookings), [bookings]);

  const filteredBookings = useMemo(
    () => filterBookings(normalizedBookings, { filterStatus, guestTagFilter, search }),
    [normalizedBookings, filterStatus, guestTagFilter, search]
  );

  const stats = useMemo(
    () => computeBookingStats(normalizedBookings, rooms),
    [normalizedBookings, rooms]
  );

  /** Saves a new booking or updates an existing one. Returns true on success. */
  const saveBooking = useCallback(async (data) => {
    if (!data.isMultiRoom && isOverlap(data, data.id)) {
      alert('Room overlap! Please choose different dates or a different room.');
      return false;
    }

    try {
      const now = new Date().toISOString();
      const isEdit = data.id && bookings.some(b => b.id === data.id);

      if (isEdit) {
        await apiUpdateBooking(data.id, { ...data, timestamp: now });
      } else {
        const bookingToSave = { ...data, id: data.id || `b${Date.now()}`, timestamp: now };
        await apiSaveBooking(bookingToSave);
      }

      await reloadBookings();
      return true;
    } catch (err) {
      console.error('❌ Booking save failed', err);
      alert('Failed to save booking');
      return false;
    }
  }, [isOverlap, bookings, reloadBookings]);

  /** Merges `updates` into the existing booking and persists it. */
  const updateBooking = useCallback(async (id, updates) => {
    try {
      const existingBooking = bookings.find(b => b.id === id);
      if (!existingBooking) {
        console.error('Booking not found:', id);
        return false;
      }

      const mergedBooking = { ...existingBooking, ...updates };
      await apiUpdateBooking(id, mergedBooking);
      await reloadBookings();
      return true;
    } catch (err) {
      console.error('Update booking failed', err);
      alert('Failed to update booking');
      return false;
    }
  }, [bookings, reloadBookings]);

  /** Optimistic, local-only booking add used by calendar quick-book (no persistence — matches prior behavior). */
  const quickBook = useCallback((data) => {
    if (isOverlap(data)) {
      alert('Room overlap!');
      return false;
    }
    setBookings(prev => [...prev, { ...data, id: `b${Date.now()}`, timestamp: new Date().toISOString() }]);
    return true;
  }, [isOverlap]);

  return {
    bookings, setBookings,
    isOverlap,
    normalizedBookings,
    filteredBookings,
    stats,
    saveBooking,
    updateBooking,
    quickBook,
  };
}
