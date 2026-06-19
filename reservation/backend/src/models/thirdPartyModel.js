import { pool } from '../config/db.js';

export const ThirdPartyModel = {
  async findAll() {
    const { rows } = await pool.query('SELECT * FROM third_parties ORDER BY name');
    return rows;
  },
  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM third_parties WHERE id = $1', [id]);
    return rows[0] || null;
  },
  async findByName(name) {
    const { rows } = await pool.query('SELECT * FROM third_parties WHERE LOWER(name) = LOWER($1)', [name]);
    return rows[0] || null;
  },
  async create({ name, company, email, mobile, gst }) {
    const { rows } = await pool.query(
      `INSERT INTO third_parties (name, company, email, mobile, gst)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, company || null, email || null, mobile || null, gst || null]
    );
    return rows[0];
  },
  async update(id, { name, company, email, mobile, gst }) {
    const { rows } = await pool.query(
      `UPDATE third_parties SET name = $1, company = $2, email = $3, mobile = $4, gst = $5
       WHERE id = $6 RETURNING *`,
      [name, company || null, email || null, mobile || null, gst || null, id]
    );
    return rows[0] || null;
  },
  async remove(id) {
    const { rowCount } = await pool.query('DELETE FROM third_parties WHERE id = $1', [id]);
    return rowCount > 0;
  },
};
