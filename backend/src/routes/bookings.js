import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET all bookings
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM bookings ORDER BY created_at DESC'
    );
    // Convert snake_case to camelCase for frontend
    const bookings = rows.map(row => ({
      id:                  row.id,
      guestName:           row.guest_name,
      phone:               row.phone,
      email:               row.email,
      nationality:         row.nationality,
      roomName:            row.room_name,
      roomCategory:        row.room_category,
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
      bookingId:           row.booking_id,
      agentName:           row.agent_name,
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

    // Helper: coerce incoming numeric-like values to numbers or null/defaults
    const toNumber = (v, fallback = null) => {
      if (v === undefined || v === null || v === '') return fallback;
      if (typeof v === 'number') return v;
      const n = Number(v);
      return Number.isNaN(n) ? fallback : n;
    };

    const numGuests = toNumber(b.numGuests, 1);
    const numChildren = toNumber(b.numChildren, 0);
    const baseRate = toNumber(b.baseRate, null);
    const extraChildCharge = toNumber(b.extraChildCharge, null);
    const extraBedCharge = toNumber(b.extraBedCharge, null);
    const discount = toNumber(b.discount, 0);
    const advanceParticulars = toNumber(b.advanceParticulars, 0);
    const paidAmount = toNumber(b.paidAmount, 0);
    const balance = toNumber(b.balance, 0);
    const totalAmount = toNumber(b.totalAmount, null);
    const { rows } = await db.query(`
      INSERT INTO bookings (
        id, guest_name, phone, email, nationality,
        room_name, room_category, arrival, departure,
        arrival_time, departure_time, num_guests, num_children,
        children_ages, meal_plan, status, source,
        ota_platform, booking_id, agent_name, base_rate,
        extra_child_charge, extra_bed, extra_bed_charge,
        discount, advance_particulars, advance_payment_type,
        payment_status, payment_mode, total_amount,
        paid_amount, balance, tags, dnc,
        is_multi_room, rooms, comments, audit_trail
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
        $14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,
        $25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,
        $36,$37,$38
      )
      ON CONFLICT (id) DO UPDATE SET
        guest_name=$2, status=$16, payment_status=$28,
        total_amount=$30, comments=$37, audit_trail=$38
      RETURNING *`,
      [
        b.id, b.guestName, b.phone, b.email, b.nationality,
        b.roomName, b.roomCategory, b.arrival, b.departure,
        b.arrivalTime, b.departureTime, numGuests, numChildren,
        JSON.stringify(b.childrenAges || []),
        b.mealPlan, b.status, b.source,
        b.otaPlatform, b.bookingId, b.agentName, baseRate,
        extraChildCharge, b.extraBed, extraBedCharge,
        discount, advanceParticulars, b.advancePaymentType,
        b.paymentStatus, b.paymentMode, totalAmount,
        paidAmount, balance,
        b.tags || [], b.dnc || false,
        b.isMultiRoom || false,
        JSON.stringify(b.rooms || []),
        JSON.stringify(b.comments || []),
        JSON.stringify(b.auditTrail || [])
      ]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const b = req.body;

    // Sanitize numeric fields (same as POST)
    const toNumber = (v, fallback = null) => {
      if (v === undefined || v === null || v === '') return fallback;
      if (typeof v === 'number') return v;
      const n = Number(v);
      return Number.isNaN(n) ? fallback : n;
    };

    const numGuests = toNumber(b.numGuests, 1);
    const numChildren = toNumber(b.numChildren, 0);
    const baseRate = toNumber(b.baseRate, null);
    const extraChildCharge = toNumber(b.extraChildCharge, null);
    const extraBedCharge = toNumber(b.extraBedCharge, null);
    const discount = toNumber(b.discount, 0);
    const advanceParticulars = toNumber(b.advanceParticulars, 0);
    const paidAmount = toNumber(b.paidAmount, 0);
    const balance = toNumber(b.balance, 0);
    const totalAmount = toNumber(b.totalAmount, null);

    const { rows } = await db.query(
      `
      UPDATE bookings
      SET
        guest_name = $1,
        phone = $2,
        email = $3,
        nationality = $4,
        room_name = $5,
        room_category = $6,
        arrival = $7,
        departure = $8,
        arrival_time = $9,
        departure_time = $10,
        num_guests = $11,
        num_children = $12,
        children_ages = $13,
        meal_plan = $14,
        status = $15,
        source = $16,
        ota_platform = $17,
        booking_id = $18,
        agent_name = $19,
        base_rate = $20,
        extra_child_charge = $21,
        extra_bed = $22,
        extra_bed_charge = $23,
        discount = $24,
        advance_particulars = $25,
        advance_payment_type = $26,
        payment_status = $27,
        payment_mode = $28,
        total_amount = $29,
        paid_amount = $30,
        balance = $31,
        tags = $32,
        dnc = $33,
        is_multi_room = $34,
        rooms = $35,
        comments = $36,
        audit_trail = $37
      WHERE id = $38
      RETURNING *
      `,
      [
        b.guestName, b.phone, b.email, b.nationality,
        b.roomName, b.roomCategory, b.arrival, b.departure,
        b.arrivalTime, b.departureTime, numGuests, numChildren,
        JSON.stringify(b.childrenAges || []),
        b.mealPlan, b.status, b.source,
        b.otaPlatform, b.bookingId, b.agentName, baseRate,
        extraChildCharge, b.extraBed, extraBedCharge,
        discount, advanceParticulars, b.advancePaymentType,
        b.paymentStatus, b.paymentMode, totalAmount,
        paidAmount, balance,
        b.tags || [], b.dnc || false,
        b.isMultiRoom || false,
        JSON.stringify(b.rooms || []),
        JSON.stringify(b.comments || []),
        JSON.stringify(b.auditTrail || []),
        req.params.id
      ]
    );

    // Convert snake_case to camelCase (same as GET route)
    // PUT /:id ke andar — rows[0] ke baad ye block replace karo:
const row = rows[0];

// ✅ Date format helper (same as GET route)
const fmtDate = (d) => d
  ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  : null;

const booking = {
  id:                  row.id,
  guestName:           row.guest_name,
  phone:               row.phone,
  email:               row.email,
  nationality:         row.nationality,
  roomName:            row.room_name,
  roomCategory:        row.room_category,
  arrival:             fmtDate(row.arrival),   // ✅ Fixed
  departure:           fmtDate(row.departure), // ✅ Fixed
  arrivalTime:         row.arrival_time,
  departureTime:       row.departure_time,
  numGuests:           row.num_guests,
  numChildren:         row.num_children,
  childrenAges:        row.children_ages || [],
  mealPlan:            row.meal_plan,
  status:              row.status,
  source:              row.source,
  otaPlatform:         row.ota_platform,
  bookingId:           row.booking_id,
  agentName:           row.agent_name,
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
};

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