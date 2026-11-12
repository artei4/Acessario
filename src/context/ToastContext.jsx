import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useAccessibility } from './AccessibilityContext.jsx';

const ToastContext = createContext(null);

// tons escuros (não mudam com o tema) para garantir contraste com texto branco; mudam com a paleta de cores
const TOAST_TONES = { success: 'bg-(--toast-ok)', danger: 'bg-(--toast-bad)', info: 'bg-[#0b2a5b]' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const { speak, voice } = useAccessibility();
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (message, { tone = 'success', duration = 3500 } = {}) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, message, tone }]);
      setTimeout(() => dismiss(id), duration);
      // com o guia por voz, os avisos também são falados (depois do que estiver sendo lido)
      speak(message, { interrupt: false });
    },
    [dismiss, speak],
  );

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={`fixed ${voice ? 'bottom-[136px]' : 'bottom-[76px]'} left-1/2 z-50 flex w-[min(408px,calc(100%-32px))] -translate-x-1/2 flex-col gap-2`} role="status" aria-live="polite">
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
