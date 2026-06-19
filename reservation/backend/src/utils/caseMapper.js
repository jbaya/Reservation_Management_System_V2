// Single shared snake_case <-> camelCase converter. Replaces four separate
// hand-written mapping blocks that used to live inline inside
// routes/bookings.js, routes/seasons.js, and others.

const snakeToCamel = (str) => str.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const camelToSnake = (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase();

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date);

/** Convert all keys of a row (or array of rows) from snake_case to camelCase. Shallow by design — jsonb columns keep whatever shape they were stored with. */
export function toCamelCase(input) {
  if (Array.isArray(input)) return input.map(toCamelCase);
  if (!isPlainObject(input)) return input;
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    out[snakeToCamel(key)] = value;
  }
  return out;
}

/** Convert all keys of an object from camelCase to snake_case. Used when building dynamic UPDATE/INSERT column lists from a request body. */
export function toSnakeCase(input) {
  if (Array.isArray(input)) return input.map(toSnakeCase);
  if (!isPlainObject(input)) return input;
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    out[camelToSnake(key)] = value;
  }
  return out;
}
