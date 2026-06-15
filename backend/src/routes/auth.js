import express from 'express';
import db from '../db.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password, userType } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const { rows } = await db.query(
      `SELECT * FROM users 
       WHERE username = $1 
       AND password = $2 
       AND status = 'active'`,
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];

    // If userType selected, check it matches
    if (userType && userType !== '--Login as--' && user.user_type !== userType) {
      return res.status(401).json({ error: 'User type does not match' });
    }

    res.json({
      success: true,
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