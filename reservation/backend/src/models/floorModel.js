import { pool } from '../config/db.js';

export const FloorModel = {
  async findAll() {
    const { rows } = await pool.query('SELECT * FROM floors ORDER BY floor_no');
    return rows;
  },
  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM floors WHERE id = $1', [id]);
    return rows[0] || null;
  },
  async findByFloorNo(floorNo) {
    const { rows } = await pool.query('SELECT * FROM floors WHERE floor_no = $1', [floorNo]);
    return rows[0] || null;
  },
  async findByLabel(label) {
    const { rows } = await pool.query('SELECT * FROM floors WHERE LOWER(label) = LOWER($1)', [label]);
    return rows[0] || null;
  },
  async create({ floorNo, label }) {
    const { rows } = await pool.query(
      'INSERT INTO floors (floor_no, label) VALUES ($1, $2) RETURNING *',
      [floorNo, label]
    );
    return rows[0];
  },
  async update(id, { floorNo, label }) {
    const { rows } = await pool.query(
      'UPDATE floors SET floor_no = $1, label = $2 WHERE id = $3 RETURNING *',
      [floorNo, label, id]
    );
    return rows[0] || null;
  },
  async remove(id) {
    const { rowCount } = await pool.query('DELETE FROM floors WHERE id = $1', [id]);
    return rowCount > 0;
  },
};
