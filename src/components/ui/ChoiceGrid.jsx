import { cn } from '../../utils/cn.js';

/** Grupo de opções de escolha única exibidas como cartões. */
export function ChoiceGrid({ legend, name, options, value, onChange, tone, columns = 2 }) {
  return (
    <fieldset className={cn('m-0 grid gap-2 border-0 p-0', columns === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
      {legend && <legend className="col-span-full mb-1.5 text-sm font-bold">{legend}</legend>}
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            'relative flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border-[1.5px] border-line p-2.5 text-[13px] leading-tight font-semibold',
            'has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
            tone === 'success' ? 'has-checked:border-ok has-checked:bg-ok-soft' : 'has-checked:border-brand has-checked:bg-brand-soft',
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            className="m-0 flex-none accent-brand focus-visible:outline-none"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
