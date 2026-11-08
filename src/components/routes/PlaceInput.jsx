import { useId, useState } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { inputClass } from '../ui/Field.jsx';
import { cn } from '../../utils/cn.js';

/** Campo de lugar com sugestões (combobox simples e acessível por teclado). */
export function PlaceInput({ label, iconClass, value, onChange, search }) {
  const id = useId();
  const [text, setText] = useState(null); // null = mostrando o lugar escolhido
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const shown = text ?? (value ? `${value.name}, ${value.neighborhood}` : '');
  const options = open ? search(text ?? '') : [];

  const choose = (place) => {
    onChange(place);
    setText(null);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open && options[active]) {
      e.preventDefault();
      choose(options[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setText(null);
    }
  };

  return (
    <div className="relative flex flex-col gap-1.5">
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <span className={cn('pointer-events-none absolute top-1/2 left-3 flex -translate-y-1/2', iconClass)}>
          <Icon name="pin" size={18} />
        </span>
        <input
          id={id}
          className={cn(inputClass, 'pl-[38px]')}
          role="combobox"
          aria-expanded={open && options.length > 0}
          aria-controls={`${id}-list`}
          aria-activedescendant={open && options[active] ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          placeholder={label}
          value={shown}
          onFocus={(e) => {
            setOpen(true);
            setActive(0);
            e.target.select();
          }}
          onBlur={() =>
            setTimeout(() => {
              setOpen(false);
              setText(null);
            }, 120)
          }
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      {open && options.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="absolute top-full right-0 left-0 z-30 m-0 mt-1 list-none rounded-lg border border-line bg-surface p-1 shadow-soft">
          {options.map((place, i) => (
            <li key={place.id} id={`${id}-opt-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                tabIndex={-1}
                className={cn('w-full cursor-pointer rounded-md px-2.5 py-2 text-left hover:bg-brand-soft', i === active && 'bg-brand-soft')}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(place)}
              >
                <span className="text-[13px] font-bold">{place.name}</span>
                <span className="text-xs text-ink-soft"> · {place.neighborhood}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
