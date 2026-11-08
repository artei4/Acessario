import { useEffect, useMemo, useRef, useState } from 'react';
import { Bleed, Page } from '../components/layout/Page.jsx';
import { MapBackButton } from '../components/layout/TopBar.jsx';
import { AccessMap } from '../components/map/AccessMap.jsx';
import { LegendDot } from '../components/map/MapFrame.jsx';
import { endpointMarkers, segmentNumberMarkers, toMapRoute } from '../components/map/mapAdapters.js';
import { SegmentDetail } from '../components/routes/SegmentDetail.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorState, LoadingState } from '../components/ui/States.jsx';
import { useRouteDetail } from '../hooks/useRouteDetail.js';
import { segmentLevel } from '../domain/summary.js';
import { getReportType } from '../domain/reportTypes.js';
import { cn } from '../utils/cn.js';
import { formatKm, formatMeters } from '../utils/format.js';

function NavigationPanel({ evaluation, step, onStep, onStop }) {
  const current = evaluation.segments[step];
  const last = step === evaluation.segments.length - 1;
  const remaining = evaluation.segments.slice(step).reduce((sum, s) => sum + s.segment.lengthM, 0);
  const warnings = current.reports.filter((r) => r.active && r.kind === 'obstacle');
  return (
    <section className="flex flex-col gap-2.5 rounded-xl bg-navy p-3.5 text-on-navy" aria-live="polite" aria-label="Navegação">
      <div className="flex justify-between gap-2 text-[13px]">
        <span>
          Trecho {step + 1} de {evaluation.segments.length}
        </span>
        <span>Faltam {formatMeters(remaining)}</span>
      </div>
      <p className="m-0 text-lg font-bold">
        Siga pela {current.segment.street} por {formatMeters(current.segment.lengthM)}
      </p>
      {warnings.length > 0 && (
        <p className="m-0 text-[13px]">Atenção: {warnings.map((r) => getReportType(r).label.toLowerCase()).join(', ')}.</p>
      )}
      {current.segment.slopePct >= 6 && <p className="m-0 text-[13px]">Inclinação de {current.segment.slopePct}% neste trecho.</p>}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="on-navy" onClick={step === 0 ? onStop : () => onStep(step - 1)}>
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
  const stepsRef = useRef(null);

  // sem trecho escolhido, abre no trecho com a pior nota (onde está a atenção)
  const worst = evaluation?.segments.reduce((min, s) => (s.score < min.score ? s : min), evaluation.segments[0]);
  const selectedId = query.trecho ?? worst?.segment.id;
  const selected = evaluation?.segments.find((s) => s.segment.id === selectedId) ?? evaluation?.segments[0];
  const highlightId = navStep !== null ? evaluation?.segments[navStep]?.segment.id : selected?.segment.id;

  const markers = useMemo(() => (evaluation ? [...endpointMarkers(evaluation), ...segmentNumberMarkers(evaluation)] : []), [evaluation]);
  const mapRoutes = useMemo(() => (evaluation ? [toMapRoute(evaluation, { emphasis: 'selected' })] : []), [evaluation]);

  // mantém o trecho escolhido visível na faixa de trechos
  useEffect(() => {
    stepsRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [selected?.segment.id]);

  if (loading)
    return (
      <Page>
        <LoadingState lines={4} height={120} />
      </Page>
    );
  if (error || !evaluation)
    return (
      <Page>
        <ErrorState error={error} onRetry={reload} />
      </Page>
    );

  const selectSegment = (segmentId) => navigate(`/rotas/${routeId}`, { ...query, trecho: segmentId }, { replace: true });
  const obstacles = [
    ...new Map(
      evaluation.activeReports
        .filter((r) => r.kind === 'obstacle')
        .map((r) => {
          const seg = evaluation.segments.find((s) => s.segment.id === r.segmentId);
          const text = `${getReportType(r).short} · ${seg.code}`;
          return [text, { text, tone: r.weight >= 0.5 ? 'warning' : 'neutral' }];
        }),
    ).values(),
  ];
  const reliabilityTone = { alta: 'success', média: 'warning' }[evaluation.reliability] ?? 'neutral';

  return (
    <Page flush>
      <Bleed>
        <AccessMap
          bleed
          routes={mapRoutes}
          markers={markers}
          highlightSegmentId={highlightId}
          aspect={2}
          label={`Mapa da ${evaluation.route.name} com ${evaluation.segments.length} trechos numerados`}
        />
        <MapBackButton onClick={() => back('/rotas')} label="Voltar para as rotas" />
      </Bleed>

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[22px] font-extrabold">
            {evaluation.minutes} min · {formatKm(evaluation.distanceKm)}
          </h1>
          <p className={cn('m-0 text-[13px] font-bold', evaluation.sufficient ? 'text-ok' : 'text-ink-soft')}>
            {evaluation.sufficient ? `${evaluation.score}/100` : 'Sem nota'} · {evaluation.route.name} · via {evaluation.route.via}
          </p>
        </div>
        <Badge tone={reliabilityTone}>Confiabilidade {evaluation.reliability}</Badge>
      </div>

      {navStep === null ? (
        <Button size="lg" block icon="navigation" onClick={() => setNavStep(0)} disabled={evaluation.blocked}>
          {evaluation.blocked ? 'Rota impedida para o seu perfil' : 'Iniciar navegação'}
        </Button>
      ) : (
        <NavigationPanel evaluation={evaluation} step={navStep} onStep={setNavStep} onStop={() => setNavStep(null)} />
      )}

      {(evaluation.supportPoints.length > 0 || obstacles.length > 0) && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold">Apoio e obstáculos</span>
          <div className="flex flex-wrap gap-1.5">
            {evaluation.supportPoints.map((p) => (
              <Badge key={p} tone="success">
                {p}
              </Badge>
            ))}
            {obstacles.map((o) => (
              <Badge key={o.text} tone={o.tone}>
                {o.text}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-0.5" ref={stepsRef} role="group" aria-label="Trechos da rota">
        {evaluation.segments.map((s) => (
          <button
            key={s.segment.id}
            type="button"
            className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-line bg-surface px-3 py-1.5 text-[13px] font-semibold aria-pressed:border-brand aria-pressed:bg-brand-soft aria-pressed:text-brand"
            aria-pressed={s.segment.id === selected.segment.id}
            onClick={() => selectSegment(s.segment.id)}
          >
            <LegendDot level={segmentLevel(s)} />
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
    </Page>
  );
}
