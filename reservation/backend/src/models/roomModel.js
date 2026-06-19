import { pool } from '../config/db.js';

const SELECT_WITH_JOINS = `
  SELECT
    r.room_id, r.room_no, r.capacity, r.is_active, r.created_at, r.updated_at,
    rc.id AS category_id, rc.category AS category_name, rc.color AS category_color,
    f.id AS floor_id, f.floor_no, f.label AS floor_label
  FROM rooms r
  JOIN room_categories rc ON rc.id = r.category_id
  JOIN floors f ON f.id = r.floor_id
`;

export const RoomModel = {
  async findAll({ includeInactive = false } = {}) {
    const where = includeInactive ? '' : 'WHERE r.is_active = true';
    const { rows } = await pool.query(`${SELECT_WITH_JOINS} ${where} ORDER BY r.room_no`);
    return rows;
  },
  async findById(roomId) {
    const { rows } = await pool.query(`${SELECT_WITH_JOINS} WHERE r.room_id = $1`, [roomId]);
    return rows[0] || null;
  },
  async findByRoomNo(roomNo) {
    const { rows } = await pool.query(`${SELECT_WITH_JOINS} WHERE r.room_no = $1`, [roomNo]);
    return rows[0] || null;
  },
  async create({ roomNo, categoryId, floorId, capacity = 2 }) {
    const { rows } = await pool.query(
      `INSERT INTO rooms (room_no, category_id, floor_id, capacity)
       VALUES ($1, $2, $3, $4) RETURNING room_id`,
      [roomNo, categoryId, floorId, capacity]
    );
    return this.findById(rows[0].room_id);
  },
  async update(roomId, { categoryId, floorId, capacity, isActive }) {
    const { rows } = await pool.query(
      `UPDATE rooms SET
         category_id = COALESCE($1, category_id),
         floor_id    = COALESCE($2, floor_id),
         capacity    = COALESCE($3, capacity),
         is_active   = COALESCE($4, is_active),
         updated_at  = now()
       WHERE room_id = $5 RETURNING room_id`,
      [categoryId ?? null, floorId ?? null, capacity ?? null, isActive ?? null, roomId]
    );
    if (!rows[0]) return null;
    return this.findById(rows[0].room_id);
  },
  /** Soft delete: rooms are never hard-deleted because booking_rooms.room_id
   *  is ON DELETE RESTRICT — historical bookings must keep pointing at a
   *  real room row. Reactivating a previously deactivated room reuses the
   *  same row instead of duplicate-inserting, enforced by the room_no
   *  UNIQUE constraint plus this explicit check (replaces the old
   *  hand-rolled "if exists but inactive, restore" branches that were
   *  duplicated across POST and PUT in the legacy routes/rooms.js).
   */
  async softDelete(roomId) {
    const { rowCount } = await pool.query(
      'UPDATE rooms SET is_active = false, updated_at = now() WHERE room_id = $1',
      [roomId]
    );
    return rowCount > 0;
  },
  async reactivate(roomId, { categoryId, floorId, capacity }) {
    const { rows } = await pool.query(
      `UPDATE rooms SET is_active = true, category_id = $1, floor_id = $2,
              capacity = COALESCE($3, capacity), updated_at = now()
       WHERE room_id = $4 RETURNING room_id`,
      [categoryId, floorId, capacity ?? null, roomId]
    );
    if (!rows[0]) return null;
    return this.findById(rows[0].room_id);
  },
  async remove(roomId) {
    const { rowCount } = await pool.query('DELETE FROM rooms WHERE room_id = $1', [roomId]);
    return rowCount > 0;
  },
};
