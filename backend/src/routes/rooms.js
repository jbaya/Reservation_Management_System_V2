import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM rooms WHERE tenant_id = $1 ORDER BY category_id, room_number', [req.tenantId]);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { room_number, category_id, status } = req.body;
    const { rows } = await db.query(
      `INSERT INTO rooms (tenant_id, room_number, category_id, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.tenantId, room_number, category_id, status || 'available']
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
