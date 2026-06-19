import { pool } from '../config/db.js';

export const SeasonModel = {
  async findAll() {
    const { rows } = await pool.query('SELECT * FROM seasons ORDER BY from_date');
    return rows;
  },
  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM seasons WHERE id = $1', [id]);
    return rows[0] || null;
  },
  async findByName(name) {
    const { rows } = await pool.query('SELECT * FROM seasons WHERE LOWER(name) = LOWER($1)', [name]);
    return rows[0] || null;
  },
  async create({ name, fromDate, toDate }) {
    const { rows } = await pool.query(
      'INSERT INTO seasons (name, from_date, to_date) VALUES ($1, $2, $3) RETURNING *',
      [name, fromDate, toDate]
    );
    return rows[0];
  },
  async update(id, { name, fromDate, toDate }) {
    const { rows } = await pool.query(
      'UPDATE seasons SET name = $1, from_date = $2, to_date = $3 WHERE id = $4 RETURNING *',
      [name, fromDate, toDate, id]
    );
    return rows[0] || null;
  },
  async remove(id) {
    const { rowCount } = await pool.query('DELETE FROM seasons WHERE id = $1', [id]);
    return rowCount > 0;
  },
};
