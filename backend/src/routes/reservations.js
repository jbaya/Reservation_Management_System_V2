import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../db.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM reservations WHERE tenant_id = $1 ORDER BY arrival_date, room_id`,
      [req.tenantId]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  body('guest_id').isUUID().optional(),
  body('status').isString().notEmpty(),
  body('arrival_date').isISO8601(),
  body('departure_date').isISO8601(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        guest_id,
        room_id,
        category_id,
        status,
        arrival_date,
        departure_date,
        source,
        currency,
        base_rate,
        total_amount,
        paid_amount,
        notes,
        tags,
      } = req.body;

      const { rows } = await db.query(
        `INSERT INTO reservations (
          tenant_id, guest_id, room_id, category_id, status,
          arrival_date, departure_date, source, currency,
          base_rate, total_amount, paid_amount, notes, tags
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        RETURNING *`,
        [
          req.tenantId,
          guest_id || null,
          room_id || null,
          category_id || null,
          status,
          arrival_date,
          departure_date,
          source || 'direct',
          currency || 'INR',
          base_rate || 0,
          total_amount || 0,
          paid_amount || 0,
          notes || null,
          tags || null,
        ]
      );
      res.status(201).json(rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id', async (req, res, next) => {
  try {
    const fields = Object.keys(req.body);
    const values = fields.map((key, index) => req.body[key]);
    const setClause = fields.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const query = `UPDATE reservations SET ${setClause} WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2} RETURNING *`;
    const { rows } = await db.query(query, [...values, req.params.id, req.tenantId]);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM reservations WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
