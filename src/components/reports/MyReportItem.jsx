import { useState } from 'react';
import { StatusBadge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { IconButton } from '../ui/IconButton.jsx';
import { Modal } from '../ui/Modal.jsx';
import { TextArea } from '../ui/Field.jsx';
import { getReportType } from '../../domain/reportTypes.js';
import { formatShortDate } from '../../utils/format.js';
import { tallyText } from './reportText.js';

/** Item de "Meus relatos" com edição da descrição e exclusão. */
export function MyReportItem({ report, onUpdate, onDelete, busy }) {
  const [mode, setMode] = useState(null); // 'edit' | 'delete' | null
  const [description, setDescription] = useState(report.description ?? '');
  const type = getReportType(report);
  const totalVotes = report.tally.confirm + report.tally.incorrect + report.tally.resolved;

  const save = async () => {
    await onUpdate(report.id, { description: description.trim() });
    setMode(null);
  };

  return (
    <li className="flex flex-col gap-1 rounded-lg border border-line px-3 py-2.5">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[13px] font-bold">{type.short}</span>
        <div className="flex">
          <IconButton icon="edit" label={`Editar relato: ${type.label}`} onClick={() => setMode('edit')} />
          <IconButton icon="trash" label={`Excluir relato: ${type.label}`} onClick={() => setMode('delete')} />
        </div>
      </div>
      <span>
        <StatusBadge status={report.status} />
      </span>
      <span className="text-xs text-ink-soft">
        {tallyText(report)} · {formatShortDate(report.createdAt)}
      </span>
      {report.segmentLabel && <span className="text-xs text-ink-soft">{report.segmentLabel}</span>}

      {mode === 'edit' && (
        <Modal title={`Editar relato: ${type.label}`} onClose={() => setMode(null)}>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold">Descrição</span>
            <TextArea value={description} maxLength={280} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setMode(null)}>
              Cancelar
            </Button>
            <Button onClick={save} loading={busy}>
              Salvar
            </Button>
          </div>
        </Modal>
      )}

      {mode === 'delete' && (
        <Modal title="Excluir relato?" onClose={() => setMode(null)}>
          <p className="m-0 text-[13px]">
            O relato “{type.label}” e as {totalVotes} avaliações dele serão removidos, e a nota do trecho será recalculada. Isso não pode ser desfeito.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setMode(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => onDelete(report.id)} loading={busy}>
              Excluir
            </Button>
          </div>
        </Modal>
      )}
    </li>
  );
}
