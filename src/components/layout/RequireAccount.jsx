import { useCurrentUser } from '../../context/UserContext.jsx';
import { Button } from '../ui/Button.jsx';
import { Card } from '../ui/Card.jsx';
import { Icon } from '../ui/Icon.jsx';

/**
 * Mostra o conteúdo só para quem tem conta. Para visitantes, explica por que precisa
 * de conta e leva para a tela de entrada.
 */
export function RequireAccount({ children, action = 'relatar e confirmar problemas' }) {
  const { isGuest, signOut } = useCurrentUser();
  if (!isGuest) return children;
  return (
    <Card variant="soft" className="flex flex-col items-start gap-2" role="note">
      <span className="flex items-center gap-2 font-bold">
        <Icon name="user" size={18} /> Entre com uma conta para {action}
      </span>
      <p className="m-0 text-[13px] text-ink-soft">
        Assim cada relato tem um autor e ninguém confirma o mesmo relato várias vezes. Criar conta leva poucos segundos.
      </p>
      <Button size="sm" onClick={signOut}>
        Entrar ou criar conta
      </Button>
    </Card>
  );
}
