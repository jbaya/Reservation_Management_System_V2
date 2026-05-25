// utils/Rateutil.js
// Central rate resolution, totals calculation, override tracking, and audit for Hotel RMS.
// Used by: BookingForm.jsx, MultiRoomReservationPage.jsx, ViewReservationPage.jsx

// ─── Booking source constants ─────────────────────────────────────────────────
export const BOOKING_SOURCES = {
  DIRECT: 'direct',
  AGENT:  'agent',
  OTA:    'OTA',
  WALKIN: 'walkin',
};

// OTA sources never expose rates in the UI — pricing is managed externally
export const OTA_RATE_HIDDEN_SOURCES = [BOOKING_SOURCES.OTA];

// Roles allowed to manually override auto-resolved rates
export const RATE_OVERRIDE_ROLES = ['Admin', 'Manager', 'Administrator'];

// ─── Permission helper ────────────────────────────────────────────────────────
/**
 * Returns true if the given user is allowed to manually override rates.
 * @param {{ name: string, role: string }} user
 */
export function canUserOverrideRates(user) {
  if (!user) return false;
  return RATE_OVERRIDE_ROLES.includes(user.role) || user.name === 'Admin';
}

// ─── Rate visibility helper ───────────────────────────────────────────────────
/**
 * Returns whether rate fields should be visible for a given booking source.
 * OTA bookings hide rates entirely — pricing is externally managed.
 * @param {string} source  One of BOOKING_SOURCES values
 */
export function shouldShowRateFields(source) {
  return !OTA_RATE_HIDDEN_SOURCES.includes(source);
}

/**
 * Returns whether rate fields should be editable for a given booking source + user.
 * - Direct / Walk-in → always editable
 * - Agent → editable only for override-permitted roles
 * - OTA → never editable
 * @param {string} source
 * @param {{ name: string, role: string }} user
 */
export function isRateEditable(source, user) {
  if (source === BOOKING_SOURCES.OTA) return false;
  if (source === BOOKING_SOURCES.AGENT) return canUserOverrideRates(user);
  return true; // direct, walkin
}

// ─── Core rate resolver ───────────────────────────────────────────────────────
/**
 * Resolves the correct room rate and extra person rate for a booking.
 *
 * Resolution priority:
 *   1. Agent seasonal rate  (agent + matching season)
 *   2. Agent off-season rate
 *   3. First agent rate found
 *   4. baseRate fallback (for direct / walk-in)
 *   5. 0 (default)
 *
 * @param {{
 *   travelAgentRates: Array,
 *   seasons: Array,
 *   agent: { id, name } | null,
 *   category: string,
 *   arrival: string,        // ISO date string
 *   departure?: string,
 *   baseRate?: number,
 *   source?: string,        // BOOKING_SOURCES value
 * }} params
 *
 * @returns {{
 *   rate: number,
 *   extraPersonRate: number,
 *   source: 'agent' | 'direct' | 'default',
 *   agentName?: string,
 *   seasonName?: string,
 *   seasonId?: string,
 *   rateId?: string,
 *   label: string,           // human-readable source label for UI
 * }}
 */
export function resolveRate({
  travelAgentRates = [],
  seasons = [],
  agent,
  category,
  arrival,
  departure,
  baseRate,
  source = BOOKING_SOURCES.DIRECT,
}) {
  // OTA — rates are externally managed, return a sentinel
  if (source === BOOKING_SOURCES.OTA) {
    return {
      rate: 0,
      extraPersonRate: 0,
      source: 'ota',
      label: 'OTA — Rate managed externally',
    };
  }

  // Direct / Walk-in — use baseRate, no auto-resolution
  if (source === BOOKING_SOURCES.DIRECT || source === BOOKING_SOURCES.WALKIN) {
    return {
      rate: baseRate ?? 0,
      extraPersonRate: 0,
      source: 'direct',
      label: 'Direct — Manual entry',
    };
  }

  // Agent — resolve from travelAgentRates
  if (!agent || !travelAgentRates?.length) {
    return {
      rate: baseRate ?? 0,
      extraPersonRate: 0,
      source: 'default',
      label: 'No agent rate found — using default',
    };
  }

  // Filter rates for this agent + room category
  // Support both agentId match and agentName match for compatibility
  const agentRates = travelAgentRates.filter(r =>
    (r.agentId === agent.id || r.agentName === agent.name) &&
    (r.category === category || r.roomCategory === category)
  );

  if (!agentRates.length) {
    return {
      rate: baseRate ?? 0,
      extraPersonRate: 0,
      source: 'default',
      label: `No rate configured for ${agent.name} — ${category}`,
    };
  }

  // Match season by arrival date
  const arrDate = new Date(arrival);
  const matchedSeason = seasons?.find(s => {
    const from = new Date(s.startDate || s.fromDate);
    const to   = new Date(s.endDate   || s.toDate);
    return arrDate >= from && arrDate <= to;
  }) ?? null;

  const seasonalRate  = matchedSeason
    ? agentRates.find(r => r.seasonId === matchedSeason.id)
    : null;
  const offSeasonRate = agentRates.find(r => !r.seasonId || r.seasonId === 'off');
  const resolved      = seasonalRate || offSeasonRate || agentRates[0];

  return {
    rate:            resolved.ratePerNight ?? resolved.roomRate ?? 0,
    extraPersonRate: resolved.extraPersonRate ?? 0,
    source:          'agent',
    agentName:       agent.name,
    seasonName:      matchedSeason?.name ?? 'Off-Season',
    seasonId:        matchedSeason?.id ?? null,
    rateId:          resolved.id ?? null,
    label:           `Auto: ${agent.name} · ${matchedSeason?.name ?? 'Off-Season'}`,
  };
}

// ─── Totals calculator ────────────────────────────────────────────────────────
/**
 * Calculates all monetary totals for a booking.
 * Works for both single-room and multi-room (pass rooms array).
 *
 * Single-room usage:
 *   calcTotals({ arrival, departure, rate, extraPersonRate, extraPersons, advanceParticulars })
 *
 * Multi-room usage:
 *   calcTotals({ arrival, departure, rooms: [{ rate, extraPersonRate, extraPersons }], advanceParticulars })
 *
 * @returns {{ nights, roomTotal, extraTotal, totalAmount, advance, balance }}
 */
export function calcTotals({
  arrival,
  departure,
  rate,
  extraPersonRate = 0,
  occupancy = 1,
  extraPersons = 0,
  advanceParticulars = 0,
  rooms, // optional array for multi-room
}) {
  const nights = Math.max(
    1,
    Math.round((new Date(departure) - new Date(arrival)) / 86_400_000)
  );

  let roomTotal  = 0;
  let extraTotal = 0;

  if (Array.isArray(rooms) && rooms.length) {
    // Multi-room: sum across all rooms
    rooms.forEach(r => {
      roomTotal  += (parseFloat(r.rate)            || 0) * nights;
      extraTotal += (parseFloat(r.extraPersonRate)  || 0) * (parseInt(r.extraPersons) || 0) * nights;
    });
  } else {
    // Single-room
    roomTotal  = (parseFloat(rate)            || 0) * nights;
    extraTotal = (parseFloat(extraPersonRate)  || 0) * (parseInt(extraPersons) || 0) * nights;
  }

  const totalAmount = roomTotal + extraTotal;
  const advance     = Number(advanceParticulars) || 0;
  const balance     = Math.max(0, totalAmount - advance);

  return { nights, roomTotal, extraTotal, totalAmount, advance, balance };
}

// ─── Override helpers ─────────────────────────────────────────────────────────
/**
 * Creates a rate override record to attach to a room or booking.
 * Call this when a user manually changes a rate that was auto-resolved.
 *
 * @param {{ previousRate: number, newRate: number, user: { name, role }, roomName?: string, category?: string }} params
 * @returns {object} auditEntry
 */
export function createOverrideAuditEntry({ previousRate, newRate, user, roomName, category }) {
  return {
    action:       'RATE_OVERRIDE',
    user:         user?.name ?? 'Unknown',
    role:         user?.role ?? 'Unknown',
    timestamp:    new Date().toISOString(),
    previousRate,
    newRate,
    roomName:     roomName ?? null,
    category:     category ?? null,
    details:      `Rate changed from ₹${previousRate} → ₹${newRate}/night${roomName ? ` for ${roomName}` : ''}`,
  };
}

/**
 * Applies a manual rate override to a room object.
 * Returns a new room object — does not mutate the original.
 *
 * @param {object} room         The current room state object
 * @param {number} newRate      The new rate entered by the user
 * @param {object} user         The logged-in user { name, role }
 * @returns {object}            Updated room with override flags set
 */
export function applyRateOverride(room, newRate, user) {
  const auditEntry = createOverrideAuditEntry({
    previousRate: room.isRateOverridden
      ? room.originalRateDetails?.rate ?? room.rate
      : room.rate,
    newRate,
    user,
    roomName: room.roomName,
    category: room.roomCategory,
  });

  return {
    ...room,
    rate:               newRate,
    isRateOverridden:   true,
    rateOverriddenBy:   user?.name ?? 'Unknown',
    rateOverriddenAt:   auditEntry.timestamp,
    originalRateDetails: room.originalRateDetails ?? { rate: room.rate },
    auditTrail:         [...(room.auditTrail ?? []), auditEntry],
  };
}

/**
 * Resets a room's rate back to the auto-resolved value.
 * Clears override flags but preserves audit trail for history.
 *
 * @param {object} room
 * @param {object} user
 * @returns {object} Updated room with override cleared
 */
export function resetRateOverride(room, user) {
  const resetEntry = {
    action:    'RATE_RESET',
    user:      user?.name ?? 'Unknown',
    role:      user?.role ?? 'Unknown',
    timestamp: new Date().toISOString(),
    details:   `Rate reset from ₹${room.rate} back to auto-resolved rate`,
  };

  return {
    ...room,
    rate:               room.originalRateDetails?.rate ?? room.rate,
    isRateOverridden:   false,
    rateOverriddenBy:   null,
    rateOverriddenAt:   null,
    originalRateDetails: null,
    auditTrail:         [...(room.auditTrail ?? []), resetEntry],
  };
}