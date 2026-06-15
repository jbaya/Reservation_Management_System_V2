import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';

const router = express.Router();

// ── DESIGNATIONS (must be before /:id routes) ─────────────────────────────────

// GET all designations
router.get('/designations', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM designations ORDER BY name ASC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST - add designation
router.post('/designations', async (req, res, next) => {
  try {
    const { name } = req.body;

    const existing = await db.query(
      'SELECT id FROM designations WHERE LOWER(name) = LOWER($1)', [name]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Designation already exists' });
    }

    const { rows } = await db.query(
      'INSERT INTO designations (name) VALUES ($1) RETURNING *',
      [name.toUpperCase()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE designation
router.delete('/designations/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM designations WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── USERS ─────────────────────────────────────────────────────────────────────

// GET all users (exclude password from response)
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT id, full_name, gender, mobile, email, designation, username, user_type, status, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST - add user
router.post('/', async (req, res, next) => {
  try {
    const {
      full_name, gender, mobile, email,
      designation, username, password,
      user_type, status
    } = req.body;

    // Check username already exists
    const existing = await db.query(
      'SELECT id FROM users WHERE username = $1', [username]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await db.query(
      `INSERT INTO users
       (full_name, gender, mobile, email, designation, username, password, user_type, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, full_name, gender, mobile, email, designation, username, user_type, status, created_at`,
      [full_name, gender, mobile, email, designation, username, hashedPassword, user_type, status || 'active']
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT - update user (/:id must be after /designations)
router.put('/:id', async (req, res, next) => {
  try {
    const {
      full_name, gender, mobile, email,
      designation, username, password,
      user_type, status
    } = req.body;

    let hashedPassword;
    if (password) {
      // Only rehash if a new password was provided
      hashedPassword = await bcrypt.hash(password, 10);
    } else {
      // Keep existing password
      const existing = await db.query('SELECT password FROM users WHERE id=$1', [req.params.id]);
      hashedPassword = existing.rows[0]?.password;
    }

    const { rows } = await db.query(
      `UPDATE users SET
        full_name=$1, gender=$2, mobile=$3, email=$4,
        designation=$5, username=$6, password=$7,
        user_type=$8, status=$9
       WHERE id=$10
       RETURNING id, full_name, gender, mobile, email, designation, username, user_type, status, created_at`,
      [full_name, gender, mobile, email, designation, username, hashedPassword, user_type, status, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE user
router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
