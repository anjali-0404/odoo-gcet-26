import api, { unwrap } from './api.js';

/** docs/API.md §6 */
export const productApi = {
  list: (params) => api.get('/products', { params }).then(unwrap),
  get: (id) => api.get(`/products/${id}`).then(unwrap),
  create: (payload) => api.post('/products', payload).then(unwrap),
  update: (id, payload) => api.patch(`/products/${id}`, payload).then(unwrap),
  archive: (id) => api.delete(`/products/${id}`).then(unwrap),
};

/** docs/API.md §5 */
export const categoryApi = {
  list: () => api.get('/categories').then(unwrap),
  create: (payload) => api.post('/categories', payload).then(unwrap),
  update: (id, payload) => api.patch(`/categories/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/categories/${id}`).then(unwrap),
};

/** docs/API.md §6 (GET /stock) */
export const stockApi = {
  list: (params) => api.get('/stock', { params }).then(unwrap),
};
