import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM travel_agent_rates');
    const rates = rows.map(r => ({
      id: r.id, agentName: r.agent_name,
      roomCategory: r.room_category, seasonId: r.season_id,
      seasonName: r.season_name, roomRate: r.room_rate,
      extraPersonRate: r.extra_person_rate
    }));
    res.json(rates);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { id, agentName, roomCategory, seasonId, seasonName, roomRate, extraPersonRate } = req.body;
    const { rows } = await db.query(
      'INSERT INTO travel_agent_rates (id,agent_name,room_category,season_id,season_name,room_rate,extra_person_rate) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [id, agentName, roomCategory, seasonId, seasonName, roomRate, extraPersonRate || 0]
    );
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { agentName, roomCategory, seasonId, seasonName, roomRate, extraPersonRate } = req.body;
    const { rows } = await db.query(
      'UPDATE travel_agent_rates SET agent_name=$1, room_category=$2, season_id=$3, season_name=$4, room_rate=$5, extra_person_rate=$6 WHERE id=$7 RETURNING *',
      [agentName, roomCategory, seasonId, seasonName, roomRate, extraPersonRate || 0, req.params.id]
    );
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM travel_agent_rates WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;