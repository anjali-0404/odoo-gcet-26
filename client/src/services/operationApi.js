import api, { unwrap } from './api.js';

const BASE = {
  receipt: '/receipts',
  delivery: '/deliveries',
  transfer: '/transfers',
  adjustment: '/adjustments',
};

/**
 * operationApi(type) -> { list, get, create, update, confirm, validate, cancel, pick, pack }
 * type: 'receipt' | 'delivery' | 'transfer' | 'adjustment'  (docs/API.md §8-9)
 * confirm/pick/pack only exist for some types; see the API contract.
 */
export function operationApi(type) {
  const base = BASE[type];
  const action = (name) => (id) => api.post(`${base}/${id}/${name}`).then(unwrap);
  return {
    list: (params) => api.get(base, { params }).then(unwrap),
    get: (id) => api.get(`${base}/${id}`).then(unwrap),
    create: (payload) => api.post(base, payload).then(unwrap),
    update: (id, payload) => api.patch(`${base}/${id}`, payload).then(unwrap),
    confirm: action('confirm'),
    validate: action('validate'),
    cancel: action('cancel'),
    pick: action('pick'),
    pack: action('pack'),
  };
}
