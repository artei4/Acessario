/** Grupo de opções de escolha única exibidas como cartões. */
export function ChoiceGrid({ legend, name, options, value, onChange, tone, columns = 2 }) {
  return (
    <fieldset className={`choice-grid ${columns === 3 ? 'choice-grid--3' : ''}`}>
      {legend && <legend className="field__label" style={{ gridColumn: '1 / -1', marginBottom: 6 }}>{legend}</legend>}
      {options.map((option) => (
        <label key={option.value} className={`choice ${tone ? `choice--${tone}` : ''}`}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
