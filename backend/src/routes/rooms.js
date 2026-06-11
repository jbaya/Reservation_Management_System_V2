import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET all rooms
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM rooms WHERE is_active = true ORDER BY room_no'
    );

    res.json(
      rows.map(r => ({
        name: r.room_no,
        category: r.category,
        floor: r.floor_no,
        capacity: r.capacity,
        room_id: r.room_id
      }))
    );
  } catch (error) {
    console.error('ROOM FETCH ERROR:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

router.get('/all-room-numbers', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT room_no FROM rooms'
    );

    res.json(rows.map(r => r.room_no));

  } catch (error) {
    next(error);
  }
});

// POST - add room
router.post('/', async (req, res, next) => {
  try {
    const { name, category, floor, capacity } = req.body;

    // Check if room already exists
    const existing = await db.query(
      'SELECT * FROM rooms WHERE room_no = $1',
      [name]
    );

    // Room exists but was deleted → restore it
    if (existing.rows.length > 0) {

      const room = existing.rows[0];

      if (room.is_active === false) {

        const { rows } = await db.query(
          `UPDATE rooms
           SET is_active = true,
               category = $1,
               floor_no = $2,
               capacity = $3,
               updated_at = NOW()
           WHERE room_no = $4
           RETURNING *`,
          [
            category,
            floor || '1',
            capacity || 2,
            name
          ]
        );

        return res.json({
          name: rows[0].room_no,
          category: rows[0].category,
          floor: rows[0].floor_no,
          room_id: rows[0].room_id
        });
      }

      return res.status(400).json({
        error: 'Room already exists'
      });
    }

    // Brand new room
    const { rows } = await db.query(
      `INSERT INTO rooms
       (room_no, category, floor_no, capacity)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        name,
        category,
        floor || '1',
        capacity || 2
      ]
    );

    res.status(201).json({
      name: rows[0].room_no,
      category: rows[0].category,
      floor: rows[0].floor_no,
      room_id: rows[0].room_id
    });

  } catch (error) {
    console.error(error);
    next(error);
  }
});

// Rename category
// ⚠️ rename-category should be before /:room_no
// Replace the rename-category route with this
router.put('/rename-category', async (req, res, next) => {
  try {
    const { oldCategory, newCategory, floor } = req.body;

    if (floor !== undefined && floor !== null && floor !== '') {
      // Update both category name AND floor in one query
      await db.query(
        'UPDATE rooms SET category = $1, floor_no = $2 WHERE category = $3',
        [newCategory, floor, oldCategory]
      );
    } else {
      // Just rename category, keep existing floor
      await db.query(
        'UPDATE rooms SET category = $1 WHERE category = $2',
        [newCategory, oldCategory]
      );
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// PUT - update room
router.put('/:room_no', async (req, res, next) => {
  try {
    const {
      roomNo,
      category,
      floor,
      capacity
    } = req.body;

    // Duplicate room number check
   // Check if room number already exists
const existing = await db.query(
  `SELECT *
   FROM rooms
   WHERE room_no = $1
   AND room_no <> $2`,
  [roomNo, req.params.room_no]
);

if (existing.rows.length > 0) {

  const targetRoom = existing.rows[0];

  // Room exists but inactive → restore it
  if (!targetRoom.is_active) {

    await db.query(
      `UPDATE rooms
       SET is_active = true,
           category = $1,
           floor_no = $2,
           capacity = $3,
           updated_at = NOW()
       WHERE room_no = $4`,
      [
        category,
        floor,
        capacity || 2,
        roomNo
      ]
    );

    // deactivate old room
    await db.query(
      `UPDATE rooms
       SET is_active = false
       WHERE room_no = $1`,
      [req.params.room_no]
    );

    return res.json({
      success: true,
      message: 'Deleted room restored successfully'
    });
  }

  return res.status(400).json({
    error: `Room ${roomNo} already exists`
  });
}

    const { rows } = await db.query(
      `UPDATE rooms
       SET room_no = $1,
           category = $2,
           floor_no = $3,
           capacity = $4,
           updated_at = NOW()
       WHERE room_no = $5
       RETURNING *`,
      [
        roomNo,
        category,
        floor,
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

// DELETE room
router.delete('/:room_no', async (req, res, next) => {
  try {
    await db.query(
      'UPDATE rooms SET is_active = false WHERE room_no = $1',
      [req.params.room_no]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;