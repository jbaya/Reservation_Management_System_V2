import { ThirdPartyService } from '../services/thirdPartyService.js';
import { toCamelCase } from '../utils/caseMapper.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, noContent } from '../utils/apiResponse.js';

export const list = asyncHandler(async (req, res) => {
  ok(res, toCamelCase(await ThirdPartyService.list()));
});

export const create = asyncHandler(async (req, res) => {
  created(res, toCamelCase(await ThirdPartyService.create(req.validated)));
});

export const update = asyncHandler(async (req, res) => {
  ok(res, toCamelCase(await ThirdPartyService.update(req.params.id, req.validated)));
});

export const remove = asyncHandler(async (req, res) => {
  await ThirdPartyService.remove(req.params.id);
  noContent(res);
});
