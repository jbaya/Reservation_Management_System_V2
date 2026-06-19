import { BASE } from './client.js';

// Public — no token needed (this IS how the token gets minted).
export const loginUser = (username, password, userType) =>
  fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, userType }),
  }).then(r => r.json());
