import { UserService } from '../services/userService.js';
import { toCamelCase } from '../utils/caseMapper.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, noContent } from '../utils/apiResponse.js';

export const list = asyncHandler(async (req, res) => {
  ok(res, toCamelCase(await UserService.list()));
});

export const create = asyncHandler(async (req, res) => {
  created(res, toCamelCase(await UserService.create(req.validated)));
});

export const update = asyncHandler(async (req, res) => {
  ok(res, toCamelCase(await UserService.update(req.params.id, req.validated)));
});

export const remove = asyncHandler(async (req, res) => {
  await UserService.remove(req.params.id);
  noContent(res);
});
