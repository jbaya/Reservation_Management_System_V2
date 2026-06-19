import { RoomCategoryService } from '../services/roomCategoryService.js';
import { toCamelCase } from '../utils/caseMapper.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, noContent } from '../utils/apiResponse.js';

export const list = asyncHandler(async (req, res) => {
  ok(res, toCamelCase(await RoomCategoryService.list()));
});

export const create = asyncHandler(async (req, res) => {
  created(res, toCamelCase(await RoomCategoryService.create(req.validated)));
});

export const update = asyncHandler(async (req, res) => {
  ok(res, toCamelCase(await RoomCategoryService.update(req.params.id, req.validated)));
});

export const remove = asyncHandler(async (req, res) => {
  await RoomCategoryService.remove(req.params.id);
  noContent(res);
});
