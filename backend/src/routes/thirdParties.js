import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM third_parties ORDER BY name');
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { id, name, company, email, mobile, gst } = req.body;
    const { rows } = await db.query(
      'INSERT INTO third_parties (id,name,company,email,mobile,gst) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [id, name, company, email, mobile, gst]
    );
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM third_parties WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;