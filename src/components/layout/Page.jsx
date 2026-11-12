import { cn } from '../../utils/cn.js';
import { VoiceDock } from '../accessibility/AccessibilityControls.jsx';
import { useAccessibility } from '../../context/AccessibilityContext.jsx';

/** Moldura do app: coluna de celular centralizada na tela. */
export function AppShell({ children }) {
  return <main className="relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-surface shadow-shell">{children}</main>;
}

/**
 * Área de conteúdo de uma tela.
 * - flush: sem espaço no topo (para mapas e cabeçalhos que encostam na borda)
 * - withNav: reserva espaço para a barra inferior
 */
export function Page({ as: Tag = 'div', flush = false, withNav = true, className, children, ...props }) {
  // com o guia por voz ligado, sobra espaço embaixo para os botões flutuantes da voz
  const { voice } = useAccessibility();
  const bottom = withNav ? (voice ? 'pb-[148px]' : 'pb-[88px]') : voice ? 'pb-[76px]' : 'pb-6';
  return (
    <Tag className={cn('flex flex-1 flex-col gap-3.5 px-4', flush ? 'pt-0' : 'pt-4', bottom, className)} {...props}>
      {children}
      <VoiceDock withNav={withNav} />
    </Tag>
  );
}

/** Faixa que ignora o espaçamento lateral da página (mapas e capas de largura total). */
export function Bleed({ className, children }) {
  return <div className={cn('relative -mx-4', className)}>{children}</div>;
}
