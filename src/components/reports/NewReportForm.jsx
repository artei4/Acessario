import { useState } from 'react';
import { Button } from '../ui/Button.jsx';
import { ChoiceGrid } from '../ui/ChoiceGrid.jsx';
import { PhotoField } from '../ui/PhotoField.jsx';
import { LocationPicker } from './LocationPicker.jsx';
import { usePhotoPicker } from '../../hooks/usePhotoPicker.js';
import { OBSTACLE_OPTIONS } from '../../domain/reportTypes.js';
import { nearestSegment, pathMidpoint } from '../../domain/geo.js';
import { formatDateTime } from '../../utils/format.js';

/** Formulário "Encontrou algum problema?" (tela 5B). */
export function NewReportForm({ segments, initialSegment, onSubmit, submitting }) {
  const [point, setPoint] = useState(() => (initialSegment ? pathMidpoint(initialSegment.path) : null));
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const photo = usePhotoPicker();
  const [now] = useState(() => new Date());

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nearest = point && nearestSegment(point, segments);
    const nextErrors = {};
    if (!type) nextErrors.type = 'Escolha o tipo de problema.';
    if (!nearest) nextErrors.point = 'Marque um ponto sobre a rota.';
    if (description.length > 280) nextErrors.description = 'Use até 280 caracteres.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit({
      segmentId: nearest.segment.id,
      kind: 'obstacle',
      type,
      description: description.trim(),
      photo: photo.photo,
      location: { lat: point[0], lon: point[1] },
    });
    setType('');
    setDescription('');
    photo.clear();
  };

  return (
    <form className="stack" style={{ gap: 14 }} onSubmit={handleSubmit} noValidate>
      <LocationPicker segments={segments} point={point} onChange={setPoint} focus={initialSegment?.path} />
      {errors.point && <span className="field__error">{errors.point}</span>}

      <ChoiceGrid legend="Qual problema você encontrou?" name="problem-type" options={OBSTACLE_OPTIONS} value={type} onChange={setType} />
      {errors.type && <span className="field__error" role="alert">{errors.type}</span>}

      <div className="field">
        <label className="field__label" htmlFor="report-description">Descrição</label>
        <textarea
          id="report-description"
          className="textarea"
          placeholder="Descreva o problema encontrado"
          value={description}
          maxLength={300}
          onChange={(e) => setDescription(e.target.value)}
        />
        {errors.description && <span className="field__error">{errors.description}</span>}
      </div>

      <PhotoField picker={photo} />

      <div className="row row--between small">
        <span className="muted">Data e horário do registro</span>
        <span className="strong">{formatDateTime(now)}</span>
      </div>
      <p className="notice" style={{ margin: 0 }}>
        Seu relato entra como <strong>Não verificado</strong> até outros usuários confirmarem.
      </p>

      <Button type="submit" size="lg" block loading={submitting}>
        Enviar relato
      </Button>
    </form>
  );
}
