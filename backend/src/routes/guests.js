import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM guests WHERE tenant_id = $1 ORDER BY last_name, first_name', [req.tenantId]);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone, tags } = req.body;
    const { rows } = await db.query(
      `INSERT INTO guests (tenant_id, first_name, last_name, email, phone, tags)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.tenantId, first_name, last_name, email, phone, tags || null]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
