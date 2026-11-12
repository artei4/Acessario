import { useEffect, useRef, useState } from 'react';
import { Page } from '../components/layout/Page.jsx';
import { TopBar } from '../components/layout/TopBar.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, Notice } from '../components/ui/Card.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { ColorPlate } from '../components/vision/ColorPlate.jsx';
import { PaletteSample, VisionModePicker } from '../components/vision/VisionModePicker.jsx';
import { VISION_MODES } from '../domain/colorVision.js';
import { useAccessibility, useScreenAnnouncement } from '../context/AccessibilityContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useColorTest } from '../hooks/useColorTest.js';

function Intro({ onStart, onManual, onClose }) {
  useScreenAnnouncement('Teste de cores. Vou mostrar 10 círculos de bolinhas coloridas, cada um com um número escondido pela cor. Escolha o número que você vê.');
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Teste de cores</h1>
        <p className="m-0 text-ink-soft">
          Em cerca de 1 minuto, o teste descobre quais cores você distingue melhor. Pelo resultado, o app troca as cores do mapa e das notas.
        </p>
      </div>
      <Card variant="soft" className="flex flex-col gap-2">
        <p className="m-0 text-[13px] font-bold">Como funciona</p>
        <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-[13px]">
          <li>São 10 círculos de bolinhas. Em cada um há um número desenhado só pela cor.</li>
          <li>Escolha o número que você vê. Se não vir nenhum, toque em “Não vejo número”. Não tente adivinhar.</li>
          <li>Deixe o brilho da tela alto e desligue o filtro de luz azul ou o modo noturno, se estiverem ligados.</li>
        </ul>
      </Card>
      <Notice>O teste é uma triagem, não um diagnóstico. Para um diagnóstico, procure um oftalmologista.</Notice>
      <div className="mt-auto flex flex-col gap-2">
        <Button size="lg" block onClick={onStart}>
          Começar o teste
        </Button>
        <Button variant="secondary" block onClick={onManual}>
          Já sei meu tipo: escolher as cores
        </Button>
        <Button variant="ghost" block onClick={onClose}>
          Agora não
        </Button>
      </div>
    </>
  );
}

function PlateStep({ test }) {
  const { plate, index, total, answer, back } = test;
  const firstOption = useRef(null);

  useEffect(() => {
    firstOption.current?.focus({ preventScroll: true });
  }, [plate?.id]);

  // teclado: números respondem direto; N = não vejo
  useEffect(() => {
    const onKey = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (/^[0-9]$/.test(event.key)) answer(Number(event.key));
      else if (event.key.toLowerCase() === 'n') answer(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer]);

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[13px] text-ink-soft">
          <span>
            Círculo {index + 1} de {total}
          </span>
          {index > 0 && (
            <button type="button" className="cursor-pointer font-semibold text-brand" onClick={back}>
              Voltar um
            </button>
          )}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-track" aria-hidden="true">
          <span className="block h-full rounded-full bg-brand transition-[width]" style={{ width: `${(index / total) * 100}%` }} />
        </div>
      </div>
      <h1 className="text-xl font-extrabold tracking-tight">Qual número você vê?</h1>
      <ColorPlate key={plate.id} plate={plate} number={index + 1} total={total} className="mx-auto aspect-square w-full max-w-[300px]" />
      <div className="grid grid-cols-4 gap-2" role="group" aria-label="Respostas">
        {plate.options.map((digit, i) => (
          <Button key={digit} ref={i === 0 ? firstOption : undefined} variant="secondary" size="lg" className="text-2xl" onClick={() => answer(digit)}>
            {digit}
          </Button>
        ))}
      </div>
      <Button variant="secondary" block onClick={() => answer(null)}>
        Não vejo número
      </Button>
      <p className="m-0 text-center text-xs text-ink-soft">Também dá para responder com as teclas de 0 a 9, ou N para “não vejo”.</p>
    </>
  );
}

function Result({ result, onApply, onKeep, onRestart }) {
  useScreenAnnouncement(`Resultado do teste. ${result.summary}`);
  if (!result.valid) {
    return (
      <>
        <h1 className="text-2xl font-extrabold tracking-tight">Vamos tentar de novo?</h1>
        <Card variant="warning">
          <p className="m-0 text-[13px]">{result.summary}</p>
        </Card>
        <div className="mt-auto flex flex-col gap-2">
          <Button size="lg" block onClick={onRestart}>
            Refazer o teste
          </Button>
          <Button variant="ghost" block onClick={onKeep}>
            Sair do teste
          </Button>
        </div>
      </>
    );
  }
  const changes = result.mode !== 'none';
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Resultado</h1>
        <p className="m-0 text-ink-soft">{result.summary}</p>
      </div>
      {changes ? (
        <Card className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-bold">Cores padrão</span>
            <PaletteSample mode="none" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-bold">Novas cores: {VISION_MODES[result.mode].short}</span>
            <PaletteSample mode={result.mode} />
          </div>
          <p className="m-0 text-xs text-ink-soft">
            Além das cores, as linhas do mapa ganham padrões: contínua (boa), tracejada (com limitações) e pontilhada (dificuldade alta).
          </p>
        </Card>
      ) : (
        <Card variant="soft">
          <p className="m-0 text-[13px]">As cores padrão continuam. Se quiser, você pode trocar as cores em Perfil → Acessibilidade.</p>
        </Card>
      )}
      <Notice>Isto não é um diagnóstico. Se você notou dificuldade com cores, vale conversar com um oftalmologista.</Notice>
      <div className="mt-auto flex flex-col gap-2">
        {changes ? (
          <>
            <Button size="lg" block icon="check" onClick={onApply}>
              Usar estas cores
            </Button>
            <Button variant="secondary" block onClick={onKeep}>
              Manter as cores padrão
            </Button>
          </>
        ) : (
          <Button size="lg" block onClick={onApply}>
            Concluir
          </Button>
        )}
        <Button variant="ghost" block onClick={onRestart}>
          Refazer o teste
        </Button>
      </div>
    </>
  );
}

/** Teste de cores (daltonismo): abre por cima de qualquer tela, inclusive antes de entrar na conta. */
export function ColorTestPage() {
  const { closeColorTest, saveVisionResult, setVision, vision } = useAccessibility();
  const toast = useToast();
  const test = useColorTest();
  const [step, setStep] = useState('intro');
  const [manualMode, setManualMode] = useState(vision);

  const apply = () => {
    saveVisionResult(test.result);
    closeColorTest();
    toast.show(test.result.mode === 'none' ? 'Teste concluído. As cores padrão continuam.' : `Cores trocadas: ${VISION_MODES[test.result.mode].short}.`);
  };
  const keep = () => {
    closeColorTest();
  };

  return (
    <Page withNav={false}>
      <TopBar title="Acessibilidade" subtitle="Cores do app" onBack={closeColorTest} />
      {step === 'intro' && <Intro onStart={() => setStep('test')} onManual={() => setStep('manual')} onClose={closeColorTest} />}
      {step === 'test' && !test.done && <PlateStep test={test} />}
      {step === 'test' && test.done && (
        <Result
          result={test.result}
          onApply={apply}
          onKeep={keep}
          onRestart={() => {
            test.restart();
            setStep('test');
          }}
        />
      )}
      {step === 'manual' && (
        <>
          <h1 className="text-2xl font-extrabold tracking-tight">Escolher as cores</h1>
          <VisionModePicker value={manualMode} onChange={setManualMode} />
          <div className="mt-auto flex flex-col gap-2">
            <Button
              size="lg"
              block
              icon="check"
              onClick={() => {
                setVision(manualMode);
                closeColorTest();
                toast.show(`Cores: ${VISION_MODES[manualMode].short}.`);
              }}
            >
              Usar estas cores
            </Button>
            <Button variant="ghost" block onClick={() => setStep('intro')}>
              <Icon name="back" size={16} /> Fazer o teste
            </Button>
          </div>
        </>
      )}
    </Page>
  );
}
