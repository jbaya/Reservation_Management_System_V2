import { BookingService } from '../services/bookingService.js';
import { toCamelCase } from '../utils/caseMapper.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, noContent } from '../utils/apiResponse.js';

export const list = asyncHandler(async (req, res) => {
  ok(res, toCamelCase(await BookingService.list()));
});

export const get = asyncHandler(async (req, res) => {
  ok(res, toCamelCase(await BookingService.get(req.params.id)));
});

export const create = asyncHandler(async (req, res) => {
  created(res, toCamelCase(await BookingService.create(req.validated, req.user)));
});

export const update = asyncHandler(async (req, res) => {
  ok(res, toCamelCase(await BookingService.update(req.params.id, req.validated, req.user)));
});

export const remove = asyncHandler(async (req, res) => {
  await BookingService.remove(req.params.id);
  noContent(res);
});

export const addComment = asyncHandler(async (req, res) => {
  created(res, toCamelCase(await BookingService.addComment(req.params.id, req.validated)));
});
