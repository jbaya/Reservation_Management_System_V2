import { RoomModel } from '../models/roomModel.js';
import { RoomCategoryService } from './roomCategoryService.js';
import { FloorService } from './floorService.js';
import { conflict, notFound } from '../utils/apiResponse.js';
import { pool } from '../config/db.js';

export const RoomService = {
  list: (opts) => RoomModel.findAll(opts),

  async create({ roomNo, categoryId, category, floorId, floorNo, label, capacity }) {
    const [cat, floor] = await Promise.all([
      RoomCategoryService.resolve({ categoryId, category }),
      FloorService.resolve({ floorId, floorNo, label }),
    ]);

    const existing = await RoomModel.findByRoomNo(roomNo);
    if (existing) {
      if (existing.is_active) throw conflict(`Room "${roomNo}" already exists`);
      // Room was soft-deleted earlier — reactivate it instead of violating
      // the room_no UNIQUE constraint with a second INSERT.
      return RoomModel.reactivate(existing.room_id, { categoryId: cat.id, floorId: floor.id, capacity });
    }
    return RoomModel.create({ roomNo, categoryId: cat.id, floorId: floor.id, capacity });
  },

  async update(roomId, { categoryId, category, floorId, floorNo, label, capacity, isActive }) {
    const cat = categoryId || category ? await RoomCategoryService.resolve({ categoryId, category }) : null;
    const floor = floorId || floorNo || label ? await FloorService.resolve({ floorId, floorNo, label }) : null;
    const updated = await RoomModel.update(roomId, {
      categoryId: cat?.id,
      floorId: floor?.id,
      capacity,
      isActive,
    });
    if (!updated) throw notFound('Room not found');
    return updated;
  },

  async softDelete(roomId) {
    const removed = await RoomModel.softDelete(roomId);
    if (!removed) throw notFound('Room not found');
  },

  /** Bulk-move every room in one category to another category — replaces
   *  the old text-rename approach (UPDATE rooms SET category = newName
   *  WHERE category = oldName) which relied on string matching. Now it's
   *  a single UPDATE on the FK column, scoped by id. */
  async renameCategoryAssignment(oldCategoryId, newCategoryId) {
    const { rowCount } = await pool.query(
      'UPDATE rooms SET category_id = $1, updated_at = now() WHERE category_id = $2',
      [newCategoryId, oldCategoryId]
    );
    return rowCount;
  },
};
