import { segmentLevel } from '../../domain/summary.js';
import { pathMidpoint } from '../../domain/geo.js';

/** Converte a avaliação de uma rota no formato que o <CityMap> desenha. */
export function toMapRoute(evaluation, { emphasis = 'normal', label } = {}) {
  return {
    id: evaluation.route.id,
    label,
    emphasis,
    segments: evaluation.segments.map((e) => ({
      id: e.segment.id,
      path: e.segment.path,
      level: segmentLevel(e),
      order: e.segment.order,
    })),
  };
}

export function endpointMarkers(evaluation) {
  const first = evaluation.segments[0]?.segment.path;
  const last = evaluation.segments.at(-1)?.segment.path;
  if (!first || !last) return [];
  const start = evaluation.route.reversed ? first.at(-1) : first[0];
  const end = evaluation.route.reversed ? last[0] : last.at(-1);
  return [
    { id: 'origin', kind: 'origin', point: start },
    { id: 'destination', kind: 'destination', point: end },
  ];
}

export function segmentNumberMarkers(evaluation) {
  return evaluation.segments.map((e) => ({
    id: `n-${e.segment.id}`,
    kind: 'number',
    label: String(e.segment.order),
    point: pathMidpoint(e.segment.path),
  }));
}
