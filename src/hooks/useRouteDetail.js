import { useCallback, useMemo } from 'react';
import { networkService } from '../services/networkService.js';
import { describeReports } from '../domain/reportStatus.js';
import { evaluateRoute } from '../domain/scoring.js';
import { useAsync } from './useAsync.js';
import { useEvaluationContext } from './useEvaluationContext.js';
import { useCurrentUser } from '../context/UserContext.jsx';

/** Uma rota avaliada, com seus trechos, relatos e o voto do usuário em cada relato. */
export function useRouteDetail(routeId, { reversed = false } = {}) {
  const context = useEvaluationContext();
  const { user } = useCurrentUser();
  const { data, error, loading, reload } = useAsync(() => networkService.loadRoute(routeId), [routeId], {
    enabled: Boolean(routeId),
  });

  const evaluation = useMemo(() => {
    if (!data) return null;
    const now = new Date();
    const reports = describeReports(data.reports, data.votes, now);
    const route = { ...data.routes[0], reversed };
    return evaluateRoute(route, data.segments, reports, { ...context, now });
  }, [data, context, reversed]);

  const myVotes = useMemo(() => {
    const map = new Map();
    data?.votes.filter((v) => v.userId === user?.id).forEach((v) => map.set(v.reportId, v));
    return map;
  }, [data, user?.id]);

  const findSegment = useCallback(
    (segmentId) => evaluation?.segments.find((s) => s.segment.id === segmentId) ?? null,
    [evaluation],
  );

  return { evaluation, myVotes, findSegment, error, loading, reload };
}
