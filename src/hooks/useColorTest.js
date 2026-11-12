import { useCallback, useMemo, useState } from 'react';
import { buildTest, classifyVision } from '../domain/colorVision.js';

/**
 * Andamento do teste de cores: pranchas, respostas e resultado.
 * As pranchas mudam a cada vez (números e ordem sorteados), para não dar para decorar.
 */
export function useColorTest() {
  const [seed, setSeed] = useState(() => Date.now() % 2 ** 31);
  const plates = useMemo(() => buildTest(seed), [seed]);
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);

  const done = index >= plates.length;
  const result = useMemo(() => (done ? classifyVision(plates, answers) : null), [done, plates, answers]);

  /** Registra a resposta da prancha atual: um número, ou null para "não vejo número". */
  const answer = useCallback(
    (value) => {
      const plate = plates[index];
      if (!plate) return;
      setAnswers((current) => ({ ...current, [plate.id]: value }));
      setIndex((i) => i + 1);
    },
    [plates, index],
  );

  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  const restart = useCallback(() => {
    setSeed((s) => (s * 48271 + 1) % 2 ** 31);
    setAnswers({});
    setIndex(0);
  }, []);

  return { plates, plate: plates[index] ?? null, index, total: plates.length, answer, back, restart, done, result };
}
