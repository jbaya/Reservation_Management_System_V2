import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET ALL FLOORS
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM floors ORDER BY floor_no'
    );

    res.json(
      rows.map(r => ({
        id: r.id,
        floorNo: r.floor_no
      }))
    );
  } catch (err) {
    next(err);
  }
});

// ADD FLOOR
router.post('/', async (req, res, next) => {
  try {
    const { id, floorNo } = req.body;

    const { rows } = await db.query(
      'INSERT INTO floors (id, floor_no) VALUES ($1,$2) RETURNING *',
      [id, floorNo]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE FLOOR
router.delete('/:id', async (req, res, next) => {
  try {
    await db.query(
      'DELETE FROM floors WHERE id=$1',
      [req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;