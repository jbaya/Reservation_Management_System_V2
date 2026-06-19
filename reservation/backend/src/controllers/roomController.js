import { RoomService } from '../services/roomService.js';
import { RoomCategoryService } from '../services/roomCategoryService.js';
import { toCamelCase } from '../utils/caseMapper.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, noContent } from '../utils/apiResponse.js';

export const list = asyncHandler(async (req, res) => {
  ok(res, toCamelCase(await RoomService.list({ includeInactive: req.query.includeInactive === 'true' })));
});

export const create = asyncHandler(async (req, res) => {
  created(res, toCamelCase(await RoomService.create(req.validated)));
});

export const update = asyncHandler(async (req, res) => {
  ok(res, toCamelCase(await RoomService.update(req.params.id, req.validated)));
});

export const remove = asyncHandler(async (req, res) => {
  await RoomService.softDelete(req.params.id);
  noContent(res);
});

// Moves every room currently in one category to another category in one
// shot — replaces the old text-rename ("UPDATE rooms SET category =
// newName WHERE category = oldName") with an id-based bulk reassignment.
export const renameCategoryAssignment = asyncHandler(async (req, res) => {
  const { oldCategoryId, newCategoryId } = req.validated;
  const movedCount = await RoomService.renameCategoryAssignment(oldCategoryId, newCategoryId);
  ok(res, { movedCount });
});

export const allRoomNumbers = asyncHandler(async (req, res) => {
  const rooms = await RoomService.list({ includeInactive: true });
  ok(res, rooms.map((r) => r.room_no));
});

export { RoomCategoryService };
