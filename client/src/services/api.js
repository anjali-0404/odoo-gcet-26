import axios from 'axios';
import { TOKEN_STORAGE_KEY, UNAUTHORIZED_EVENT } from '../utils/constants.js';
import { readStorage } from '../utils/storage.js';

const baseURL = import.meta.env.VITE_API_URL;
if (!baseURL) {
  console.error('[api] VITE_API_URL is not set. Copy client/.env.example to client/.env.');
}

/**
 * Shared axios instance. Feature services (authApi, productApi, ...) use it and
 * return `response.data.data`, i.e. the payload inside { success, data }.
 */
const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = readStorage(TOKEN_STORAGE_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Errors are normalised to an Error with:
 *   message - server's human-readable message (or a network fallback)
 *   status  - HTTP status (0 when the server was unreachable)
 *   errors  - optional field-level validation errors [{ field, message }]
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;
    const message =
      body?.message ||
      (status === 0 ? 'Cannot reach the StockSense server. Is it running?' : 'Something went wrong');

    // Only a rejected *token* ends the session; a failed login attempt is also a 401.
    if (status === 401 && error.config?.headers?.Authorization) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    const normalised = new Error(message);
    normalised.status = status;
    if (body?.errors) normalised.errors = body.errors;
    return Promise.reject(normalised);
  }
);

export default api;

/** Extracts `data` from the { success, data } envelope. */
export const unwrap = (response) => response.data.data;
