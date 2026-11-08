import { useId } from 'react';

export function Toggle({ label, description, checked, onChange, disabled }) {
  const id = useId();
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5" htmlFor={id}>
      <span>
        <span className="block text-[13px] font-bold">{label}</span>
        {description && <span className="block text-xs text-ink-soft">{description}</span>}
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden="true"
        className="relative h-[26px] w-11 flex-none rounded-full bg-mute-line transition-colors after:absolute after:top-[3px] after:left-[3px] after:size-5 after:rounded-full after:bg-knob after:transition-transform peer-checked:bg-brand peer-checked:after:translate-x-[18px] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
      />
    </label>
  );
}
