import { useCallback, useEffect, useRef, useState } from 'react';

const Recognition = typeof window !== 'undefined' ? (window.SpeechRecognition ?? window.webkitSpeechRecognition) : undefined;

/**
 * Ditado por voz (Web Speech API): a pessoa fala e o texto volta em `onText`.
 * Disponível no Chrome, Edge e Safari; em outros navegadores `supported` é false e o botão some.
 */
export function useSpeechRecognition({ onText, lang = 'pt-BR' } = {}) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const recognition = useRef(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => () => recognition.current?.abort(), []);

  const start = useCallback(() => {
    if (!Recognition) return;
    recognition.current?.abort();
    const rec = new Recognition();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript?.trim();
      if (text) onTextRef.current?.(text);
    };
    rec.onerror = (event) => {
      setError(
        event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'O navegador não deu acesso ao microfone.'
          : event.error === 'no-speech'
            ? 'Não ouvi nada. Tente de novo.'
            : 'Não foi possível usar o microfone.',
      );
    };
    rec.onend = () => setListening(false);
    recognition.current = rec;
    setError(null);
    setListening(true);
    rec.start();
  }, [lang]);

  const stop = useCallback(() => recognition.current?.stop(), []);

  return { supported: Boolean(Recognition), listening, error, start, stop };
}
