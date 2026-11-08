import { useId, useState } from 'react';
import { Icon } from '../ui/Icon.jsx';

/** Campo de lugar com sugestões (combobox simples e acessível por teclado). */
export function PlaceInput({ label, iconColor, value, onChange, search }) {
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
    <div className="field" style={{ position: 'relative' }}>
      <label className="sr-only" htmlFor={id}>{label}</label>
      <div className="input-with-icon">
        <span className="input-with-icon__icon" style={{ color: iconColor }}>
          <Icon name="pin" size={18} />
        </span>
        <input
          id={id}
          className="input"
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
          onBlur={() => setTimeout(() => { setOpen(false); setText(null); }, 120)}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      {open && options.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="suggestions" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 5 }}>
          {options.map((place, i) => (
            <li key={place.id} id={`${id}-opt-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                tabIndex={-1}
                style={i === active ? { background: 'var(--blue-50)' } : undefined}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(place)}
              >
                <span className="strong small">{place.name}</span>
                <span className="tiny muted"> · {place.neighborhood}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
