import { useId } from 'react';
import { VISION_MODES } from '../../domain/colorVision.js';
import { LEVEL_LABELS } from '../map/MapFrame.jsx';
import { levelColors, levelDash } from '../../domain/visionPalettes.js';
import { useTheme } from '../../context/ThemeContext.jsx';

/** Amostra das três cores de nível de uma paleta (o que muda no mapa e nas notas). */
export function PaletteSample({ mode, className }) {
  const { resolvedTheme } = useTheme();
  const colors = levelColors(mode, resolvedTheme);
  return (
    <span className={`flex flex-wrap gap-x-3 gap-y-1 ${className ?? ''}`}>
      {['good', 'limited', 'bad'].map((level) => {
        const dash = levelDash(mode, level);
        return (
          <span key={level} className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
            <svg width="22" height="8" viewBox="0 0 22 8" aria-hidden="true">
              <line x1="3" y1="4" x2="19" y2="4" stroke={colors[level]} strokeWidth="4.5" strokeLinecap="round" strokeDasharray={dash ? dash.map((d) => d * 4.5).join(' ') : undefined} />
            </svg>
            {LEVEL_LABELS[level]}
          </span>
        );
      })}
    </span>
  );
}

/** Escolha manual da paleta (para quem já sabe o tipo de daltonismo). */
export function VisionModePicker({ value, onChange }) {
  const name = useId();
  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-1 text-[13px] font-bold">Cores do app</legend>
      {Object.values(VISION_MODES).map((mode) => (
        <label
          key={mode.id}
          className="flex cursor-pointer flex-col gap-1 rounded-lg border-[1.5px] border-line bg-surface p-3 has-checked:border-brand has-checked:bg-brand-soft has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
        >
          <span className="flex items-center gap-2">
            <input type="radio" name={name} className="accent-(--blue)" checked={value === mode.id} onChange={() => onChange(mode.id)} />
            <span className="text-[13px] font-bold">{mode.label}</span>
          </span>
          <PaletteSample mode={mode.id} className="pl-6" />
        </label>
      ))}
    </fieldset>
  );
}
