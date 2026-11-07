import { useMemo } from 'react';
import { reportsService, votesService } from '../services/reportsService.js';
import { segmentsService } from '../services/routesService.js';
import { describeReports } from '../domain/reportStatus.js';
import { segmentCode } from '../domain/scoring.js';
import { useAsync } from './useAsync.js';

/** Relatos feitos pelo usuário, com status calculado e o trecho onde estão. */
export function useMyReports(userId) {
  const { data, error, loading, reload } = useAsync(
    async () => {
      const reports = await reportsService.listByUser(userId);
      const [votes, segments] = await Promise.all([
        votesService.listByReports(reports.map((r) => r.id)),
        segmentsService.listAll(),
      ]);
      return { reports, votes, segments };
    },
    [userId],
    { enabled: Boolean(userId) },
  );

  const reports = useMemo(() => {
    if (!data) return [];
    const segmentsById = new Map(data.segments.map((s) => [s.id, s]));
    return describeReports(data.reports, data.votes).map((report) => {
      const segment = segmentsById.get(report.segmentId);
      return { ...report, segment, segmentLabel: segment ? `${segmentCode(segment)} · ${segment.street}` : '' };
    });
  }, [data]);

  return { reports, error, loading, reload };
}
