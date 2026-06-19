import { pool } from '../config/db.js';

export const SpecialDateModel = {
  async findAll() {
    const { rows } = await pool.query('SELECT * FROM special_dates ORDER BY from_date');
    return rows;
  },
  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM special_dates WHERE id = $1', [id]);
    return rows[0] || null;
  },
  async create({ name, type, fromDate, toDate, color }) {
    const { rows } = await pool.query(
      `INSERT INTO special_dates (name, type, from_date, to_date, color)
       VALUES ($1, $2, $3, $4, COALESCE($5, '#e74c3c')) RETURNING *`,
      [name, type || null, fromDate, toDate, color || null]
    );
    return rows[0];
  },
  async update(id, { name, type, fromDate, toDate, color }) {
    const { rows } = await pool.query(
      `UPDATE special_dates SET name = $1, type = $2, from_date = $3, to_date = $4,
              color = COALESCE($5, color)
       WHERE id = $6 RETURNING *`,
      [name, type || null, fromDate, toDate, color || null, id]
    );
    return rows[0] || null;
  },
  async remove(id) {
    const { rowCount } = await pool.query('DELETE FROM special_dates WHERE id = $1', [id]);
    return rowCount > 0;
  },
};
