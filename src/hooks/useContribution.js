import { useCallback, useMemo } from 'react';
import { networkService } from '../services/networkService.js';
import { geocodingService } from '../services/geocodingService.js';
import { describeReports } from '../domain/reportStatus.js';
import { reportImpact, segmentCode } from '../domain/scoring.js';
import { SNAP_DISTANCE_M, attachReportsToSegments, nearestSegment } from '../domain/geo.js';
import { useAsync } from './useAsync.js';
import { useEvaluationContext } from './useEvaluationContext.js';
import { useReportActions } from './useReportActions.js';

/**
 * Contribuição livre com o mapa, em qualquer ponto da cidade.
 * - Perto de um trecho de rota salvo: o relato fica ligado a ele e o app mostra quanto mexeu na nota.
 * - Longe de qualquer trecho: o relato é salvo com a localização e o nome do lugar, e passa a valer
 *   para toda rota que passar por ali (inclusive rotas calculadas depois).
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

  /** Trecho salvo sobre o qual o ponto está (ou null se o ponto é um lugar novo). */
  const locate = useCallback((point) => (point ? nearestSegment(point, segments, SNAP_DISTANCE_M) : null), [segments]);

  const submit = useCallback(
    async ({ point, placeName, kind, type, description, photo }) => {
      if (!point) throw new Error('Marque o local no mapa.');
      const nearest = locate(point);
      // nome do lugar: o endereço escolhido na busca, a rua do trecho ou a busca reversa no mapa
      const name = placeName ?? nearest?.segment.street ?? (await geocodingService.reverse(point[0], point[1]))?.name ?? null;

      const created = await createReport({
        segmentId: nearest?.segment.id ?? null,
        kind,
        type,
        description: description.trim(),
        photo,
        location: { lat: point[0], lon: point[1] },
        placeName: name,
      });

      if (!nearest) return { report: created, segment: null, placeName: name, impact: null };

      // recalcula a nota do trecho com o relato novo (que entra como "não verificado")
      const fresh = await networkService.loadAllSegments();
      const segmentReports = describeReports(attachReportsToSegments(fresh.reports, [nearest.segment]), fresh.votes);
      const impact = reportImpact(nearest.segment, segmentReports, created.id, context);
      return { report: created, segment: nearest.segment, code: segmentCode(nearest.segment), placeName: name, impact };
    },
    [locate, createReport, context],
  );

  return { segments, locate, submit, submitting: pending === 'create' };
}
