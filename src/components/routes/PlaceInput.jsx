import { useId, useState } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { Spinner } from '../ui/Button.jsx';
import { inputClass } from '../ui/Field.jsx';
import { useGeocoding } from '../../hooks/useGeocoding.js';
import { cn } from '../../utils/cn.js';

const MIN_SEARCH = 3;

/**
 * Campo de lugar (combobox acessível por teclado).
 * Sugere os lugares já conhecidos pelo app e, sob pedido (botão ou Enter), busca qualquer
 * endereço ou lugar do Rio na Nominatim. Lugares da busca chegam sem `id`; quem usa o campo
 * grava o lugar na API antes de buscar rotas.
 */
export function PlaceInput({ label, iconClass, value, onChange, search }) {
  const id = useId();
  const geocoding = useGeocoding();
  const [text, setText] = useState(null); // null = mostrando o lugar escolhido
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [searchedTerm, setSearchedTerm] = useState('');

  const term = (text ?? '').trim();
  const shown = text ?? (value ? `${value.name}${value.neighborhood ? `, ${value.neighborhood}` : ''}` : '');
  const local = open ? search(term).map((place) => ({ key: place.id, place, remote: false })) : [];
  const remote =
    open && searchedTerm && searchedTerm === term
      ? geocoding.results.filter((r) => !local.some((l) => l.place.osmId === r.osmId)).map((place) => ({ key: place.osmId, place, remote: true }))
      : [];
  const options = [...local, ...remote];
  const canSearch = term.length >= MIN_SEARCH;

  const choose = (place) => {
    onChange(place);
    setText(null);
    setOpen(false);
  };

  const runSearch = async () => {
    if (!canSearch) return;
    setSearchedTerm(term);
    setActive(local.length);
    await geocoding.search(term);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      // com uma opção na lista, escolhe; sem nenhuma, busca no mapa
      if (options[active]) choose(options[active].place);
      else runSearch();
    } else if (e.key === 'Escape') {
      setOpen(false);
      setText(null);
    }
  };

  const showList = open && (options.length > 0 || canSearch);

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
          aria-expanded={showList}
          aria-controls={`${id}-list`}
          aria-activedescendant={showList && options[active] ? `${id}-opt-${active}` : undefined}
          aria-describedby={`${id}-hint`}
          autoComplete="off"
          placeholder={`${label}: lugar ou endereço no Rio`}
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
      <span id={`${id}-hint`} className="sr-only">
        Digite e pressione Enter para buscar qualquer lugar ou endereço do Rio de Janeiro.
      </span>

      {showList && (
        <div className="absolute top-full right-0 left-0 z-30 mt-1 rounded-lg border border-line bg-surface p-1 shadow-soft">
          <ul id={`${id}-list`} role="listbox" className="m-0 max-h-72 list-none overflow-auto p-0">
            {options.map((option, i) => (
              <li key={option.key} id={`${id}-opt-${i}`} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  tabIndex={-1}
                  className={cn('flex w-full cursor-pointer items-start gap-2 rounded-md px-2.5 py-2 text-left hover:bg-brand-soft', i === active && 'bg-brand-soft')}
                  onMouseDown={(e) => e.preventDefault()}
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

          {canSearch && (
            <div className="border-t border-line pt-1">
              {geocoding.loading ? (
                <p className="m-0 flex items-center gap-2 px-2.5 py-2 text-[13px] text-ink-soft" role="status">
                  <Spinner /> Buscando no mapa…
                </p>
              ) : searchedTerm === term && geocoding.error ? (
                <p className="m-0 px-2.5 py-2 text-[13px] text-bad">{geocoding.error.userMessage}</p>
              ) : searchedTerm === term && geocoding.searched && remote.length === 0 ? (
                <p className="m-0 px-2.5 py-2 text-[13px] text-ink-soft">Nada encontrado no Rio para “{term}”. Tente o nome da rua ou do lugar.</p>
              ) : searchedTerm !== term ? (
                <button
                  type="button"
                  tabIndex={-1}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] font-semibold text-brand hover:bg-brand-soft"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={runSearch}
                >
                  <Icon name="locate" size={16} /> Buscar “{term}” no Rio de Janeiro
                </button>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
