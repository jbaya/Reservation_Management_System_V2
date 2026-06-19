import { SeasonService } from '../services/seasonService.js';
import { toCamelCase } from '../utils/caseMapper.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, noContent } from '../utils/apiResponse.js';

export const list = asyncHandler(async (req, res) => {
  ok(res, toCamelCase(await SeasonService.list()));
});

export const create = asyncHandler(async (req, res) => {
  created(res, toCamelCase(await SeasonService.create({
    name: req.validated.name, fromDate: req.validated.fromDate, toDate: req.validated.toDate,
  })));
});

export const update = asyncHandler(async (req, res) => {
  ok(res, toCamelCase(await SeasonService.update(req.params.id, {
    name: req.validated.name, fromDate: req.validated.fromDate, toDate: req.validated.toDate,
  })));
});

export const remove = asyncHandler(async (req, res) => {
  await SeasonService.remove(req.params.id);
  noContent(res);
});
