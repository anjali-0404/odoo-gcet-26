import { getDBState } from '../config/db.js';
import { sendSuccess } from '../utils/response.js';

export function getHealth(req, res) {
  sendSuccess(res, {
    status: 'ok',
    database: getDBState(),
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
