import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET all categories
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM room_categories ORDER BY category'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// POST - add category
router.post('/', async (req, res, next) => {
  try {
    const { category, color } = req.body;

    const { rows } = await db.query(
      `INSERT INTO room_categories
       (category, color)
       VALUES ($1,$2)
       RETURNING *`,
      [category, color]
    );

    res.status(201).json(rows[0]);

  } catch (error) {
    next(error);
  }
});

// PUT - update category
router.put('/:id', async (req, res, next) => {
  try {

    const { category, color } = req.body;

    const { rows } = await db.query(
      `UPDATE room_categories
       SET category = $1,
           color = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [category, color, req.params.id]
    );

    res.json(rows[0]);

  } catch (error) {
    next(error);
  }
});

// DELETE
router.delete('/:id', async (req, res, next) => {
  try {

    await db.query(
      `
      DELETE FROM rooms
      WHERE category_id = $1
      `,
      [req.params.id]
    );

    await db.query(
      `
      DELETE FROM room_categories
      WHERE id = $1
      `,
      [req.params.id]
    );

    res.json({ success: true });

  } catch (error) {
    console.error(error);
    next(error);
  }
});

export default router;