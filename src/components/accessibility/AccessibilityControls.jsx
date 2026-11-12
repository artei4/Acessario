import { Button } from '../ui/Button.jsx';
import { Card, Notice, SectionTitle } from '../ui/Card.jsx';
import { Icon } from '../ui/Icon.jsx';
import { Toggle } from '../ui/Toggle.jsx';
import { PaletteSample } from '../vision/VisionModePicker.jsx';
import { VISION_MODES } from '../../domain/colorVision.js';
import { useAccessibility } from '../../context/AccessibilityContext.jsx';
import { cn } from '../../utils/cn.js';
import { formatShortDate } from '../../utils/format.js';

const RATES = [
  { value: 0.8, label: 'Devagar' },
  { value: 1, label: 'Normal' },
  { value: 1.3, label: 'Rápido' },
];

/**
 * Atalhos de acessibilidade nas telas de entrada: ligar o guia por voz e fazer o teste de cores.
 * Ficam logo no começo da tela, para serem os primeiros itens alcançados pelo Tab.
 */
export function AccessibilityQuickStart({ className }) {
  const { voice, voiceSupported, setVoice, openColorTest, vision } = useAccessibility();
  return (
    <div className={cn('grid grid-cols-2 gap-2', className)} role="group" aria-label="Acessibilidade">
      {voiceSupported && (
        <Button variant={voice ? 'primary' : 'secondary'} size="sm" icon="volume" aria-pressed={voice} onClick={() => setVoice(!voice)}>
          {voice ? 'Voz ligada' : 'Ouvir o app'}
        </Button>
      )}
      <Button variant={vision !== 'none' ? 'primary' : 'secondary'} size="sm" icon="palette" className={voiceSupported ? undefined : 'col-span-2'} onClick={openColorTest}>
        {vision !== 'none' ? `Cores: ${VISION_MODES[vision].short}` : 'Tenho daltonismo'}
      </Button>
    </div>
  );
}

/** Seção "Acessibilidade" do Perfil: guia por voz e cores. */
export function AccessibilitySettings() {
  const { voice, voiceSupported, setVoice, rate, setRate, speakAlways, vision, visionResult, setVision, openColorTest } = useAccessibility();
  return (
    <section className="flex flex-col gap-1.5" aria-labelledby="a11y-title">
      <SectionTitle id="a11y-title">Acessibilidade</SectionTitle>
      <Card className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-[13px] font-bold">
            <Icon name="volume" size={18} /> Guia por voz
          </span>
          {voiceSupported ? (
            <>
              <Toggle
                label="Ler as telas em voz alta"
                description="Lê cada tela, o item em foco e os avisos. Alt+V liga ou desliga; Alt+L lê a tela de novo."
                checked={voice}
                onChange={setVoice}
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-ink-soft" id="rate-label">
                  Velocidade da voz
                </span>
                <div className="grid grid-cols-3 gap-1.5" role="group" aria-labelledby="rate-label">
                  {RATES.map((option) => (
                    <Button
                      key={option.value}
                      variant="secondary"
                      size="sm"
                      selected={rate === option.value}
                      aria-pressed={rate === option.value}
                      onClick={() => {
                        setRate(option.value);
                        speakAlways(`Velocidade ${option.label.toLowerCase()}.`);
                      }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
              <p className="m-0 text-xs text-ink-soft">
                Já usa um leitor de tela (TalkBack, VoiceOver ou NVDA)? Deixe o guia desligado: o app já funciona com ele, e as duas vozes juntas atrapalham.
              </p>
            </>
          ) : (
            <Notice>Este navegador não tem síntese de voz. Experimente o Chrome, o Edge ou o Safari.</Notice>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <span className="flex items-center gap-2 text-[13px] font-bold">
            <Icon name="palette" size={18} /> Cores (daltonismo)
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-[13px]">
              Agora: <strong>{VISION_MODES[vision]?.label ?? VISION_MODES.none.label}</strong>
            </span>
            <PaletteSample mode={vision} />
            {visionResult?.testedAt && <span className="text-xs text-ink-soft">Teste feito em {formatShortDate(visionResult.testedAt)}.</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" icon="eye" onClick={openColorTest}>
              {visionResult ? 'Refazer o teste de cores' : 'Tenho daltonismo: fazer o teste'}
            </Button>
            {vision !== 'none' && (
              <Button size="sm" variant="ghost" onClick={() => setVision('none')}>
                Voltar às cores padrão
              </Button>
            )}
          </div>
        </div>
      </Card>
    </section>
  );
}

/** Controles flutuantes enquanto o guia por voz está ligado: ouvir a tela de novo e parar a fala. */
export function VoiceDock({ withNav = true }) {
  const { voice, readScreen, stop } = useAccessibility();
  if (!voice) return null;
  return (
    <div
      className={cn(
        'fixed right-[max(12px,calc(50%-208px))] z-40 flex gap-1 rounded-full bg-navy p-1 shadow-soft',
        withNav ? 'bottom-[80px]' : 'bottom-3',
      )}
      role="group"
      aria-label="Guia por voz"
    >
      <button
        type="button"
        className="grid size-11 cursor-pointer place-items-center rounded-full text-on-navy hover:bg-white/10"
        onClick={readScreen}
        aria-label="Ouvir esta tela de novo"
        title="Ouvir esta tela (Alt+L)"
      >
        <Icon name="volume" size={20} />
      </button>
      <button
        type="button"
        className="grid size-11 cursor-pointer place-items-center rounded-full text-on-navy hover:bg-white/10"
        onClick={stop}
        aria-label="Parar a fala"
        title="Parar a fala (Esc)"
      >
        <Icon name="stop" size={18} />
      </button>
    </div>
  );
}

/**
 * Botão "Ouvir": lê um texto em voz alta, mesmo com o guia desligado.
 * `label` é o nome completo para leitores de tela (ex.: "Ouvir a Rota 1"); na tela aparece só "Ouvir".
 */
export function SpeakButton({ text, label = 'Ouvir', className, onDark = false }) {
  const { voiceSupported, speakAlways } = useAccessibility();
  if (!voiceSupported) return null;
  return (
    <Button
      variant={onDark ? 'on-navy' : 'ghost'}
      size="sm"
      icon="volume"
      className={cn('px-2.5', className)}
      onClick={() => speakAlways(text)}
      aria-label={label}
    >
      Ouvir
    </Button>
  );
}
