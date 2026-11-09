import { StatusBadge } from '../ui/Badge.jsx';
import { SectionTitle } from '../ui/Card.jsx';
import { SafetyBadge } from './SafetyBadge.jsx';
import { safetyAgeText } from '../../domain/safety.js';

function SafetyItem({ item }) {
  const { report, type, ageDays, daysLeft } = item;
  return (
    <li className="flex flex-col gap-0.5 rounded-lg border border-line px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] font-bold">
          {report.kind === 'safe' ? '＋ ' : ''}
          {type.label}
        </span>
        <StatusBadge status={report.status} />
      </div>
      <span className="text-xs text-ink-soft">
        Relatado {safetyAgeText(ageDays)} · deixa de valer em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}
      </span>
      {report.description && <span className="text-xs">{report.description}</span>}
    </li>
  );
}

/** Seção "Segurança neste trecho" do detalhe do trecho (tela 4). */
export function SafetySection({ safety }) {
  const items = [...safety.risks, ...safety.positives];
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle as="h3">Segurança neste trecho</SectionTitle>
        <SafetyBadge safety={safety} />
      </div>
      {items.length === 0 ? (
        <p className="m-0 text-[13px] text-ink-soft">Nenhuma ocorrência recente relatada aqui.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {items.map((item) => (
            <SafetyItem key={item.report.id} item={item} />
          ))}
        </ul>
      )}
      <p className="m-0 text-xs text-ink-soft">
        O índice usa só ocorrências relatadas pelas pessoas e perde peso com o tempo. Ele não classifica bairros.
      </p>
    </div>
  );
}
