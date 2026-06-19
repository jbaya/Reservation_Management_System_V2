import { useState, useCallback } from 'react';

/**
 * Owns the "Block Room" form (category/room/reason/dates) and its submit
 * handler. Local-only — pushes directly into booking state with no backend
 * persistence, exactly matching the original App.jsx behaviour.
 */
export function useBlockRoom({ isOverlap, setBookings, onBlocked }) {
  const [blockForm, setBlockForm] = useState({ category: '', roomName: '', reason: '', arrival: '', departure: '' });

  const handleBlockSubmit = useCallback((e) => {
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
      numGuests: 0,
      mealPlan: '—',
      notes: blockForm.reason,
      timestamp: new Date().toISOString(),
      comments: [],
    };

    if (isOverlap(newBlock)) { alert('Room overlap!'); return; }

    setBookings(prev => [...prev, newBlock]);
    setBlockForm({ category: '', roomName: '', reason: '', arrival: '', departure: '' });
    onBlocked?.();
  }, [blockForm, isOverlap, setBookings, onBlocked]);

  return { blockForm, setBlockForm, handleBlockSubmit };
}
