import { pool } from '../config/db.js';

const SELECT_WITH_JOINS = `
  SELECT
    tar.id, tar.room_rate, tar.extra_person_rate, tar.created_at,
    ta.id AS agent_id, ta.name AS agent_name,
    rc.id AS category_id, rc.category AS room_category,
    s.id AS season_id, s.name AS season_name, s.from_date, s.to_date
  FROM travel_agent_rates tar
  JOIN travel_agents ta ON ta.id = tar.agent_id
  JOIN room_categories rc ON rc.id = tar.category_id
  JOIN seasons s ON s.id = tar.season_id
`;

export const TravelAgentRateModel = {
  async findAll() {
    const { rows } = await pool.query(`${SELECT_WITH_JOINS} ORDER BY ta.name, rc.category, s.from_date`);
    return rows;
  },
  async findById(id) {
    const { rows } = await pool.query(`${SELECT_WITH_JOINS} WHERE tar.id = $1`, [id]);
    return rows[0] || null;
  },
  async create({ agentId, categoryId, seasonId, roomRate, extraPersonRate = 0 }) {
    const { rows } = await pool.query(
      `INSERT INTO travel_agent_rates (agent_id, category_id, season_id, room_rate, extra_person_rate)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [agentId, categoryId, seasonId, roomRate, extraPersonRate]
    );
    return this.findById(rows[0].id);
  },
  async update(id, { agentId, categoryId, seasonId, roomRate, extraPersonRate }) {
    const { rows } = await pool.query(
      `UPDATE travel_agent_rates SET
         agent_id = $1, category_id = $2, season_id = $3,
         room_rate = $4, extra_person_rate = $5
       WHERE id = $6 RETURNING id`,
      [agentId, categoryId, seasonId, roomRate, extraPersonRate ?? 0, id]
    );
    if (!rows[0]) return null;
    return this.findById(rows[0].id);
  },
  async remove(id) {
    const { rowCount } = await pool.query('DELETE FROM travel_agent_rates WHERE id = $1', [id]);
    return rowCount > 0;
  },
};
