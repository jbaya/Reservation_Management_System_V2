import { DesignationService } from '../services/designationService.js';
import { toCamelCase } from '../utils/caseMapper.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, noContent } from '../utils/apiResponse.js';

export const list = asyncHandler(async (req, res) => {
  ok(res, toCamelCase(await DesignationService.list()));
});

export const create = asyncHandler(async (req, res) => {
  created(res, toCamelCase(await DesignationService.create(req.validated.name)));
});

export const remove = asyncHandler(async (req, res) => {
  await DesignationService.remove(req.params.id);
  noContent(res);
});
