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
    const { name, company, email, mobile, gst } = req.body;
    const { rows } = await db.query(
      'INSERT INTO third_parties (name,company,email,mobile,gst) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, company, email, mobile, gst]
    );
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {

    const {
      name,
      company,
      email,
      mobile,
      gst
    } = req.body;

    const { rows } = await db.query(
      `UPDATE third_parties
       SET
         name = $1,
         company = $2,
         email = $3,
         mobile = $4,
         gst = $5
       WHERE id = $6
       RETURNING *`,
      [
        name,
        company,
        email,
        mobile,
        gst,
        req.params.id
      ]
    );

    res.json(rows[0]);

  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM third_parties WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;