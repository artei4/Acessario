import { useMemo } from 'react';
import { useCurrentUser } from '../context/UserContext.jsx';

/** Perfil e preferências do usuário no formato que as regras de negócio esperam. */
export function useEvaluationContext() {
  const { user } = useCurrentUser();
  const profileId = user?.profile ?? 'cadeirante';
  const preferences = user?.preferences;
  return useMemo(() => ({ profileId, preferences: preferences ?? {} }), [profileId, preferences]);
}
