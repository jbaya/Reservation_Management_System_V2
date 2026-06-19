// Backward-compatible barrel: every existing `import { x } from '../api'` or
// `from './api'` elsewhere in the frontend keeps working unchanged, because
// this file re-exports everything that used to live in the single flat
// api.js. New code should prefer importing directly from the specific
// resource module (e.g. `import { getBookings } from './api/bookings.js'`)
// since it makes dependencies explicit, but nothing requires that yet.

export * from './auth.js';
export * from './categories.js';
export * from './rooms.js';
export * from './bookings.js';
export * from './agents.js';
export * from './thirdParties.js';
export * from './seasons.js';
export * from './rates.js';
export * from './floors.js';
export * from './specialDates.js';
export * from './users.js';
export * from './designations.js';
