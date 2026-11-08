import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

// tons fixos (não mudam com o tema) para garantir contraste com texto branco
const TOAST_TONES = { success: 'bg-[#15803d]', danger: 'bg-[#b91c1c]', info: 'bg-[#0b2a5b]' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (message, { tone = 'success', duration = 3500 } = {}) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, message, tone }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-[76px] left-1/2 z-50 flex w-[min(408px,calc(100%-32px))] -translate-x-1/2 flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            className={`animate-toast-in cursor-pointer rounded-lg px-3.5 py-3 text-left font-semibold text-white shadow-soft ${TOAST_TONES[toast.tone] ?? TOAST_TONES.info}`}
            onClick={() => dismiss(toast.id)}
          >
            {toast.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast precisa estar dentro de <ToastProvider>');
  return context;
}
