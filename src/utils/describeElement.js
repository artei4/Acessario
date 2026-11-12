/**
 * Descreve em voz alta o elemento que recebeu o foco, como um leitor de tela simples:
 * nome + tipo + estado. Ex.: "Buscar rotas, botão", "Evitar escadas, interruptor, ligado".
 */
const ROLE_NAMES = {
  button: 'botão',
  link: 'link',
  textbox: 'campo de texto',
  combobox: 'campo de busca com sugestões',
  tab: 'aba',
  checkbox: 'caixa de seleção',
  radio: 'opção',
  switch: 'interruptor',
  option: 'opção',
  slider: 'controle deslizante',
  listbox: 'lista',
  dialog: 'janela',
};

const clean = (text) => (text ?? '').replace(/\s+/g, ' ').trim();

function textOf(id, doc) {
  return clean(
    id
      .split(/\s+/)
      .map((part) => doc.getElementById(part)?.textContent ?? '')
      .join(' '),
  );
}

export function roleOf(el) {
  const explicit = el.getAttribute('role');
  if (explicit) return explicit;
  const tag = el.tagName.toLowerCase();
  if (tag === 'button') return 'button';
  if (tag === 'a' && el.hasAttribute('href')) return 'link';
  if (tag === 'select') return 'listbox';
  if (tag === 'textarea') return 'textbox';
  if (tag === 'input') {
    const type = (el.getAttribute('type') ?? 'text').toLowerCase();
    if (type === 'checkbox') return 'checkbox';
    if (type === 'radio') return 'radio';
    if (type === 'range') return 'slider';
    if (['button', 'submit', 'reset'].includes(type)) return 'button';
    return 'textbox';
  }
  return null;
}

/** Nome acessível (versão simplificada da regra do W3C). */
export function accessibleName(el) {
  const doc = el.ownerDocument;
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const text = textOf(labelledBy, doc);
    if (text) return text;
  }
  const aria = clean(el.getAttribute('aria-label'));
  if (aria) return aria;
  if (el.id) {
    const label = doc.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (label) return clean(label.textContent);
  }
  const wrappingLabel = el.closest('label');
  if (wrappingLabel) return clean(wrappingLabel.textContent);
  const tag = el.tagName.toLowerCase();
  if (tag !== 'input' && tag !== 'textarea') {
    const text = clean(el.innerText ?? el.textContent);
    if (text) return text;
  }
  return clean(el.getAttribute('placeholder') || el.getAttribute('title') || el.getAttribute('alt'));
}

export function describeElement(el) {
  if (!el || el === el.ownerDocument?.body) return '';
  const role = roleOf(el);
  const parts = [accessibleName(el)];
  if (role && ROLE_NAMES[role]) parts.push(ROLE_NAMES[role]);

  if (role === 'tab' || role === 'option') {
    if (el.getAttribute('aria-selected') === 'true') parts.push('selecionada');
  }
  const pressed = el.getAttribute('aria-pressed');
  if (pressed === 'true') parts.push('selecionado');
  const checked = el.getAttribute('aria-checked') ?? (el.checked !== undefined && ['checkbox', 'radio', 'switch'].includes(role) ? String(el.checked) : null);
  if (checked === 'true') parts.push(role === 'switch' ? 'ligado' : 'marcado');
  else if (checked === 'false') parts.push(role === 'switch' ? 'desligado' : 'não marcado');
  if (el.getAttribute('aria-expanded') === 'true' && role !== 'combobox') parts.push('aberto');
  if (el.disabled || el.getAttribute('aria-disabled') === 'true') parts.push('indisponível');

  if (role === 'textbox' || role === 'combobox') {
    const value = clean(el.value);
    if (el.type === 'password') parts.push(value ? 'senha preenchida' : 'vazio');
    else parts.push(value ? `contém: ${value}` : 'vazio');
  }
  const describedBy = el.getAttribute('aria-describedby');
  if (describedBy) {
    const text = textOf(describedBy, el.ownerDocument);
    if (text) parts.push(text);
  }
  return parts.filter(Boolean).join(', ');
}
