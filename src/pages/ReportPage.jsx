import { useCallback, useMemo } from 'react';
import { Page } from '../components/layout/Page.jsx';
import { TopBar } from '../components/layout/TopBar.jsx';
import { Notice } from '../components/ui/Card.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { ErrorState, LoadingState } from '../components/ui/States.jsx';
import { ReportVoteCard } from '../components/reports/ReportVoteCard.jsx';
import { NewReportForm } from '../components/reports/NewReportForm.jsx';
import { useRouteDetail } from '../hooks/useRouteDetail.js';
import { useReportActions } from '../hooks/useReportActions.js';
import { useCurrentUser } from '../context/UserContext.jsx';

/** Telas 5A (Confirmar relato) e 5B (Novo problema). */
export function ReportPage({ routeId, segmentId, query, navigate, back }) {
  const { user } = useCurrentUser();
  const { evaluation, myVotes, findSegment, loading, error, reload } = useRouteDetail(routeId, { reversed: query.inverso === '1' });
  const actions = useReportActions({ onChange: reload });

  const current = findSegment(segmentId);
  const reports = useMemo(() => {
    if (!evaluation) return [];
    // ordem: relatos de outras pessoas antes dos seus; do trecho atual antes; obstáculos antes de facilidades
    const rank = (r) => (r.userId === user.id ? 4 : 0) + (r.segmentId === segmentId ? 0 : 2) + (r.kind === 'obstacle' ? 0 : 1);
    return [...evaluation.activeReports].sort((a, b) => rank(a) - rank(b));
  }, [evaluation, segmentId, user.id]);

  const pendingCount = reports.filter((r) => r.userId !== user.id && !myVotes.has(r.id)).length;
  const hasReports = reports.length > 0;
  const tab = hasReports && query.aba !== 'novo' ? 'confirmar' : 'novo';
  const setTab = (aba) => navigate(`/rotas/${routeId}/trechos/${segmentId}/relatar`, { ...query, aba }, { replace: true });

  const handleCreate = useCallback(
    async (report) => {
      await actions.createReport(report);
      navigate(`/rotas/${routeId}`, { trecho: report.segmentId, inverso: query.inverso });
    },
    [actions, navigate, routeId, query.inverso],
  );

  if (loading)
    return (
      <Page>
        <LoadingState lines={3} height={140} />
      </Page>
    );
  if (error || !evaluation || !current)
    return (
      <Page>
        <ErrorState error={error} onRetry={reload} />
      </Page>
    );

  const tabs = [...(hasReports ? [{ id: 'confirmar', label: 'Confirmar relato', count: pendingCount }] : []), { id: 'novo', label: 'Novo problema' }];
  const segmentsById = new Map(evaluation.segments.map((s) => [s.segment.id, s.segment]));
  const subtitle = `${evaluation.route.name} · ${current.code}${tab === 'confirmar' ? ' · já relatado por outros usuários' : ''}`;

  return (
    <Page>
      <TopBar
        title={tab === 'confirmar' ? 'Esse problema ainda existe?' : 'Encontrou algum problema?'}
        subtitle={subtitle}
        onBack={() => back(`/rotas/${routeId}`)}
      />
      <Tabs tabs={tabs} value={tab} onChange={setTab} label="Tipo de contribuição" />
      <Notice>{tab === 'confirmar' ? 'Esta aba só aparece se a sua rota passa por um problema já relatado.' : 'Esta aba aparece em todas as rotas.'}</Notice>

      {tab === 'confirmar' ? (
        <div className="flex flex-col gap-2.5" role="tabpanel" aria-label="Confirmar relato">
          {reports.map((report, index) => (
            <ReportVoteCard
              key={report.id}
              report={report}
              segment={segmentsById.get(report.segmentId)}
              featured={index === 0}
              myVote={myVotes.get(report.id)}
              isOwn={report.userId === user.id}
              busy={actions.isPending(`vote:${report.id}`)}
              onVote={(id, type) => actions.vote(id, type).catch(() => {})}
              onUndo={(voteId, id) => actions.undoVote(voteId, id).catch(() => {})}
            />
          ))}
          <p className="text-center text-[13px] text-ink-soft">
            Viu outro problema?{' '}
            <button type="button" className="cursor-pointer font-semibold text-brand" onClick={() => setTab('novo')}>
              Use a aba Novo problema.
            </button>
          </p>
        </div>
      ) : (
        <div role="tabpanel" aria-label="Novo problema">
          <NewReportForm
            segments={evaluation.segments.map((s) => s.segment)}
            initialSegment={current.segment}
            onSubmit={(report) => handleCreate(report).catch(() => {})}
            submitting={actions.isPending('create')}
          />
        </div>
      )}
    </Page>
  );
}
