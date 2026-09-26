import { createContext, useCallback, useMemo, useState } from 'react';
import Icon from '../components/ui/Icon.jsx';

export const ToastContext = createContext(null);

const TONES = {
  success: 'border-success/40 text-success',
  error: 'border-danger/40 text-danger',
  info: 'border-info/40 text-info',
};

let nextId = 1;

/** Toast notifications: const toast = useToast(); toast.success('Saved'); toast.error(err.message). */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (tone, message) => {
      const id = nextId++;
      setToasts((list) => [...list.slice(-3), { id, tone, message }]);
      setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3500);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (m) => show('success', m),
      error: (m) => show('error', m),
      info: (m) => show('info', m),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-2 rounded-lg border bg-surface px-4 py-3 text-sm shadow-xl shadow-black/40 ${TONES[t.tone]}`}
          >
            <Icon name={t.tone === 'success' ? 'check' : 'alert'} className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1 text-text-strong">{t.message}</p>
            <button type="button" onClick={() => dismiss(t.id)} className="text-muted hover:text-text-strong" aria-label="Dismiss">
              <Icon name="x" className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
