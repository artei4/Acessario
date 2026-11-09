import { useState } from 'react';
import { Button } from '../ui/Button.jsx';
import { Notice } from '../ui/Card.jsx';
import { ChoiceGrid } from '../ui/ChoiceGrid.jsx';
import { TextArea } from '../ui/Field.jsx';
import { PhotoField } from '../ui/PhotoField.jsx';
import { Tabs } from '../ui/Tabs.jsx';
import { LocationPicker } from './LocationPicker.jsx';
import { usePhotoPicker } from '../../hooks/usePhotoPicker.js';
import { useContribution } from '../../hooks/useContribution.js';
import {
  FACILITATOR_OPTIONS,
  OBSTACLE_OPTIONS,
  SAFETY_OK_OPTIONS,
  SAFETY_RISK_OPTIONS,
  SAFETY_RISK_TYPES,
  getReportType,
  isSafetyReport,
} from '../../domain/reportTypes.js';
import { formatDateTime, signed } from '../../utils/format.js';

const KINDS = [
  { id: 'facilitator', label: 'Facilita', tone: 'success' },
  { id: 'obstacle', label: 'Dificulta', tone: 'danger' },
  { id: 'safety', label: 'Segurança' },
];

/** Na aba Segurança, o tipo escolhido diz se é ocorrência (risk) ou ponto que dá segurança (safe). */
const kindFor = (tab, type) => (tab !== 'safety' ? tab : SAFETY_RISK_TYPES[type] ? 'risk' : 'safe');

/** "Contribuir com o mapa" (tela 6): relato livre em qualquer trecho mapeado. */
export function ContributeForm({ onCreated }) {
  const { segments, submit, submitting } = useContribution({ onCreated });
  const [kind, setKind] = useState('facilitator');
  const [type, setType] = useState('');
  const [point, setPoint] = useState(null);
  const [placeName, setPlaceName] = useState(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const photo = usePhotoPicker();

  const changeKind = (next) => {
    setKind(next);
    setType('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setResult(null);
    if (!type) return setError('Escolha o que você encontrou.');
    if (!point) return setError('Marque o local no mapa, busque um endereço ou use a sua localização.');
    setError(null);
    try {
      const outcome = await submit({ point, placeName, kind: kindFor(kind, type), type, description, photo: photo.photo });
      setResult(outcome);
      setType('');
      setDescription('');
      setPoint(null);
      setPlaceName(null);
      photo.clear();
    } catch {
      // a mensagem de erro já aparece no aviso flutuante
    }
  };

  const typeLabel = result ? getReportType(result.report).short.toLowerCase() : '';

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
      <Tabs tabs={KINDS} value={kind} onChange={changeKind} label="Tipo de contribuição" />
      {kind === 'safety' ? (
        <>
          <ChoiceGrid name="contribution-type" options={SAFETY_RISK_OPTIONS} value={type} onChange={setType} columns={2} legend="O que aconteceu ou o que você percebeu?" />
          <ChoiceGrid name="contribution-type" options={SAFETY_OK_OPTIONS} value={type} onChange={setType} tone="success" columns={2} legend="O que ajuda a se sentir seguro?" />
          <Notice>
            Descreva o que aconteceu no lugar, nunca pessoas ou grupos. Relatos de segurança perdem peso com o tempo: um assalto deixa de contar depois de 30 dias.
          </Notice>
        </>
      ) : (
        <ChoiceGrid
          name="contribution-type"
          options={kind === 'facilitator' ? FACILITATOR_OPTIONS : OBSTACLE_OPTIONS}
          value={type}
          onChange={setType}
          tone={kind === 'facilitator' ? 'success' : undefined}
          columns={3}
          legend={kind === 'facilitator' ? 'O que facilita?' : 'O que dificulta?'}
        />
      )}

      <LocationPicker
        segments={segments}
        point={point}
        onChange={(p, place) => {
          setPoint(p);
          setPlaceName(place?.name ?? null);
        }}
        hint="Arraste para ajustar"
        withAddressSearch
        anywhere
      />

      <div>
        <label className="sr-only" htmlFor="contribution-description">
          Descrição
        </label>
        <TextArea
          id="contribution-description"
          className="min-h-14"
          placeholder="Descrição (opcional)"
          value={description}
          maxLength={280}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <PhotoField picker={photo} />

      <div className="flex items-center justify-between gap-2 text-[13px]">
        <span className="text-ink-soft">Data e horário do registro</span>
        <span className="font-bold tabular-nums">{formatDateTime(new Date())}</span>
      </div>

      {error && (
        <Notice tone="danger" role="alert">
          {error}
        </Notice>
      )}

      <Button type="submit" size="lg" block loading={submitting}>
        Enviar contribuição
      </Button>

      {result && (
        <Notice tone="success" role="status">
          {isSafetyReport(result.report)
            ? `Seu relato de segurança (${typeLabel}) foi registrado ${result.segment ? `em ${result.segment.street}` : result.placeName ? `em ${result.placeName}` : 'no ponto marcado'}. Ele entra no índice de segurança das rotas que passam por aqui e perde peso em ${getReportType(result.report).validDays} dias.`
            : !result.segment
            ? `Seu relato de ${typeLabel} foi registrado ${result.placeName ? `em ${result.placeName}` : 'no ponto marcado'}. Ele aparece em toda rota que passar por aqui e ganha peso quando outras pessoas confirmarem.`
            : result.impact
              ? `Seu relato de ${typeLabel} somou ${signed(result.impact)} ${Math.abs(result.impact) === 1 ? 'ponto' : 'pontos'} à nota do ${result.code} (${result.segment.street}).`
              : `Seu relato foi registrado no ${result.code} (${result.segment.street}) e passa a pesar na nota quando for confirmado.`}
        </Notice>
      )}
    </form>
  );
}
