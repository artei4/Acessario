import { Icon } from './Icon.jsx';

/** Campo de foto com prévia. Recebe o estado de usePhotoPicker. */
export function PhotoField({ picker }) {
  const { photo, error, processing, pick, clear } = picker;
  return (
    <div className="stack" style={{ gap: 4 }}>
      <div className="photo-field">
        {photo ? (
          <img className="photo-field__preview" src={photo} alt="Prévia da foto escolhida" />
        ) : (
          <div className="photo-field__preview photo-thumb" aria-hidden="true" />
        )}
        <label className="photo-field__drop">
          <Icon name="camera" size={18} />
          {processing ? 'Processando…' : photo ? 'Trocar foto' : 'Adicionar foto'}
          <input type="file" accept="image/*" capture="environment" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        {photo && (
          <button type="button" className="icon-button" onClick={clear} aria-label="Remover foto">
            <Icon name="close" size={18} />
          </button>
        )}
      </div>
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}
