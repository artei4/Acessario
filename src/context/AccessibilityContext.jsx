import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { speech } from '../services/speech.js';
import { levelColors, paletteCss } from '../domain/visionPalettes.js';
import { describeElement } from '../utils/describeElement.js';
import { useTheme } from './ThemeContext.jsx';

/**
 * Ajustes de acessibilidade deste aparelho:
 *  - `vision`: paleta de cores ('none', 'red-green', 'blue-yellow', 'mono'), escolhida pelo teste de cores;
 *  - `voice`: guia por voz (lê cada tela, o item em foco e os avisos);
 *  - `rate`: velocidade da fala.
 * Ficam no localStorage, como o tema: valem antes mesmo de a pessoa entrar na conta.
 */
const STORAGE_KEY = 'acessario:a11y';
const DEFAULTS = { vision: 'none', visionResult: null, voice: false, rate: 1, voiceHintGiven: false };
const AccessibilityContext = createContext(null);
const root = document.documentElement;

function readSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(window.localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return DEFAULTS;
  }
}

function applyVision(mode) {
  let style = document.getElementById('acessario-vision');
  if (!style) {
    style = document.createElement('style');
    style.id = 'acessario-vision';
    document.head.appendChild(style);
  }
  style.textContent = paletteCss(mode);
  if (mode && mode !== 'none') root.setAttribute('data-vision', mode);
  else root.removeAttribute('data-vision');
}

// aplica antes da primeira renderização, como o tema
const initial = readSettings();
applyVision(initial.vision);
speech.setRate(initial.rate);

export function AccessibilityProvider({ children }) {
  const { resolvedTheme } = useTheme();
  const [settings, setSettings] = useState(initial);
  const [colorTestOpen, setColorTestOpen] = useState(false);
  const screenText = useRef('');
  const screenSpokenAt = useRef(0);

  const update = useCallback((changes) => {
    setSettings((current) => {
      const next = { ...current, ...changes };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // sem armazenamento: vale só nesta visita
      }
      return next;
    });
  }, []);

  useEffect(() => applyVision(settings.vision), [settings.vision]);
  useEffect(() => speech.setRate(settings.rate), [settings.rate]);

  const voice = settings.voice && speech.supported;

  /** Fala só com o guia por voz ligado. */
  const speak = useCallback((text, options) => voice && speech.speak(text, options), [voice]);
  /** Fala mesmo com o guia desligado (botões "Ouvir"). */
  const speakAlways = useCallback((text, options) => speech.speak(text, options), []);
  const stop = useCallback(() => speech.stop(), []);

  const setVoice = useCallback(
    (on) => {
      update({ voice: on });
      if (on) {
        speech.speak(
          'Guia por voz ligado. Vou ler cada tela e o item em que você estiver. Use Tab para avançar, Shift mais Tab para voltar e Enter para escolher. ' +
            'Alt mais L lê a tela de novo, e Alt mais V liga ou desliga a voz.',
        );
      } else {
        speech.speak('Guia por voz desligado.');
      }
    },
    [update],
  );

  /** Cada tela informa o próprio resumo; com a voz ligada, ele é lido quando muda. */
  const announceScreen = useCallback(
    (text) => {
      if (!text || text === screenText.current) return;
      screenText.current = text;
      if (voice) {
        screenSpokenAt.current = Date.now();
        speech.speak(text);
      }
    },
    [voice],
  );
  const readScreen = useCallback(() => speech.speak(screenText.current || 'Nada para ler nesta tela.'), []);

  // lê o item em foco (com a voz ligada), depois do resumo da tela
  useEffect(() => {
    if (!voice) return undefined;
    let timer;
    let lastKey = 0;
    const onKeyDown = () => {
      lastKey = Date.now();
    };
    const onFocus = (event) => {
      const byKeyboard = Date.now() - lastKey < 500;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const text = describeElement(event.target);
        // foco movido pela tela (não pelo Tab) logo depois do resumo entra na fila, sem cortar o resumo
        const recentSummary = Date.now() - screenSpokenAt.current < 4000;
        if (text) speech.speak(text, { interrupt: byKeyboard || !recentSummary });
      }, 120);
    };
    document.addEventListener('focusin', onFocus);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [voice]);

  // dica falada uma única vez no aparelho, no primeiro Tab, para quem navega pelo teclado sem enxergar a tela
  useEffect(() => {
    if (settings.voice || settings.voiceHintGiven || !speech.supported) return undefined;
    const onKey = (event) => {
      if (event.key !== 'Tab') return;
      update({ voiceHintGiven: true });
      speech.speak('AcessaRio. Para ouvir o app em voz alta, aperte Alt mais V.');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settings.voice, settings.voiceHintGiven, update]);

  // atalhos: Alt+V liga/desliga a voz, Alt+L lê a tela de novo, Esc interrompe a fala
  useEffect(() => {
    const onKey = (event) => {
      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        const key = event.key.toLowerCase();
        if (key === 'v' || event.code === 'KeyV') {
          event.preventDefault();
          setVoice(!settings.voice);
        } else if (key === 'l' || event.code === 'KeyL') {
          event.preventDefault();
          readScreen();
        }
      } else if (event.key === 'Escape' && voice) {
        speech.stop();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settings.voice, voice, setVoice, readScreen]);

  const saveVisionResult = useCallback(
    (result) => update({ vision: result.mode, visionResult: { ...result, testedAt: new Date().toISOString() } }),
    [update],
  );

  const value = useMemo(
    () => ({
      vision: settings.vision,
      visionResult: settings.visionResult,
      setVision: (mode) => update({ vision: mode }),
      saveVisionResult,
      colorTestOpen,
      openColorTest: () => setColorTestOpen(true),
      closeColorTest: () => setColorTestOpen(false),
      levelColors: levelColors(settings.vision, resolvedTheme),
      voiceSupported: speech.supported,
      voice,
      setVoice,
      rate: settings.rate,
      setRate: (rate) => update({ rate }),
      speak,
      speakAlways,
      stop,
      announceScreen,
      readScreen,
    }),
    [settings, resolvedTheme, update, saveVisionResult, colorTestOpen, voice, setVoice, speak, speakAlways, stop, announceScreen, readScreen],
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility precisa estar dentro de <AccessibilityProvider>');
  return context;
}

/** A tela diz o que deve ser lido ao chegar nela (ou quando o conteúdo principal muda). */
export function useScreenAnnouncement(text) {
  const { announceScreen } = useAccessibility();
  useEffect(() => {
    // pequena espera: deixa a tela terminar de carregar antes de falar
    const timer = setTimeout(() => announceScreen(text), 250);
    return () => clearTimeout(timer);
  }, [text, announceScreen]);
}
