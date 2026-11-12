/**
 * Voz do app (síntese de fala do próprio navegador: Web Speech API).
 *
 * Não precisa de internet nem de chave, e usa as vozes em português instaladas no aparelho.
 * Os navegadores só deixam falar depois que a pessoa toca ou aperta uma tecla na página;
 * o que for pedido antes disso fica guardado e é falado no primeiro toque.
 *
 * `createSpeech(synth, options)` recebe o motor de voz, o que permite testar sem navegador.
 */
export function createSpeech(synth, { Utterance, hasUserActivation = () => true, onFirstActivation = () => {} } = {}) {
  const supported = Boolean(synth && Utterance);
  let rate = 1;
  let pending = null;
  let voice = null;

  const pickVoice = () => {
    if (!supported) return null;
    const voices = synth.getVoices?.() ?? [];
    return (
      voices.find((v) => v.lang === 'pt-BR' && v.localService) ??
      voices.find((v) => v.lang === 'pt-BR') ??
      voices.find((v) => v.lang?.toLowerCase().startsWith('pt')) ??
      null
    );
  };

  const say = (text, { interrupt = true } = {}) => {
    if (interrupt) synth.cancel();
    voice ??= pickVoice();
    const utterance = new Utterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = rate;
    if (voice) utterance.voice = voice;
    synth.speak(utterance);
  };

  // fala o que ficou guardado assim que a pessoa interagir
  onFirstActivation(() => {
    if (pending) say(pending.text, pending.options);
    pending = null;
  });

  return {
    supported,
    /** Fala o texto. `interrupt: false` espera a fala atual terminar. */
    speak(text, options = {}) {
      if (!supported || !text) return;
      if (!hasUserActivation()) {
        pending = { text: pending && options.interrupt === false ? `${pending.text} ${text}` : text, options };
        return;
      }
      say(text, options);
    },
    stop() {
      pending = null;
      if (supported) synth.cancel();
    },
    setRate(value) {
      rate = Math.min(2, Math.max(0.5, value));
    },
    get rate() {
      return rate;
    },
    /** Há uma voz em português instalada? (sem ela, o navegador usa a voz padrão) */
    hasPortugueseVoice: () => Boolean(pickVoice()),
  };
}

function browserSpeech() {
  if (typeof window === 'undefined') return createSpeech(null);
  const activation = navigator.userActivation;
  return createSpeech(window.speechSynthesis, {
    Utterance: window.SpeechSynthesisUtterance,
    hasUserActivation: () => (activation ? activation.hasBeenActive : true),
    onFirstActivation(callback) {
      const once = () => {
        window.removeEventListener('pointerdown', once, true);
        window.removeEventListener('keydown', once, true);
        // espera o navegador registrar a interação
        setTimeout(callback, 0);
      };
      window.addEventListener('pointerdown', once, true);
      window.addEventListener('keydown', once, true);
    },
  });
}

export const speech = browserSpeech();
