import { useState } from 'react';
import { Button } from '../ui/Button.jsx';
import { Notice } from '../ui/Card.jsx';
import { ChoiceGrid } from '../ui/ChoiceGrid.jsx';
import { FieldError, TextArea } from '../ui/Field.jsx';
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
    <form className="flex flex-col gap-3.5" onSubmit={handleSubmit} noValidate>
      <LocationPicker segments={segments} point={point} onChange={setPoint} focus={initialSegment?.path} />
      {errors.point && <FieldError>{errors.point}</FieldError>}

      <ChoiceGrid legend="Qual problema você encontrou?" name="problem-type" options={OBSTACLE_OPTIONS} value={type} onChange={setType} />
      {errors.type && <FieldError role="alert">{errors.type}</FieldError>}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold" htmlFor="report-description">
          Descrição
        </label>
        <TextArea
          id="report-description"
          placeholder="Descreva o problema encontrado"
          value={description}
          maxLength={300}
          onChange={(e) => setDescription(e.target.value)}
        />
        {errors.description && <FieldError>{errors.description}</FieldError>}
      </div>

      <PhotoField picker={photo} />

      <div className="flex items-center justify-between gap-2 text-[13px]">
        <span className="text-ink-soft">Data e horário do registro</span>
        <span className="font-bold tabular-nums">{formatDateTime(now)}</span>
      </div>
      <Notice>
        Seu relato entra como <strong>Não verificado</strong> até outros usuários confirmarem.
      </Notice>

      <Button type="submit" size="lg" block loading={submitting}>
        Enviar relato
      </Button>
    </form>
  );
}
