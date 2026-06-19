// Shared HTTP plumbing used by every resource module in this folder.
// Splitting api.js into per-resource files (categories.js, rooms.js, ...)
// keeps each file focused on one backend resource, while this module is the
// single place that knows about auth tokens, headers, and the 401 redirect.

export const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

// ── Auth token helper ─────────────────────────────────────────────────────────
export const getToken = () => {
  try {
    const stored = localStorage.getItem('rms_loggedIn');
    return stored ? JSON.parse(stored).token : null;
  } catch {
    return null;
  }
};

export const authHeaders = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

// If the session token is missing/expired/invalid, the backend replies 401 on
// every protected route. Previously the app just kept going with whatever
// error-shaped JSON came back (e.g. {error:'...'}), which broke any code
// expecting an array (.map crashes) and made saves look like they silently
// failed. Now we catch it in one place: clear the stale login and send the
// user back to the login screen instead of cascading errors everywhere.
export const handleUnauthorized = () => {
  localStorage.removeItem('rms_loggedIn');
  if (!window.__rms_redirecting_to_login) {
    window.__rms_redirecting_to_login = true;
    alert('Your session has expired. Please log in again.');
    window.location.reload();
  }
};

export const toJson = (r) => {
  if (r.status === 401) {
    handleUnauthorized();
    return Promise.reject(new Error('Session expired'));
  }
  return r.json();
};

export const get  = (url) => fetch(url, { headers: authHeaders() }).then(toJson);
export const del  = (url) => fetch(url, { method: 'DELETE', headers: authHeaders() }).then(toJson);
export const post = (url, body) => fetch(url, { method: 'POST',  headers: authHeaders(), body: JSON.stringify(body) }).then(toJson);
export const put  = (url, body) => fetch(url, { method: 'PUT',   headers: authHeaders(), body: JSON.stringify(body) }).then(toJson);
