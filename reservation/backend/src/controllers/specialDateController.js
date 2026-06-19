import { SpecialDateService } from '../services/specialDateService.js';
import { toCamelCase } from '../utils/caseMapper.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, noContent } from '../utils/apiResponse.js';

export const list = asyncHandler(async (req, res) => {
  ok(res, toCamelCase(await SpecialDateService.list()));
});

export const create = asyncHandler(async (req, res) => {
  created(res, toCamelCase(await SpecialDateService.create(req.validated)));
});

export const update = asyncHandler(async (req, res) => {
  ok(res, toCamelCase(await SpecialDateService.update(req.params.id, req.validated)));
});

export const remove = asyncHandler(async (req, res) => {
  await SpecialDateService.remove(req.params.id);
  noContent(res);
});
