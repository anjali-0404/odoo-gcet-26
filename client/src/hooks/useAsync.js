import { useCallback, useEffect, useState } from 'react';

/**
 * Runs an async loader and tracks { data, loading, error }.
 *   const { data, loading, error, reload } = useAsync(() => productApi.list(params), [params...]);
 * Previous data is kept while reloading so tables don't flicker when filters change.
 */
export default function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    loader()
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((error) => active && setState((s) => ({ ...s, loading: false, error })));
    return () => {
      active = false;
    };
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((data) => setState((s) => ({ ...s, data })), []);

  return { ...state, reload, setData };
}
