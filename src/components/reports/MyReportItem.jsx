import { useState } from 'react';
import { StatusBadge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { Icon } from '../ui/Icon.jsx';
import { Modal } from '../ui/Modal.jsx';
import { getReportType } from '../../domain/reportTypes.js';
import { formatShortDate } from '../../utils/format.js';
import { tallyText } from './reportText.js';

/** Item de "Meus relatos" com edição da descrição e exclusão. */
export function MyReportItem({ report, onUpdate, onDelete, busy }) {
  const [mode, setMode] = useState(null); // 'edit' | 'delete' | null
  const [description, setDescription] = useState(report.description ?? '');
  const type = getReportType(report);

  const save = async () => {
    await onUpdate(report.id, { description: description.trim() });
    setMode(null);
  };

  return (
    <li className="report-item">
      <div className="row row--between" style={{ flexWrap: 'nowrap' }}>
        <span className="small strong">{type.short}</span>
        <div className="row" style={{ gap: 0, flexWrap: 'nowrap' }}>
          <button type="button" className="icon-button" aria-label={`Editar relato: ${type.label}`} onClick={() => setMode('edit')}>
            <Icon name="edit" size={16} />
          </button>
          <button type="button" className="icon-button" aria-label={`Excluir relato: ${type.label}`} onClick={() => setMode('delete')}>
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>
      <span>
        <StatusBadge status={report.status} />
      </span>
      <span className="tiny muted">
        {tallyText(report)} · {formatShortDate(report.createdAt)}
      </span>
      {report.segmentLabel && <span className="tiny muted">{report.segmentLabel}</span>}

      {mode === 'edit' && (
        <Modal title={`Editar relato: ${type.label}`} onClose={() => setMode(null)}>
          <label className="field">
            <span className="field__label">Descrição</span>
            <textarea className="textarea" value={description} maxLength={280} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="grid-2">
            <Button variant="secondary" onClick={() => setMode(null)}>Cancelar</Button>
            <Button onClick={save} loading={busy}>Salvar</Button>
          </div>
        </Modal>
      )}

      {mode === 'delete' && (
        <Modal title="Excluir relato?" onClose={() => setMode(null)}>
          <p className="small" style={{ margin: 0 }}>
            O relato “{type.label}” e as {report.tally.confirm + report.tally.incorrect + report.tally.resolved} avaliações dele
            serão removidos, e a nota do trecho será recalculada. Isso não pode ser desfeito.
          </p>
          <div className="grid-2">
            <Button variant="secondary" onClick={() => setMode(null)}>Cancelar</Button>
            <Button variant="danger" onClick={() => onDelete(report.id)} loading={busy}>Excluir</Button>
          </div>
        </Modal>
      )}
    </li>
  );
}
