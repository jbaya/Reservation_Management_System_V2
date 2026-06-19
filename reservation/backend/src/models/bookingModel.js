import { pool } from '../config/db.js';

const SELECT_BASE = `
  SELECT
    b.*,
    rc.category AS category_name,
    ta.name AS agent_name,
    tp.name AS third_party_name,
    COALESCE(rooms_agg.room_numbers, '{}') AS room_numbers,
    COALESCE(rooms_agg.room_ids, '{}') AS room_ids,
    COALESCE(tags_agg.tags, '{}') AS tags
  FROM bookings b
  LEFT JOIN room_categories rc ON rc.id = b.category_id
  LEFT JOIN travel_agents ta ON ta.id = b.agent_id
  LEFT JOIN third_parties tp ON tp.id = b.third_party_id
  LEFT JOIN (
    SELECT br.booking_id, array_agg(r.room_no ORDER BY r.room_no) AS room_numbers,
           array_agg(r.room_id ORDER BY r.room_no) AS room_ids
    FROM booking_rooms br JOIN rooms r ON r.room_id = br.room_id
    GROUP BY br.booking_id
  ) rooms_agg ON rooms_agg.booking_id = b.id
  LEFT JOIN (
    SELECT booking_id, array_agg(tag ORDER BY tag) AS tags
    FROM booking_tags GROUP BY booking_id
  ) tags_agg ON tags_agg.booking_id = b.id
`;

async function attachChildren(client, booking) {
  if (!booking) return booking;
  const [{ rows: comments }, { rows: auditLog }] = await Promise.all([
    client.query('SELECT * FROM booking_comments WHERE booking_id = $1 ORDER BY created_at', [booking.id]),
    client.query('SELECT * FROM booking_audit_log WHERE booking_id = $1 ORDER BY changed_at', [booking.id]),
  ]);
  return { ...booking, comments, auditLog };
}

export const BookingModel = {
  async findAll() {
    const { rows } = await pool.query(`${SELECT_BASE} ORDER BY b.arrival DESC, b.created_at DESC`);
    const ids = rows.map((r) => r.id);
    if (ids.length === 0) return [];
    const [{ rows: comments }, { rows: auditLog }] = await Promise.all([
      pool.query('SELECT * FROM booking_comments WHERE booking_id = ANY($1) ORDER BY created_at', [ids]),
      pool.query('SELECT * FROM booking_audit_log WHERE booking_id = ANY($1) ORDER BY changed_at', [ids]),
    ]);
    const commentsByBooking = new Map();
    for (const c of comments) {
      if (!commentsByBooking.has(c.booking_id)) commentsByBooking.set(c.booking_id, []);
      commentsByBooking.get(c.booking_id).push(c);
    }
    const auditByBooking = new Map();
    for (const a of auditLog) {
      if (!auditByBooking.has(a.booking_id)) auditByBooking.set(a.booking_id, []);
      auditByBooking.get(a.booking_id).push(a);
    }
    return rows.map((r) => ({
      ...r,
      comments: commentsByBooking.get(r.id) || [],
      auditLog: auditByBooking.get(r.id) || [],
    }));
  },

  async findById(id) {
    const { rows } = await pool.query(`${SELECT_BASE} WHERE b.id = $1`, [id]);
    return attachChildren(pool, rows[0] || null);
  },

  /** Creates a booking plus its room/tag associations in a single
   *  transaction — either everything commits or nothing does. Replaces
   *  the old single-table upsert that had no concept of associated rows. */
  async create(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO bookings (
           id, guest_name, phone, email, nationality,
           category_id, agent_id, third_party_id,
           arrival, departure, arrival_time, departure_time,
           num_guests, num_children, children_ages,
           meal_plan, status, source, ota_platform, external_booking_ref,
           base_rate, extra_child_charge, extra_bed, extra_bed_charge, discount,
           advance_particulars, advance_payment_type, payment_status, payment_mode,
           total_amount, paid_amount, balance, dnc, is_multi_room
         ) VALUES (
           $1,$2,$3,$4,$5, $6,$7,$8, $9,$10,$11,$12, $13,$14,$15,
           $16,$17,$18,$19,$20, $21,$22,$23,$24,$25, $26,$27,$28,$29,
           $30,$31,$32,$33,$34
         ) RETURNING id`,
        [
          data.id, data.guestName, data.phone || null, data.email || null, data.nationality || null,
          data.categoryId || null, data.agentId || null, data.thirdPartyId || null,
          data.arrival, data.departure, data.arrivalTime || null, data.departureTime || null,
          data.numGuests ?? 1, data.numChildren ?? 0, JSON.stringify(data.childrenAges ?? []),
          data.mealPlan || null, data.status || 'tentative', data.source || null, data.otaPlatform || null, data.externalBookingRef || null,
          data.baseRate ?? 0, data.extraChildCharge ?? 0, data.extraBed || null, data.extraBedCharge ?? 0, data.discount ?? 0,
          data.advanceParticulars ?? 0, data.advancePaymentType || null, data.paymentStatus || 'pending', data.paymentMode || null,
          data.totalAmount ?? 0, data.paidAmount ?? 0, data.balance ?? 0, data.dnc ?? false, (data.roomIds || []).length > 1,
        ]
      );
      const bookingId = rows[0].id;
      await replaceAssociations(client, bookingId, data.roomIds, data.tags);
      await client.query('COMMIT');
      return this.findById(bookingId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async update(id, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `UPDATE bookings SET
           guest_name = $1, phone = $2, email = $3, nationality = $4,
           category_id = $5, agent_id = $6, third_party_id = $7,
           arrival = $8, departure = $9, arrival_time = $10, departure_time = $11,
           num_guests = $12, num_children = $13, children_ages = $14,
           meal_plan = $15, status = $16, source = $17, ota_platform = $18, external_booking_ref = $19,
           base_rate = $20, extra_child_charge = $21, extra_bed = $22, extra_bed_charge = $23, discount = $24,
           advance_particulars = $25, advance_payment_type = $26, payment_status = $27, payment_mode = $28,
           total_amount = $29, paid_amount = $30, balance = $31, dnc = $32,
           is_multi_room = $33, updated_at = now()
         WHERE id = $34 RETURNING id`,
        [
          data.guestName, data.phone || null, data.email || null, data.nationality || null,
          data.categoryId || null, data.agentId || null, data.thirdPartyId || null,
          data.arrival, data.departure, data.arrivalTime || null, data.departureTime || null,
          data.numGuests ?? 1, data.numChildren ?? 0, JSON.stringify(data.childrenAges ?? []),
          data.mealPlan || null, data.status || 'tentative', data.source || null, data.otaPlatform || null, data.externalBookingRef || null,
          data.baseRate ?? 0, data.extraChildCharge ?? 0, data.extraBed || null, data.extraBedCharge ?? 0, data.discount ?? 0,
          data.advanceParticulars ?? 0, data.advancePaymentType || null, data.paymentStatus || 'pending', data.paymentMode || null,
          data.totalAmount ?? 0, data.paidAmount ?? 0, data.balance ?? 0, data.dnc ?? false,
          (data.roomIds || []).length > 1, id,
        ]
      );
      if (!rows[0]) {
        await client.query('ROLLBACK');
        return null;
      }
      if (data.roomIds !== undefined || data.tags !== undefined) {
        await replaceAssociations(client, id, data.roomIds, data.tags);
      }
      await client.query('COMMIT');
      return this.findById(id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async remove(id) {
    const { rowCount } = await pool.query('DELETE FROM bookings WHERE id = $1', [id]);
    return rowCount > 0; // booking_rooms/tags/comments/audit_log cascade automatically
  },

  async addComment(bookingId, { author, commentText }) {
    const { rows } = await pool.query(
      'INSERT INTO booking_comments (booking_id, author, comment_text) VALUES ($1, $2, $3) RETURNING *',
      [bookingId, author || null, commentText]
    );
    return rows[0];
  },

  async addAuditEntry(bookingId, { action, changedBy, details }) {
    const { rows } = await pool.query(
      'INSERT INTO booking_audit_log (booking_id, action, changed_by, details) VALUES ($1, $2, $3, $4) RETURNING *',
      [bookingId, action, changedBy || null, details ? JSON.stringify(details) : null]
    );
    return rows[0];
  },
};

async function replaceAssociations(client, bookingId, roomIds, tags) {
  if (roomIds !== undefined) {
    await client.query('DELETE FROM booking_rooms WHERE booking_id = $1', [bookingId]);
    for (const roomId of roomIds || []) {
      await client.query('INSERT INTO booking_rooms (booking_id, room_id) VALUES ($1, $2)', [bookingId, roomId]);
    }
  }
  if (tags !== undefined) {
    await client.query('DELETE FROM booking_tags WHERE booking_id = $1', [bookingId]);
    for (const tag of tags || []) {
      await client.query('INSERT INTO booking_tags (booking_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING', [bookingId, tag]);
    }
  }
}
