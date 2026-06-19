// Consistent response helpers so every controller returns the same shape
// instead of each route inventing its own ad-hoc JSON structure.

export const ok = (res, data, status = 200) => res.status(status).json(data);

export const created = (res, data) => res.status(201).json(data);

export const noContent = (res) => res.status(204).send();

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const notFound = (message = 'Not found') => new ApiError(404, message);
export const badRequest = (message = 'Invalid request') => new ApiError(400, message);
export const conflict = (message = 'Conflict') => new ApiError(409, message);
