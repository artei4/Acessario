import { Icon } from './Icon.jsx';
import { FieldError } from './Field.jsx';

/** Campo de foto com prévia. Recebe o estado de usePhotoPicker. */
export function PhotoField({ picker }) {
  const { photo, error, processing, pick, clear } = picker;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-stretch gap-2">
        {photo ? (
          <img className="h-14 w-[72px] flex-none rounded-lg object-cover" src={photo} alt="Prévia da foto escolhida" />
        ) : (
          <div className="grid h-14 w-[72px] flex-none place-items-center rounded-lg bg-track text-ink-soft" aria-hidden="true">
            <Icon name="camera" size={20} />
          </div>
        )}
        <label className="flex min-h-14 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed border-brand bg-brand-soft font-bold text-brand has-focus-visible:outline-3 has-focus-visible:outline-focus">
          <Icon name="camera" size={18} />
          {processing ? 'Processando…' : photo ? 'Trocar foto' : 'Adicionar foto'}
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        {photo && (
          <button type="button" className="grid size-8 flex-none cursor-pointer place-items-center self-center rounded-full text-ink-soft hover:bg-surface-alt" onClick={clear} aria-label="Remover foto">
            <Icon name="close" size={18} />
          </button>
        )}
      </div>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
