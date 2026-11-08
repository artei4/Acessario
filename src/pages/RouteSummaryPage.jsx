import { useMemo, useState } from 'react';
import { CityMap } from '../components/map/CityMap.jsx';
import { endpointMarkers, segmentNumberMarkers, toMapRoute } from '../components/map/mapAdapters.js';
import { SegmentDetail } from '../components/routes/SegmentDetail.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { ErrorState, LoadingState } from '../components/ui/States.jsx';
import { useRouteDetail } from '../hooks/useRouteDetail.js';
import { segmentLevel } from '../domain/summary.js';
import { getReportType } from '../domain/reportTypes.js';
import { formatKm, formatMeters } from '../utils/format.js';
import { LEVEL_COLORS } from '../components/map/CityMap.jsx';

function NavigationPanel({ evaluation, step, onStep, onStop }) {
  const current = evaluation.segments[step];
  const last = step === evaluation.segments.length - 1;
  const remaining = evaluation.segments.slice(step).reduce((sum, s) => sum + s.segment.lengthM, 0);
  const warnings = current.reports.filter((r) => r.active && r.kind === 'obstacle');
  return (
    <section className="nav-panel" aria-live="polite" aria-label="Navegação">
      <div className="row row--between">
        <span className="small">Trecho {step + 1} de {evaluation.segments.length}</span>
        <span className="small">Faltam {formatMeters(remaining)}</span>
      </div>
      <p className="strong" style={{ margin: 0, fontSize: 18 }}>
        Siga pela {current.segment.street} por {formatMeters(current.segment.lengthM)}
      </p>
      {warnings.length > 0 && (
        <p className="small" style={{ margin: 0 }}>
          Atenção: {warnings.map((r) => getReportType(r).label.toLowerCase()).join(', ')}.
        </p>
      )}
      {current.segment.slopePct >= 6 && <p className="small" style={{ margin: 0 }}>Inclinação de {current.segment.slopePct}% neste trecho.</p>}
      <div className="grid-2">
        <Button variant="secondary" onClick={step === 0 ? onStop : () => onStep(step - 1)}>
          {step === 0 ? 'Encerrar' : 'Anterior'}
        </Button>
        <Button onClick={last ? onStop : () => onStep(step + 1)}>{last ? 'Cheguei!' : 'Próximo trecho'}</Button>
      </div>
    </section>
  );
}

/** Tela 4 — Resumo, navegação e trechos. */
export function RouteSummaryPage({ routeId, query, navigate, back }) {
  const reversed = query.inverso === '1';
  const { evaluation, loading, error, reload } = useRouteDetail(routeId, { reversed });
  const [navStep, setNavStep] = useState(null);

  // sem trecho escolhido, abre no trecho com a pior nota (onde está a atenção)
  const worst = evaluation?.segments.reduce((min, s) => (s.score < min.score ? s : min), evaluation.segments[0]);
  const selectedId = query.trecho ?? worst?.segment.id;
  const selected = evaluation?.segments.find((s) => s.segment.id === selectedId) ?? evaluation?.segments[0];
  const highlightId = navStep !== null ? evaluation?.segments[navStep]?.segment.id : selected?.segment.id;

  const markers = useMemo(() => (evaluation ? [...endpointMarkers(evaluation), ...segmentNumberMarkers(evaluation)] : []), [evaluation]);
  const mapRoutes = useMemo(() => (evaluation ? [toMapRoute(evaluation, { emphasis: 'selected' })] : []), [evaluation]);

  if (loading) return <div className="page"><LoadingState lines={4} height={120} /></div>;
  if (error || !evaluation) return <div className="page"><ErrorState error={error} onRetry={reload} /></div>;

  const selectSegment = (segmentId) => navigate(`/rotas/${routeId}`, { ...query, trecho: segmentId }, { replace: true });
  const obstacles = [...new Map(
    evaluation.activeReports
      .filter((r) => r.kind === 'obstacle')
      .map((r) => {
        const seg = evaluation.segments.find((s) => s.segment.id === r.segmentId);
        const text = `${getReportType(r).short} · ${seg.code}`;
        return [text, { text, tone: r.weight >= 0.5 ? 'warning' : 'neutral' }];
      }),
  ).values()];

  return (
    <div className="page page--flush">
      <div style={{ position: 'relative', margin: '0 -16px' }}>
        <CityMap
          className="map--bleed"
          routes={mapRoutes}
          markers={markers}
          highlightSegmentId={highlightId}
          aspect={2}
          label={`Mapa da ${evaluation.route.name} com ${evaluation.segments.length} trechos numerados`}
        />
        <button type="button" className="map__back" onClick={() => back('/rotas')} aria-label="Voltar para as rotas">
          <Icon name="back" size={20} />
        </button>
      </div>

      <div className="row row--between" style={{ alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 22 }}>{evaluation.minutes} min · {formatKm(evaluation.distanceKm)}</h1>
          <p className="small strong" style={{ margin: 0, color: evaluation.sufficient ? 'var(--green)' : 'var(--text-2)' }}>
            {evaluation.sufficient ? `${evaluation.score}/100` : 'Sem nota'} · {evaluation.route.name} · via {evaluation.route.via}
          </p>
        </div>
        <Badge tone={evaluation.reliability === 'alta' ? 'success' : evaluation.reliability === 'média' ? 'warning' : 'neutral'}>
          Confiabilidade {evaluation.reliability}
        </Badge>
      </div>

      {navStep === null ? (
        <Button size="lg" block icon="navigation" onClick={() => setNavStep(0)} disabled={evaluation.blocked}>
          {evaluation.blocked ? 'Rota impedida para o seu perfil' : 'Iniciar navegação'}
        </Button>
      ) : (
        <NavigationPanel evaluation={evaluation} step={navStep} onStep={setNavStep} onStop={() => setNavStep(null)} />
      )}

      {(evaluation.supportPoints.length > 0 || obstacles.length > 0) && (
        <div className="stack" style={{ gap: 6 }}>
          <span className="small strong">Apoio e obstáculos</span>
          <div className="row" style={{ gap: 6 }}>
            {evaluation.supportPoints.map((p) => <Badge key={p} tone="success">{p}</Badge>)}
            {obstacles.map((o) => <Badge key={o.text} tone={o.tone}>{o.text}</Badge>)}
          </div>
        </div>
      )}

      <div className="segment-steps" role="group" aria-label="Trechos da rota">
        {evaluation.segments.map((s) => (
          <button
            key={s.segment.id}
            type="button"
            className="segment-step"
            aria-pressed={s.segment.id === selected.segment.id}
            onClick={() => selectSegment(s.segment.id)}
          >
            <span className="legend-dot" style={{ background: LEVEL_COLORS[segmentLevel(s)], margin: 0 }} aria-hidden="true" />
            {s.code}
          </button>
        ))}
      </div>

      <SegmentDetail
        evaluation={selected}
        routeName={evaluation.route.name}
        onReport={() =>
          navigate(`/rotas/${routeId}/trechos/${selected.segment.id}/relatar`, {
            aba: evaluation.activeReports.length ? 'confirmar' : 'novo',
            inverso: query.inverso,
          })
        }
      />
    </div>
  );
}
