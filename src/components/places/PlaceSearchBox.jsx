import { useId, useState } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { Spinner } from '../ui/Button.jsx';
import { inputClass } from '../ui/Field.jsx';
import { useAddressAutocomplete } from '../../hooks/useAddressAutocomplete.js';
import { cn } from '../../utils/cn.js';

const MIN_LENGTH = 3;
const MAX_LOCAL = 4;

/**
 * Campo de busca de lugares com sugestões enquanto se digita (combobox acessível).
 * Mostra primeiro os lugares já conhecidos pelo app (`localSearch`) e depois os lugares
 * do OpenStreetMap encontrados pelo Photon.
 *
 * @param {string}   label        rótulo (lido por leitores de tela)
 * @param {string}   displayValue texto mostrado quando a pessoa não está digitando
 * @param {Function} onSelect     recebe o lugar escolhido ({ name, lat, lon, … })
 * @param {Function} localSearch  opcional: (termo) => lugares conhecidos
 */
export function PlaceSearchBox({ label, placeholder, displayValue = '', onSelect, localSearch, icon = 'pin', iconClass, inputId }) {
  const generatedId = useId();
  const id = inputId ?? generatedId;
  const [text, setText] = useState(null); // null = mostrando displayValue
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const typing = text !== null;
  const term = (text ?? '').trim();
  const suggestions = useAddressAutocomplete(text, { enabled: open && typing, minLength: MIN_LENGTH });

  const local = open && localSearch ? localSearch(term).slice(0, term ? MAX_LOCAL : 8).map((place) => ({ key: `l-${place.id}`, place, remote: false })) : [];
  const remote =
    open && typing && term.length >= MIN_LENGTH
      ? suggestions.results
          .filter((r) => !local.some((l) => l.place.osmId === r.osmId))
          .map((place) => ({ key: `r-${place.osmId}-${place.lat}`, place, remote: true }))
      : [];
  const options = [...local, ...remote];
  const activeIndex = Math.min(active, Math.max(options.length - 1, 0));

  const choose = (place) => {
    onSelect(place);
    setText(null);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive(Math.min(activeIndex + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && options[activeIndex]) {
        e.preventDefault();
        choose(options[activeIndex].place);
      } else if (typing) {
        e.preventDefault(); // não envia o formulário com um lugar pela metade
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setText(null);
    }
  };

  const showStatus = typing && term.length >= MIN_LENGTH;
  const showList = open && (options.length > 0 || showStatus || (typing && term.length > 0));

  return (
    <div className="relative flex flex-col gap-1.5">
      {label && (
        <label className="sr-only" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="relative">
        <span className={cn('pointer-events-none absolute top-1/2 left-3 flex -translate-y-1/2', iconClass ?? 'text-ink-soft')}>
          <Icon name={icon} size={18} />
        </span>
        <input
          id={id}
          className={cn(inputClass, 'pl-[38px]')}
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={showList && options[activeIndex] ? `${id}-opt-${activeIndex}` : undefined}
          autoComplete="off"
          placeholder={placeholder ?? label}
          value={typing ? text : displayValue}
          onFocus={(e) => {
            setOpen(true);
            setActive(0);
            e.target.select();
          }}
          onBlur={() =>
            setTimeout(() => {
              setOpen(false);
              setText(null);
            }, 150)
          }
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
      </div>

      {showList && (
        <div className="absolute top-full right-0 left-0 z-30 mt-1 rounded-lg border border-line bg-surface p-1 shadow-soft">
          {options.length > 0 && (
            <ul id={`${id}-list`} role="listbox" aria-label={`Sugestões para ${label ?? 'lugar'}`} className="m-0 max-h-80 list-none overflow-auto p-0">
              {options.map((option, i) => (
                <li key={option.key} id={`${id}-opt-${i}`} role="option" aria-selected={i === activeIndex}>
                  <button
                    type="button"
                    tabIndex={-1}
                    className={cn(
                      'flex w-full cursor-pointer items-start gap-2 rounded-md px-2.5 py-2 text-left hover:bg-brand-soft',
                      i === activeIndex && 'bg-brand-soft',
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(option.place)}
                  >
                    <Icon name={option.remote ? 'locate' : 'pin'} size={16} className="mt-0.5 flex-none text-ink-soft" />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold">{option.place.name}</span>
                      <span className="block truncate text-xs text-ink-soft">{option.remote ? option.place.label : option.place.neighborhood}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div role="status" aria-live="polite" className={cn(options.length > 0 && (suggestions.loading || suggestions.error) && 'border-t border-line pt-1')}>
            {typing && term.length > 0 && term.length < MIN_LENGTH && options.length === 0 && (
              <p className="m-0 px-2.5 py-2 text-[13px] text-ink-soft">Continue digitando para ver sugestões…</p>
            )}
            {showStatus && suggestions.loading && (
              <p className="m-0 flex items-center gap-2 px-2.5 py-2 text-[13px] text-ink-soft">
                <Spinner /> Buscando lugares no Rio…
              </p>
            )}
            {showStatus && suggestions.error && <p className="m-0 px-2.5 py-2 text-[13px] text-bad">{suggestions.error.userMessage}</p>}
            {showStatus && !suggestions.loading && !suggestions.error && suggestions.term === term && options.length === 0 && (
              <p className="m-0 px-2.5 py-2 text-[13px] text-ink-soft">Nada encontrado no Rio para “{term}”. Tente o nome da rua ou do lugar.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
