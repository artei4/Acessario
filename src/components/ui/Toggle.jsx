import { useId } from 'react';

export function Toggle({ label, description, checked, onChange, disabled }) {
  const id = useId();
  return (
    <label className="toggle" htmlFor={id}>
      <span>
        <span className="small strong">{label}</span>
        {description && <span className="tiny muted" style={{ display: 'block' }}>{description}</span>}
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle__track" aria-hidden="true" />
    </label>
  );
}
