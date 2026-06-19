import { useState, useCallback } from 'react';

/**
 * Owns the logged-in user session. Reads the persisted login once on mount
 * (avoids re-parsing JSON on every render) and exposes login/logout that
 * keep localStorage and state in sync.
 */
export function useAuth() {
  const [loggedUser, setLoggedUser] = useState(() => {
    try {
      const stored = localStorage.getItem('rms_loggedIn');
      return stored ? JSON.parse(stored) : null; // null = not logged in
    } catch {
      return null;
    }
  });

  const login = useCallback((user) => setLoggedUser(user), []);

  const logout = useCallback(() => {
    localStorage.removeItem('rms_loggedIn');
    setLoggedUser(null);
  }, []);

  return { loggedUser, login, logout };
}
