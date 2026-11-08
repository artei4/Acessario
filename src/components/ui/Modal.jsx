import { useEffect, useId, useRef } from 'react';

/** Painel modal (bottom sheet). Fecha com Esc ou clique fora. */
export function Modal({ title, onClose, children }) {
  const titleId = useId();
  const ref = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.querySelector('input, textarea, button')?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-overlay sm:place-items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="mx-auto flex max-h-[90vh] w-full max-w-[440px] flex-col gap-3 overflow-auto rounded-t-2xl bg-surface px-4 pt-5 pb-6 sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={ref}
      >
        <h2 id={titleId} className="text-lg font-bold">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
