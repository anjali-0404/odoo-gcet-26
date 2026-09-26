import { categoryApi, productApi } from '../services/productApi.js';
import { locationApi, warehouseApi } from '../services/warehouseApi.js';
import useAsync from './useAsync.js';

// Option lists for filter and form <Select>s.

export function useWarehouseOptions() {
  const { data } = useAsync(() => warehouseApi.list(), []);
  return (data ?? []).map((w) => ({ value: w._id, label: `${w.name} (${w.code})` }));
}

export function useCategoryOptions() {
  const { data } = useAsync(() => categoryApi.list(), []);
  return (data ?? []).map((c) => ({ value: c._id, label: c.name }));
}

export function useLocationOptions(warehouse) {
  const { data } = useAsync(() => locationApi.list(warehouse ? { warehouse } : {}), [warehouse]);
  return (data ?? []).map((l) => ({ value: l._id, label: l.fullName }));
}

/** Active products for line pickers: { options, byId }. */
export function useProductOptions() {
  const { data } = useAsync(() => productApi.list({ limit: 100 }), []);
  const items = data?.items ?? [];
  return {
    options: items.map((p) => ({ value: p._id, label: `[${p.sku}] ${p.name}` })),
    byId: Object.fromEntries(items.map((p) => [p._id, p])),
  };
}
