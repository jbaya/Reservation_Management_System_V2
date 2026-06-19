// Shared numeric coercion. Previously duplicated inline inside
// routes/bookings.js (twice — once in POST, once again in PUT) under the
// name toNumber.
export const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
};
