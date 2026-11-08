const COLORS = { good: 'var(--green)', limited: 'var(--amber-500)', bad: 'var(--red-500)', unknown: 'var(--slate-300)' };

export function scoreLevel(score) {
  if (score === null || score === undefined) return 'unknown';
  if (score >= 75) return 'good';
  if (score >= 50) return 'limited';
  return 'bad';
}

/** Anel com a nota de 0 a 100. */
export function ScoreRing({ score, size = 52, level = scoreLevel(score) }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const value = score ?? 0;
  return (
    <div className="score-ring" style={{ width: size, height: size }} role="img" aria-label={score === null ? 'Sem nota' : `Nota ${score} de 100`}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={COLORS[level]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * circumference} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="score-ring__value" aria-hidden="true">{score ?? '–'}</span>
    </div>
  );
}
