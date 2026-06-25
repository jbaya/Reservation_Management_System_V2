import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        tar.id,
        ta.name AS agent_name,
        rc.category AS room_category,
        tar.season_id,
        s.name AS season_name,
        tar.room_rate,
        tar.extra_person_rate
      FROM travel_agent_rates tar
      LEFT JOIN travel_agents ta ON tar.agent_id = ta.id
      LEFT JOIN room_categories rc ON tar.category_id = rc.id
      LEFT JOIN seasons s ON tar.season_id = s.id
    `);
    const rates = rows.map(r => ({
      id:              r.id,
      agentName:       r.agent_name,
      roomCategory:    r.room_category,
      seasonId:        r.season_id,
      seasonName:      r.season_name,
      roomRate:        r.room_rate,
      extraPersonRate: r.extra_person_rate,
    }));
    res.json(rates);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { agentName, roomCategory, seasonId, roomRate, extraPersonRate } = req.body;

// Look up agent_id from name
const agentResult = await db.query(
  `SELECT id FROM travel_agents WHERE name = $1`, [agentName]
);
if (!agentResult.rows.length) {
  return res.status(400).json({ error: 'Agent not found' });
}
const agentId = agentResult.rows[0].id;

// Look up category_id from name
const catResult = await db.query(
  `SELECT id FROM room_categories WHERE category = $1`, [roomCategory]
);
if (!catResult.rows.length) {
  return res.status(400).json({ error: 'Category not found' });
}
const categoryId = catResult.rows[0].id;

const { rows } = await db.query(
  `INSERT INTO travel_agent_rates 
    (agent_id, category_id, season_id, room_rate, extra_person_rate) 
   VALUES ($1,$2,$3,$4,$5) RETURNING *`,
  [agentId, categoryId, seasonId || null, roomRate, extraPersonRate || 0]
);
    // Return with names joined
    const joined = await db.query(`
      SELECT 
        tar.id,
        ta.name AS agent_name,
        rc.category AS room_category,
        tar.season_id,
        s.name AS season_name,
        tar.room_rate,
        tar.extra_person_rate
      FROM travel_agent_rates tar
      LEFT JOIN travel_agents ta ON tar.agent_id = ta.id
      LEFT JOIN room_categories rc ON tar.category_id = rc.id
      LEFT JOIN seasons s ON tar.season_id = s.id
      WHERE tar.id = $1
    `, [rows[0].id]);
    const r = joined.rows[0];
    res.status(201).json({
      id:              r.id,
      agentName:       r.agent_name,
      roomCategory:    r.room_category,
      seasonId:        r.season_id,
      seasonName:      r.season_name,
      roomRate:        r.room_rate,
      extraPersonRate: r.extra_person_rate,
    });
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { agentName, roomCategory, seasonId, roomRate, extraPersonRate } = req.body;

const agentResult = await db.query(
  `SELECT id FROM travel_agents WHERE name = $1`, [agentName]
);
const agentId = agentResult.rows[0]?.id;

const catResult = await db.query(
  `SELECT id FROM room_categories WHERE category = $1`, [roomCategory]
);
const categoryId = catResult.rows[0]?.id;

await db.query(
  `UPDATE travel_agent_rates 
   SET agent_id=$1, category_id=$2, season_id=$3, room_rate=$4, extra_person_rate=$5 
   WHERE id=$6`,
  [agentId, categoryId, seasonId || null, roomRate, extraPersonRate || 0, req.params.id]
);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM travel_agent_rates WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;