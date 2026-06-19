/**
 * Parse a room's floor value into a sortable integer.
 * Basement → -1, Ground → 0, numeric string → that number,
 * fallback derives from room name (e.g. "302" → floor 3).
 *
 * This was dead code in the pre-refactor App.jsx (defined but never called).
 * Kept here, out of the component, in case floor-derived sorting is needed
 * again — relocating costs nothing, deleting working code the user didn't
 * ask to remove is an unnecessary risk.
 */
export function parseFloor(r) {
  if (r.floor !== undefined && r.floor !== null && r.floor !== '') {
    if (r.floor === 'Basement') return -1;
    if (r.floor === 'Ground') return 0;
    const p = parseInt(r.floor);
    if (!isNaN(p)) return p;
  }
  const n = parseInt(r.name);
  if (isNaN(n) || n < 100) return 1;
  return Math.floor(n / 100);
}
