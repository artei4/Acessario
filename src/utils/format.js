const DAY = 24 * 60 * 60 * 1000;

export function formatShortDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function formatDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const day = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time}`;
}

export function formatRelativeDays(iso, now = new Date()) {
  if (!iso) return 'nunca';
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / DAY);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'ontem';
  return `há ${days} dias`;
}

export function formatKm(km) {
  return `${km.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

export function formatMeters(m) {
  return m >= 1000 ? formatKm(m / 1000) : `${Math.round(m)} m`;
}

export function formatWidth(m) {
  return `${m.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;
}

export function signed(n) {
  return n > 0 ? `+${n}` : `${n}`;
}

export function plural(n, singular, pluralForm = `${singular}s`) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}
