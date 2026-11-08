import { Icon } from '../ui/Icon.jsx';

const ITEMS = [
  { id: 'mapa', label: 'Mapa', icon: 'map', to: '/buscar' },
  { id: 'rotas', label: 'Rotas', icon: 'routes', to: '/rotas' },
  { id: 'contribuir', label: 'Contribuir', icon: 'plus', to: '/perfil', query: { secao: 'contribuir' } },
  { id: 'perfil', label: 'Perfil', icon: 'user', to: '/perfil' },
];

export function BottomNav({ active, onNavigate }) {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className="bottom-nav__item"
          aria-current={active === item.id ? 'page' : undefined}
          onClick={() => onNavigate(item.to, item.query)}
        >
          <Icon name={item.icon} size={22} />
          {item.label}
        </button>
      ))}
    </nav>
  );
}
