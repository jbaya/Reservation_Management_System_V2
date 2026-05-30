import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM seasons ORDER BY from_date');
    const seasons = rows.map(r => ({
      id: r.id, name: r.name,
      fromDate: r.from_date, toDate: r.to_date
    }));
    res.json(seasons);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { id, name, fromDate, toDate } = req.body;
    const { rows } = await db.query(
      'INSERT INTO seasons (id,name,from_date,to_date) VALUES ($1,$2,$3,$4) RETURNING *',
      [id, name, fromDate, toDate]
    );
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, fromDate, toDate } = req.body;
    const { rows } = await db.query(
      'UPDATE seasons SET name=$1, from_date=$2, to_date=$3 WHERE id=$4 RETURNING *',
      [name, fromDate, toDate, req.params.id]
    );
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM seasons WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;