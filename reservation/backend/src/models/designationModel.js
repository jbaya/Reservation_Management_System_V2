import { pool } from '../config/db.js';

export const DesignationModel = {
  async findAll() {
    const { rows } = await pool.query('SELECT * FROM designations ORDER BY name');
    return rows;
  },
  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM designations WHERE id = $1', [id]);
    return rows[0] || null;
  },
  async findByName(name) {
    const { rows } = await pool.query('SELECT * FROM designations WHERE LOWER(name) = LOWER($1)', [name]);
    return rows[0] || null;
  },
  async create(name) {
    const { rows } = await pool.query(
      'INSERT INTO designations (name) VALUES ($1) RETURNING *',
      [name]
    );
    return rows[0];
  },
  async remove(id) {
    const { rowCount } = await pool.query('DELETE FROM designations WHERE id = $1', [id]);
    return rowCount > 0;
  },
};
