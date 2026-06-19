import { pool } from '../config/db.js';

const SELECT_WITH_JOIN = `
  SELECT u.id, u.full_name, u.gender, u.mobile, u.email, u.username, u.user_type,
         u.status, u.created_at,
         d.id AS designation_id, d.name AS designation_name
  FROM users u
  LEFT JOIN designations d ON d.id = u.designation_id
`;
// password_hash deliberately excluded from every SELECT below — it must
// never leave the database in an API response.

export const UserModel = {
  async findAll() {
    const { rows } = await pool.query(`${SELECT_WITH_JOIN} ORDER BY u.full_name`);
    return rows;
  },
  async findById(id) {
    const { rows } = await pool.query(`${SELECT_WITH_JOIN} WHERE u.id = $1`, [id]);
    return rows[0] || null;
  },
  async findByUsername(username) {
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return rows[0] || null; // includes password_hash — only for login verification
  },
  async create({ fullName, gender, mobile, email, designationId, username, passwordHash, userType, status = 'active' }) {
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, gender, mobile, email, designation_id, username, password_hash, user_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [fullName, gender || null, mobile || null, email || null, designationId || null, username, passwordHash, userType, status]
    );
    return this.findById(rows[0].id);
  },
  async update(id, { fullName, gender, mobile, email, designationId, userType, status, passwordHash }) {
    const { rows } = await pool.query(
      `UPDATE users SET
         full_name      = COALESCE($1, full_name),
         gender         = COALESCE($2, gender),
         mobile         = COALESCE($3, mobile),
         email          = COALESCE($4, email),
         designation_id = COALESCE($5, designation_id),
         user_type      = COALESCE($6, user_type),
         status         = COALESCE($7, status),
         password_hash  = COALESCE($8, password_hash)
       WHERE id = $9 RETURNING id`,
      [fullName ?? null, gender ?? null, mobile ?? null, email ?? null, designationId ?? null, userType ?? null, status ?? null, passwordHash ?? null, id]
    );
    if (!rows[0]) return null;
    return this.findById(rows[0].id);
  },
  async remove(id) {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return rowCount > 0;
  },
};
