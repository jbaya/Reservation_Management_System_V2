import { AuthService } from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.validated;
  const result = await AuthService.login(username, password);
  ok(res, result);
});
