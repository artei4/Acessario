import { useCallback, useMemo } from 'react';
import { networkService } from '../services/networkService.js';
import { describeReports } from '../domain/reportStatus.js';
import { reportImpact, segmentCode } from '../domain/scoring.js';
import { nearestSegment } from '../domain/geo.js';
import { useAsync } from './useAsync.js';
import { useEvaluationContext } from './useEvaluationContext.js';
import { useReportActions } from './useReportActions.js';

/**
 * Contribuição livre com o mapa ("em qualquer lugar"): encontra o trecho mais próximo do
 * ponto marcado, envia o relato e calcula quanto ele mexeu na nota do trecho.
 */
export function useContribution({ onCreated } = {}) {
  const context = useEvaluationContext();
  const { data, reload } = useAsync(() => networkService.loadAllSegments(), []);
  const segments = useMemo(() => data?.segments ?? [], [data]);

  const afterChange = useCallback(async () => {
    await reload();
    await onCreated?.();
  }, [reload, onCreated]);

  const { createReport, pending } = useReportActions({ onChange: afterChange });

  const locate = useCallback((point) => (point ? nearestSegment(point, segments) : null), [segments]);

  const submit = useCallback(
    async ({ point, kind, type, description, photo }) => {
      const nearest = locate(point);
      if (!nearest) throw new Error('Marque um ponto sobre um dos trechos mapeados.');

      const created = await createReport({
        segmentId: nearest.segment.id,
        kind,
        type,
        description: description.trim(),
        photo,
        location: { lat: point[0], lon: point[1] },
      });

      // recalcula a nota do trecho com o relato novo (que entra como "não verificado")
      const fresh = await networkService.loadAllSegments();
      const segmentReports = describeReports(
        fresh.reports.filter((r) => r.segmentId === nearest.segment.id),
        fresh.votes,
      );
      const impact = reportImpact(nearest.segment, segmentReports, created.id, context);
      return { report: created, segment: nearest.segment, code: segmentCode(nearest.segment), impact };
    },
    [locate, createReport, context],
  );

  return { segments, locate, submit, submitting: pending === 'create' };
}
