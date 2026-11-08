import { Icon } from '../ui/Icon.jsx';

const ITEMS = [
  { id: 'mapa', label: 'Mapa', icon: 'map', to: '/buscar' },
  { id: 'rotas', label: 'Rotas', icon: 'routes', to: '/rotas' },
  { id: 'contribuir', label: 'Contribuir', icon: 'plus', to: '/perfil', query: { secao: 'contribuir' } },
  { id: 'perfil', label: 'Perfil', icon: 'user', to: '/perfil' },
];

export function BottomNav({ active, onNavigate }) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 z-20 grid h-16 w-full max-w-[440px] -translate-x-1/2 grid-cols-4 border-t border-line bg-surface"
      aria-label="Navegação principal"
    >
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className="flex cursor-pointer flex-col items-center justify-center gap-0.5 text-xs text-ink-soft aria-[current=page]:font-bold aria-[current=page]:text-brand"
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
