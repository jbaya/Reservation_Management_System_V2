import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET all special dates
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM special_dates ORDER BY from_date ASC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST - add special date
router.post('/', async (req, res, next) => {
  try {
    const { name, type, from_date, to_date, color } = req.body;
    const { rows } = await db.query(
      `INSERT INTO special_dates (name, type, from_date, to_date, color)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, type || 'custom', from_date, to_date, color || '#e74c3c']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT - update
router.put('/:id', async (req, res, next) => {
  try {
    const { name, type, from_date, to_date, color } = req.body;
    const { rows } = await db.query(
      `UPDATE special_dates
       SET name=$1, type=$2, from_date=$3, to_date=$4, color=$5
       WHERE id=$6 RETURNING *`,
      [name, type, from_date, to_date, color, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE
router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM special_dates WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;