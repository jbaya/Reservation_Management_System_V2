import express from 'express';
import db from '../db.js';

const router = express.Router();

/* =========================================================
   GET ALL ROOMS
========================================================= */
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        r.room_id,
        r.room_no,
        r.capacity,
        rc.category,
        f.floor_no AS floor
      FROM rooms r
      JOIN room_categories rc
        ON r.category_id = rc.id
      JOIN floors f
        ON r.floor_id = f.id
      WHERE r.is_active = true
      ORDER BY r.room_no
    `);

    res.json(
      rows.map(r => ({
        name: r.room_no,
        category: r.category,
        floor: r.floor,
        capacity: r.capacity,
        room_id: r.room_id
      }))
    );
  } catch (error) {
    console.error('ROOM FETCH ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

/* =========================================================
   GET ROOM NUMBERS
========================================================= */
router.get('/all-room-numbers', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT room_no FROM rooms WHERE is_active = true ORDER BY room_no'
    );

    res.json(rows.map(r => r.room_no));
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   ADD ROOM
========================================================= */
router.post('/', async (req, res, next) => {
  try {
    const { name, category, floor, capacity } = req.body;

    console.log("ROOM REQUEST:", req.body);

    const existing = await db.query(
      'SELECT * FROM rooms WHERE room_no = $1',
      [name]
    );

    const categoryResult = await db.query(
      `
      SELECT id
      FROM room_categories
      WHERE category = $1
      `,
      [category]
    );

    if (!categoryResult.rows.length) {
      return res.status(400).json({
        error: `Category not found: ${category}`
      });
    }

    const floorResult = await db.query(
      `
      SELECT id
      FROM floors
      WHERE label = $1
         OR floor_no::text = $1
      `,
      [String(floor)]
    );

    if (!floorResult.rows.length) {
      return res.status(400).json({
        error: `Floor not found: ${floor}`
      });
    }

    const categoryId = categoryResult.rows[0].id;
    const floorId = floorResult.rows[0].id;

    if (existing.rows.length > 0) {
      const room = existing.rows[0];

      if (!room.is_active) {
        const { rows } = await db.query(
          `
          UPDATE rooms
          SET is_active = true,
              category_id = $1,
              floor_id = $2,
              capacity = $3,
              updated_at = NOW()
          WHERE room_no = $4
          RETURNING *
          `,
          [
            categoryId,
            floorId,
            capacity || 2,
            name
          ]
        );

        return res.json(rows[0]);
      }

      return res.status(400).json({
        error: 'Room already exists'
      });
    }

    const { rows } = await db.query(
      `
      INSERT INTO rooms
      (
        room_no,
        category_id,
        floor_id,
        capacity,
        is_active
      )
      VALUES ($1,$2,$3,$4,true)
      RETURNING *
      `,
      [
        name,
        categoryId,
        floorId,
        capacity || 2
      ]
    );

    res.status(201).json(rows[0]);

  } catch (error) {
    console.error('ROOM INSERT ERROR:', error);
    next(error);
  }
});

/* =========================================================
   RENAME CATEGORY + UPDATE FLOOR FOR ALL ROOMS
========================================================= */
router.put('/rename-category', async (req, res) => {
  try {
    const { oldCategory, newCategory, floor } = req.body;

    if (!oldCategory || !newCategory) {
      return res.status(400).json({
        error: 'oldCategory and newCategory are required'
      });
    }

    const categoryResult = await db.query(
      `
      SELECT id
      FROM room_categories
      WHERE category = $1
      `,
      [newCategory]
    );

    if (!categoryResult.rows.length) {
      return res.status(400).json({
        error: 'Category not found'
      });
    }

    const categoryId = categoryResult.rows[0].id;

    let floorId = null;

    if (floor) {
      const floorResult = await db.query(
        `
        SELECT id
        FROM floors
        WHERE label = $1
           OR floor_no::text = $1
        `,
        [String(floor)]
      );

      if (floorResult.rows.length) {
        floorId = floorResult.rows[0].id;
      }
    }

    if (floorId) {
      await db.query(
        `
        UPDATE rooms
        SET
          category_id = $1,
          floor_id = $2,
          updated_at = NOW()
        WHERE category_id = (
          SELECT id
          FROM room_categories
          WHERE category = $3
        )
        `,
        [categoryId, floorId, oldCategory]
      );
    } else {
      await db.query(
        `
        UPDATE rooms
        SET
          category_id = $1,
          updated_at = NOW()
        WHERE category_id = (
          SELECT id
          FROM room_categories
          WHERE category = $2
        )
        `,
        [categoryId, oldCategory]
      );
    }

    res.json({
      success: true
    });

  } catch (error) {
    console.error('RENAME CATEGORY ERROR:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/* =========================================================
   UPDATE ROOM
========================================================= */
router.put('/:room_no', async (req, res, next) => {
  try {
    const { roomNo, category, floor, capacity } = req.body;

    // Category lookup
    const categoryResult = await db.query(
      `
      SELECT id
      FROM room_categories
      WHERE category = $1
      `,
      [category]
    );

    if (!categoryResult.rows.length) {
      return res.status(400).json({
        error: 'Category not found'
      });
    }

    // Floor lookup
    const floorResult = await db.query(
      `
      SELECT id
      FROM floors
      WHERE label = $1
         OR floor_no::text = $1
      `,
      [String(floor)]
    );

    if (!floorResult.rows.length) {
      return res.status(400).json({
        error: 'Floor not found'
      });
    }

    const categoryId = categoryResult.rows[0].id;
    const floorId = floorResult.rows[0].id;

    const { rows } = await db.query(
      `
      UPDATE rooms
      SET
        room_no = $1,
        category_id = $2,
        floor_id = $3,
        capacity = $4,
        updated_at = NOW()
      WHERE room_no = $5
      RETURNING *
      `,
      [
        roomNo,
        categoryId,
        floorId,
        capacity || 2,
        req.params.room_no
      ]
    );

    res.json(rows[0]);

  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        error: 'Room number already exists'
      });
    }

    console.error('UPDATE ROOM ERROR:', error);
    next(error);
  }
});



/* =========================================================
   DELETE ROOM
========================================================= */
router.delete('/:room_no', async (req, res, next) => {
  try {
    await db.query(
      `
      UPDATE rooms
      SET is_active = false
      WHERE room_no = $1
      `,
      [req.params.room_no]
    );

    res.json({
      success: true
    });

  } catch (error) {
    next(error);
  }
});

export default router;