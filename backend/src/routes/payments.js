import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/reservation/:reservationId', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM payments WHERE tenant_id = $1 AND reservation_id = $2 ORDER BY created_at DESC',
      [req.tenantId, req.params.reservationId]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { reservation_id, amount, method, note } = req.body;
    const { rows } = await db.query(
      `INSERT INTO payments (tenant_id, reservation_id, amount, method, note)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.tenantId, reservation_id, amount, method || 'cash', note || null]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
