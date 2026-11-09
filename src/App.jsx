import { useEffect } from 'react';
import { BottomNav } from './components/layout/BottomNav.jsx';
import { AppShell, Page } from './components/layout/Page.jsx';
import { Notice } from './components/ui/Card.jsx';
import { ErrorState, LoadingState } from './components/ui/States.jsx';
import { useCurrentUser } from './context/UserContext.jsx';
import { matchPath, useHashRouter } from './hooks/useHashRouter.js';
import { OnboardingPage } from './pages/OnboardingPage.jsx';
import { SearchPage } from './pages/SearchPage.jsx';
import { RoutesPage } from './pages/RoutesPage.jsx';
import { RouteSummaryPage } from './pages/RouteSummaryPage.jsx';
import { ReportPage } from './pages/ReportPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { config } from './config/env.js';

/** Tabela de rotas: padrão → página e item ativo da barra inferior. */
const ROUTES = [
  { pattern: '/boas-vindas', page: OnboardingPage, nav: null },
  { pattern: '/buscar', page: SearchPage, nav: 'mapa' },
  { pattern: '/rotas', page: RoutesPage, nav: 'rotas' },
  { pattern: '/rotas/:routeId', page: RouteSummaryPage, nav: 'rotas' },
  { pattern: '/rotas/:routeId/trechos/:segmentId/relatar', page: ReportPage, nav: 'rotas' },
  { pattern: '/perfil', page: ProfilePage, nav: 'perfil' },
];

function resolve(path) {
  for (const route of ROUTES) {
    const params = matchPath(route.pattern, path);
    if (params) return { ...route, params };
  }
  return null;
}

export function App() {
  const { user, signedIn, loading, error, reload } = useCurrentUser();
  const { path, query, navigate, back } = useHashRouter();
  const match = resolve(path);
  const needsOnboarding = user && !user.profile;

  useEffect(() => {
    if (!user) return;
    if (needsOnboarding && path !== '/boas-vindas') navigate('/boas-vindas', undefined, { replace: true });
    else if (!match) navigate('/buscar', undefined, { replace: true });
  }, [user, needsOnboarding, path, match, navigate]);

  // sem conta ativa: tela de entrada, qualquer que seja o endereço
  if (!signedIn) {
    return (
      <AppShell>
        <LoginPage navigate={navigate} />
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <Page withNav={false}>
          <LoadingState lines={4} />
        </Page>
      </AppShell>
    );
  }

  if (error || !user) {
    return (
      <AppShell>
        <Page withNav={false}>
          <ErrorState error={error} onRetry={reload} />
          {config.apiMode === 'http' && (
            <Notice>
              A API em {config.apiUrl} não respondeu. Rode <code className="font-mono text-xs">npm start</code> (API + app) ou{' '}
              <code className="font-mono text-xs">npm run api</code> em outro terminal. Para testar sem servidor, use <code className="font-mono text-xs">npm run dev:demo</code>.
            </Notice>
          )}
        </Page>
      </AppShell>
    );
  }

  if (!match || (needsOnboarding && path !== '/boas-vindas')) return <AppShell />;

  const Screen = match.page;
  // "Contribuir" aponta para a seção de contribuição dentro do Perfil
  const activeNav = match.nav === 'perfil' && query.secao === 'contribuir' ? 'contribuir' : match.nav;

  return (
    <AppShell>
      <Screen {...match.params} query={query} navigate={navigate} back={back} />
      {match.nav && <BottomNav active={activeNav} onNavigate={navigate} />}
    </AppShell>
  );
}
