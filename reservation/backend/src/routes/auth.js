import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password, userType } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const { rows } = await db.query(
      `SELECT * FROM users WHERE username = $1 AND status = 'active'`,
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];

    // Verify hashed password
    const passwordMatch = await bcrypt.compare(
  password,
  user.password_hash
);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // If userType selected, check it matches
    if (userType && userType !== '--Login as--' && user.user_type !== userType) {
      return res.status(401).json({ error: 'User type does not match' });
    }

    // Sign JWT (expires in 8 hours)
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.user_type },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id:          user.id,
        name:        user.full_name,
        username:    user.username,
        role:        user.user_type,
        designation: user.designation,
        email:       user.email,
      }
    });

  } catch (err) {
    next(err);
  }
});

export default router;
