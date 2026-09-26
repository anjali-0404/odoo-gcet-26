import api, { unwrap } from './api.js';

/** docs/API.md §10 */
export const ledgerApi = {
  list: (params) => api.get('/ledger', { params }).then(unwrap),
};
