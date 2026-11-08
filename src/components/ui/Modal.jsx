import { useEffect, useId, useRef } from 'react';

/** Painel modal simples (bottom sheet). Fecha com Esc ou clique fora. */
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
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref}>
        <h2 id={titleId} style={{ fontSize: 18 }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}
