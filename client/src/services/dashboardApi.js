import api, { unwrap } from './api.js';

/** docs/API.md §11 */
export const dashboardApi = {
  summary: (params) => api.get('/dashboard/summary', { params }).then(unwrap),
  operations: (params) => api.get('/dashboard/operations', { params }).then(unwrap),
};
