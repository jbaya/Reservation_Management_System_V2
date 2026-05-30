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
      arrival:             row.arrival,
      departure:           row.departure,
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
        b.arrivalTime, b.departureTime, b.numGuests || 1, b.numChildren || 0,
        JSON.stringify(b.childrenAges || []),
        b.mealPlan, b.status, b.source,
        b.otaPlatform, b.bookingId, b.agentName, b.baseRate,
        b.extraChildCharge, b.extraBed, b.extraBedCharge,
        b.discount || 0, b.advanceParticulars || 0, b.advancePaymentType,
        b.paymentStatus, b.paymentMode, b.totalAmount,
        b.paidAmount || 0, b.balance || 0,
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