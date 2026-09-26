import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import useToast from '../hooks/useToast.js';
import { authApi } from '../services/authApi.js';
import { TOKEN_STORAGE_KEY, UNAUTHORIZED_EVENT, USER_STORAGE_KEY } from '../utils/constants.js';
import { readJSON, readStorage, removeStorage, writeStorage } from '../utils/storage.js';

export const AuthContext = createContext(null);

/**
 * Holds the session (JWT + user) and persists it to localStorage.
 * Pages call login() after signup/login and setUser() after profile edits.
 * On start-up a stored token is re-checked with GET /auth/me; a 401 from any
 * request (expired or invalid token) logs the user out.
 */
export function AuthProvider({ children }) {
  const toast = useToast();
  const [token, setToken] = useState(() => readStorage(TOKEN_STORAGE_KEY));
  const [user, setUserState] = useState(() => readJSON(USER_STORAGE_KEY));

  const setUser = useCallback((newUser) => {
    writeStorage(USER_STORAGE_KEY, JSON.stringify(newUser));
    setUserState(newUser);
  }, []);

  const login = useCallback(
    (newToken, newUser) => {
      writeStorage(TOKEN_STORAGE_KEY, newToken);
      setToken(newToken);
      setUser(newUser);
    },
    [setUser]
  );

  const logout = useCallback(() => {
    removeStorage(TOKEN_STORAGE_KEY);
    removeStorage(USER_STORAGE_KEY);
    setToken(null);
    setUserState(null);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      if (readStorage(TOKEN_STORAGE_KEY)) toast.info('Your session has expired. Please log in again.');
      logout();
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [logout, toast]);

  // Refresh the stored user once per session (and detect a token that expired while away).
  useEffect(() => {
    if (token) authApi.me().then(setUser).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ token, user, isAuthenticated: Boolean(token), login, logout, setUser }),
    [token, user, login, logout, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
