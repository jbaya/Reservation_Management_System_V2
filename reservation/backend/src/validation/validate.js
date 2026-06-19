import { badRequest } from '../utils/apiResponse.js';

// Express middleware factory: validates req.body against a zod schema
// before any controller/service code runs. On failure, returns a 400 with
// a readable message instead of letting a malformed request reach the
// database and surface as an opaque SQL error.
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
      .join('; ');
    return next(badRequest(message));
  }
  req.validated = result.data;
  next();
};
