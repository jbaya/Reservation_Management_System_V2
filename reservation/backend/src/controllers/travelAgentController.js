import { TravelAgentService } from '../services/travelAgentService.js';
import { toCamelCase } from '../utils/caseMapper.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, noContent } from '../utils/apiResponse.js';

export const list = asyncHandler(async (req, res) => {
  ok(res, toCamelCase(await TravelAgentService.list()));
});

export const create = asyncHandler(async (req, res) => {
  created(res, toCamelCase(await TravelAgentService.create(req.validated)));
});

export const update = asyncHandler(async (req, res) => {
  ok(res, toCamelCase(await TravelAgentService.update(req.params.id, req.validated)));
});

export const remove = asyncHandler(async (req, res) => {
  await TravelAgentService.remove(req.params.id);
  noContent(res);
});
