import { useMemo } from 'react';
import { networkService } from '../services/networkService.js';
import { describeReports } from '../domain/reportStatus.js';
import { evaluateRoute, rankRoutes } from '../domain/scoring.js';
import { summarizeRecentReports } from '../domain/summary.js';
import { useAsync } from './useAsync.js';
import { useEvaluationContext } from './useEvaluationContext.js';

/**
 * Rotas entre dois lugares, avaliadas e ordenadas para o perfil do usuário.
 * Os dados vêm da API uma vez; trocar perfil ou preferências só recalcula (useMemo).
 */
export function useRouteOptions(originId, destinationId) {
  const context = useEvaluationContext();
  const enabled = Boolean(originId && destinationId && originId !== destinationId);
  const { data, error, loading, reload } = useAsync(
    () => networkService.loadBetween(originId, destinationId),
    [originId, destinationId],
    { enabled },
  );

  const result = useMemo(() => {
    if (!data) return { evaluations: [], recent: null };
    const now = new Date();
    const reports = describeReports(data.reports, data.votes, now);
    const evaluations = data.routes.map((route) =>
      evaluateRoute(route, data.segments.filter((s) => s.routeId === route.id), reports, { ...context, now }),
    );
    return {
      evaluations: rankRoutes(evaluations, context.preferences),
      recent: summarizeRecentReports(reports, now),
    };
  }, [data, context]);

  return { ...result, error, loading: enabled && loading, reload, enabled };
}
