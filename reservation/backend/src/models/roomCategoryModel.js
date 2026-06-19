import { pool } from '../config/db.js';

export const RoomCategoryModel = {
  async findAll() {
    // num_rooms is derived live via a LEFT JOIN count instead of trusting a
    // manually-maintained counter column (which the old schema had, and
    // which could drift from reality).
    const { rows } = await pool.query(`
      SELECT rc.*, COALESCE(COUNT(r.room_id), 0)::int AS num_rooms
      FROM room_categories rc
      LEFT JOIN rooms r ON r.category_id = rc.id AND r.is_active = true
      GROUP BY rc.id
      ORDER BY rc.category
    `);
    return rows;
  },
  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM room_categories WHERE id = $1', [id]);
    return rows[0] || null;
  },
  async findByName(category) {
    const { rows } = await pool.query('SELECT * FROM room_categories WHERE LOWER(category) = LOWER($1)', [category]);
    return rows[0] || null;
  },
  async create({ category, color }) {
    const { rows } = await pool.query(
      'INSERT INTO room_categories (category, color) VALUES ($1, $2) RETURNING *',
      [category, color || null]
    );
    return rows[0];
  },
  async update(id, { category, color }) {
    const { rows } = await pool.query(
      'UPDATE room_categories SET category = $1, color = $2, updated_at = now() WHERE id = $3 RETURNING *',
      [category, color || null, id]
    );
    return rows[0] || null;
  },
  async remove(id) {
    const { rowCount } = await pool.query('DELETE FROM room_categories WHERE id = $1', [id]);
    return rowCount > 0;
  },
};
