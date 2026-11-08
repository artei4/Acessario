import { PlaceSearchBox } from '../places/PlaceSearchBox.jsx';

/**
 * Campo de origem ou destino. Sugere lugares conhecidos e lugares do Rio enquanto se digita.
 * Lugares vindos da busca chegam sem `id`; a tela de busca os grava na API antes de procurar rotas.
 */
export function PlaceInput({ label, iconClass, value, onChange, search }) {
  const displayValue = value ? `${value.name}${value.neighborhood ? `, ${value.neighborhood}` : ''}` : '';
  return (
    <PlaceSearchBox
      label={label}
      placeholder={`${label}: lugar ou endereço no Rio`}
      displayValue={displayValue}
      onSelect={onChange}
      localSearch={search}
      iconClass={iconClass}
    />
  );
}
