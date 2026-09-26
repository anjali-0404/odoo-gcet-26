import api from './api.js';

/** GET /api/health -> { status, database, uptime, timestamp } */
export async function getHealth() {
  const res = await api.get('/health');
  return res.data.data;
}
