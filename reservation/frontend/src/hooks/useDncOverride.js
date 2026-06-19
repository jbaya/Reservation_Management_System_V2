import { useState, useCallback } from 'react';

/**
 * Owns the "Do Not Change" override flow: a guarded confirmation that must
 * be approved (with a reason, for the audit trail) before a DNC-flagged
 * booking can be moved to a different room. Exact port of the original
 * App.jsx dnc state + handlers; `onResolved` replaces the inline
 * `setActivePage(null)` so this hook has no UI-navigation knowledge.
 */
export function useDncOverride({ setBookings, loggedUser, onResolved }) {
  const [dncOverrideOpen, setDncOverrideOpen] = useState(false);
  const [dncBooking, setDncBooking] = useState(null);
  const [dncTargetRoom, setDncTargetRoom] = useState(null);
  /**
   * Storing a function in state requires the () => fn pattern so React
   * doesn't invoke it immediately as an updater. Always set via:
   *   setDncAfterApprove(() => myCallback)
   * and read via:
   *   if (dncAfterApprove) dncAfterApprove()
   */
  const [dncAfterApprove, setDncAfterApprove] = useState(null);

  const requestDncOverride = useCallback((booking, targetRoom = null, afterApprove = null) => {
    setDncBooking(booking);
    setDncTargetRoom(targetRoom);
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
                  action: 'DNC_OVERRIDE',
                  admin: loggedUser?.name || 'Admin',
                  reason,
                  previousRoom: b.roomName,
                  newRoom: dncTargetRoom?.name || b.roomName,
                  timestamp: new Date().toISOString(),
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
    onResolved?.();
  }, [dncBooking, dncTargetRoom, dncAfterApprove, loggedUser, setBookings, onResolved]);

  const handleDncCancel = useCallback(() => {
    setDncOverrideOpen(false);
    setDncBooking(null);
    setDncTargetRoom(null);
    setDncAfterApprove(null);
  }, []);

  return {
    dncOverrideOpen,
    dncBooking,
    dncTargetRoom,
    requestDncOverride,
    handleDncApprove,
    handleDncCancel,
  };
}
