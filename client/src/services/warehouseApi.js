import api, { unwrap } from './api.js';

/** docs/API.md §7 */
export const warehouseApi = {
  list: () => api.get('/warehouses').then(unwrap),
  get: (id) => api.get(`/warehouses/${id}`).then(unwrap),
  create: (payload) => api.post('/warehouses', payload).then(unwrap),
  update: (id, payload) => api.patch(`/warehouses/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/warehouses/${id}`).then(unwrap),
};

export const locationApi = {
  list: (params) => api.get('/locations', { params }).then(unwrap),
  get: (id) => api.get(`/locations/${id}`).then(unwrap),
  create: (payload) => api.post('/locations', payload).then(unwrap),
  update: (id, payload) => api.patch(`/locations/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/locations/${id}`).then(unwrap),
};
