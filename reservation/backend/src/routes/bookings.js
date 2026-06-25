import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET all bookings
router.get('/', async (req, res, next) => {
  try {
    
    const { rows } = await db.query(`
  SELECT
    b.*,
    r.room_no,
    rc.category,
    COALESCE(array_agg(DISTINCT bt.tag) FILTER (WHERE bt.tag IS NOT NULL), '{}') AS tags
  FROM bookings b
  LEFT JOIN booking_rooms br ON b.id = br.booking_id
  LEFT JOIN rooms r ON br.room_id = r.room_id
  LEFT JOIN room_categories rc ON r.category_id = rc.id
  LEFT JOIN booking_tags bt ON b.id = bt.booking_id
  GROUP BY b.id, r.room_no, rc.category
  ORDER BY b.created_at DESC
`);
    // Convert snake_case to camelCase for frontend
    const bookings = rows.map(row => ({
      id:                  row.id,
      guestName:           row.guest_name,
      phone:               row.phone,
      email:               row.email,
      nationality:         row.nationality,
      roomName: row.room_no || '',
roomCategory: row.category || '',
     arrival: row.arrival
  ? `${row.arrival.getFullYear()}-${String(row.arrival.getMonth() + 1).padStart(2, '0')}-${String(row.arrival.getDate()).padStart(2, '0')}`
  : null,

departure: row.departure
  ? `${row.departure.getFullYear()}-${String(row.departure.getMonth() + 1).padStart(2, '0')}-${String(row.departure.getDate()).padStart(2, '0')}`
  : null,
      arrivalTime:         row.arrival_time,
      departureTime:       row.departure_time,
      numGuests:           row.num_guests,
      numChildren:         row.num_children,
      childrenAges:        row.children_ages || [],
      mealPlan:            row.meal_plan,
      status:              row.status,
      source:              row.source,
      otaPlatform:         row.ota_platform,
     bookingId: row.external_booking_ref,
agentName: '',
      baseRate:            row.base_rate,
      extraChildCharge:    row.extra_child_charge,
      extraBed:            row.extra_bed,
      extraBedCharge:      row.extra_bed_charge,
      discount:            row.discount,
      advanceParticulars:  row.advance_particulars,
      advancePaymentType:  row.advance_payment_type,
      paymentStatus:       row.payment_status,
      paymentMode:         row.payment_mode,
      totalAmount:         row.total_amount,
      paidAmount:          row.paid_amount,
      balance:             row.balance,
      tags:                row.tags || [],
      dnc:                 row.dnc,
      isMultiRoom:         row.is_multi_room,
      rooms:               row.rooms || [],
      comments:            row.comments || [],
      auditTrail:          row.audit_trail || [],
      timestamp:           row.created_at,
    }));
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

// POST - save booking
router.post('/', async (req, res, next) => {
  try {
    const b = req.body;
console.log('BOOKING DATA =>', b);
    // Helper: coerce incoming numeric-like values to numbers or null/defaults
    const toNumber = (v, fallback = null) => {
      if (v === undefined || v === null || v === '') return fallback;
      if (typeof v === 'number') return v;
      const n = Number(v);
      return Number.isNaN(n) ? fallback : n;
    };

    const numGuests        = toNumber(b.numGuests, 1);
const numChildren      = toNumber(b.numChildren, 0);
const baseRate         = toNumber(b.baseRate ?? b.rooms?.[0]?.rate, 0);
const extraChildCharge = toNumber(b.extraChildCharge ?? b.rooms?.[0]?.extraPersonRate, 0);
const extraBedCharge   = toNumber(b.extraBedCharge, 0);
const discount         = toNumber(b.discount, 0);
const advanceParticulars = toNumber(b.advanceParticulars, 0);
const paidAmount       = toNumber(b.paidAmount, 0);
const balance          = toNumber(b.balance, 0);
const totalAmount      = toNumber(b.totalAmount, 0);
    console.log('CATEGORY ID =>', b.categoryId);
console.log('PAYMENT STATUS =>', b.paymentStatus);
   const { rows } = await db.query(
  `
INSERT INTO bookings (
  id,
  guest_name,
  phone,
  email,
  nationality,
  category_id,
  agent_id,
  third_party_id,
  arrival,
  departure,
  arrival_time,
  departure_time,
  num_guests,
  num_children,
  children_ages,
  meal_plan,
  status,
  source,
  ota_platform,
  external_booking_ref,
  base_rate,
  extra_child_charge,
  extra_bed,
  extra_bed_charge,
  discount,
  advance_particulars,
  advance_payment_type,
  payment_status,
  payment_mode,
  total_amount,
  paid_amount,
  balance,
  dnc,
  is_multi_room
)
VALUES (
  $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
  $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
  $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
  $31,$32,$33,$34
)
RETURNING *
`,
[
  b.id,
  b.guestName,
  b.phone,
  b.email,
  b.nationality,
  b.categoryId,
  b.agentId,
  b.thirdPartyId,
  b.arrival,
  b.departure,
  b.arrivalTime,
  b.departureTime,
  numGuests,
  numChildren,
  b.childrenAges || [],
  b.mealPlan || 'EP',
  b.status,
  b.source,
  b.otaPlatform,
  b.externalBookingRef,
  baseRate,
  extraChildCharge,
  b.extraBed,
  extraBedCharge,
  discount,
  advanceParticulars,
  b.advancePaymentType,
  b.paymentStatus === 'due' ? 'pending' : b.paymentStatus,
  b.paymentMode,
  totalAmount,
  paidAmount,
  balance,
  b.dnc,
   b.isMultiRoom ?? false
]
);

const savedBooking = rows[0];

if (b.rooms?.length) {
  for (const room of b.rooms) {

    const roomResult = await db.query(
      `SELECT room_id
       FROM rooms
       WHERE room_no = $1`,
      [room.roomName]
    );

    if (roomResult.rows.length) {
      await db.query(
        `INSERT INTO booking_rooms
         (booking_id, room_id)
         VALUES ($1, $2)`,
        [
          savedBooking.id,
          roomResult.rows[0].room_id
        ]
      );
    }
  }
}
// ✅ ADD THIS HERE
if (b.tags?.length) {
  for (const tag of b.tags) {
    await db.query(
      `INSERT INTO booking_tags (booking_id, tag) VALUES ($1, $2)`,
      [savedBooking.id, tag]
    );
  }
}
res.status(201).json(savedBooking);
  } catch (error) {
  console.error('BOOKING SAVE ERROR =>', error);
  res.status(500).json({
    error: error.message
  });
}
});

router.put('/:id', async (req, res, next) => {
  try {
    const b = req.body;

    const toNumber = (v, fallback = null) => {
      if (v === undefined || v === null || v === '') return fallback;
      if (typeof v === 'number') return v;
      const n = Number(v);
      return Number.isNaN(n) ? fallback : n;
    };

    const numGuests        = toNumber(b.numGuests, 1);
    const numChildren      = toNumber(b.numChildren, 0);
    const baseRate         = toNumber(b.baseRate ?? b.rooms?.[0]?.rate, 0);
const extraChildCharge = toNumber(b.extraChildCharge ?? b.rooms?.[0]?.extraPersonRate, 0);
const extraBedCharge   = toNumber(b.extraBedCharge, 0);
    const discount         = toNumber(b.discount, 0);
    const advanceParticulars = toNumber(b.advanceParticulars, 0);
    const paidAmount       = toNumber(b.paidAmount, 0);
    const balance          = toNumber(b.balance, 0);
    const totalAmount      = toNumber(b.totalAmount, null);

    const { rows } = await db.query(
      `
      UPDATE bookings
      SET
        guest_name           = $1,
        phone                = $2,
        email                = $3,
        nationality          = $4,
        arrival              = $5,
        departure            = $6,
        arrival_time         = $7,
        departure_time       = $8,
        num_guests           = $9,
        num_children         = $10,
        children_ages        = $11,
        meal_plan            = $12,
        status               = $13,
        source               = $14,
        ota_platform         = $15,
        external_booking_ref = $16,
        base_rate            = $17,
        extra_child_charge   = $18,
        extra_bed            = $19,
        extra_bed_charge     = $20,
        discount             = $21,
        advance_particulars  = $22,
        advance_payment_type = $23,
        payment_status       = $24,
        payment_mode         = $25,
        total_amount         = $26,
        paid_amount          = $27,
        balance              = $28,
      dnc                  = $29,
        is_multi_room        = $30
      WHERE id = $31
      RETURNING *
      `,
      [
        b.guestName,
        b.phone,
        b.email,
        b.nationality,
        b.arrival,
        b.departure,
        b.arrivalTime,
        b.departureTime,
        numGuests,
        numChildren,
        b.childrenAges || [],
        b.mealPlan,
        b.status,
        b.source,
        b.otaPlatform,
        b.bookingId || b.externalBookingRef || null,
        baseRate,
        extraChildCharge,
        b.extraBed,
        extraBedCharge,
        discount,
        advanceParticulars,
        b.advancePaymentType,
        b.paymentStatus === 'due' ? 'pending' : b.paymentStatus,
        b.paymentMode,
        totalAmount,
        paidAmount,
        balance,
       b.dnc || false,
        b.isMultiRoom || false,
        req.params.id,
      ]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Update booking_rooms junction table
    if (b.rooms?.length) {
      // Delete old room links
      await db.query(`DELETE FROM booking_rooms WHERE booking_id = $1`, [req.params.id]);

      // Insert new room links
      for (const room of b.rooms) {
        const roomResult = await db.query(
          `SELECT room_id FROM rooms WHERE room_no = $1`,
          [room.roomName]
        );
        if (roomResult.rows.length) {
          await db.query(
            `INSERT INTO booking_rooms (booking_id, room_id) VALUES ($1, $2)`,
            [req.params.id, roomResult.rows[0].room_id]
          );
        }
      }
    } else if (b.roomName) {
      // Single room booking
      await db.query(`DELETE FROM booking_rooms WHERE booking_id = $1`, [req.params.id]);
      const roomResult = await db.query(
        `SELECT room_id FROM rooms WHERE room_no = $1`,
        [b.roomName]
      );
      if (roomResult.rows.length) {
        await db.query(
          `INSERT INTO booking_rooms (booking_id, room_id) VALUES ($1, $2)`,
          [req.params.id, roomResult.rows[0].room_id]
        );
      }
    }

    const row = rows[0];

    const fmtDate = (d) => d
      ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      : null;

    const booking = {
      id:                  row.id,
      guestName:           row.guest_name,
      phone:               row.phone,
      email:               row.email,
      nationality:         row.nationality,
      arrival:             fmtDate(row.arrival),
      departure:           fmtDate(row.departure),
      arrivalTime:         row.arrival_time,
      departureTime:       row.departure_time,
      numGuests:           row.num_guests,
      numChildren:         row.num_children,
      childrenAges:        row.children_ages || [],
      mealPlan:            row.meal_plan,
      status:              row.status,
      source:              row.source,
      otaPlatform:         row.ota_platform,
      bookingId:           row.external_booking_ref,
      baseRate:            row.base_rate,
      extraChildCharge:    row.extra_child_charge,
      extraBed:            row.extra_bed,
      extraBedCharge:      row.extra_bed_charge,
      discount:            row.discount,
      advanceParticulars:  row.advance_particulars,
      advancePaymentType:  row.advance_payment_type,
      paymentStatus:       row.payment_status,
      paymentMode:         row.payment_mode,
      totalAmount:         row.total_amount,
      paidAmount:          row.paid_amount,
      balance:             row.balance,
      dnc:                 row.dnc || false,
      isMultiRoom:         row.is_multi_room,
      roomName:            b.roomName || b.rooms?.[0]?.roomName || '',
      roomCategory:        b.roomCategory || b.rooms?.[0]?.roomCategory || '',
      rooms:               b.rooms || [],
      tags:                b.tags || [],
      comments:            b.comments || [],
      auditTrail:          b.auditTrail || [],
      timestamp:           row.created_at,
    };

    // Update booking_tags
    await db.query(`DELETE FROM booking_tags WHERE booking_id = $1`, [req.params.id]);
    if (b.tags?.length) {
      for (const tag of b.tags) {
        await db.query(
          `INSERT INTO booking_tags (booking_id, tag) VALUES ($1, $2)`,
          [req.params.id, tag]
        );
      }
    }

    res.json(booking);
  } catch (error) {
    console.error('UPDATE ERROR =>', error);
    next(error);
  }
});
// DELETE booking
router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM bookings WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});



export default router;