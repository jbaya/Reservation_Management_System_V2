import { ApiError } from '../utils/apiResponse.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Postgres unique-violation / FK-violation codes -> sensible HTTP status
  if (err.code === '23505') {
    return res.status(409).json({ error: 'A record with these details already exists' });
  }
  if (err.code === '23503') {
    return res.status(409).json({ error: 'This record is referenced by other data and cannot be modified' });
  }
  if (err.code === '23514') {
    return res.status(400).json({ error: 'Invalid data: a required condition was not met' });
  }

  console.error('SERVER ERROR:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
}
