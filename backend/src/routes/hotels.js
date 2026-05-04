import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM hotels ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, code, contact_email, currency } = req.body;
    const { rows } = await db.query(
      `INSERT INTO hotels (name, code, contact_email, currency)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, code, contact_email, currency || 'INR']
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
