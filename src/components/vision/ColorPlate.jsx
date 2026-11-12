import { useMemo } from 'react';
import { paintPlate, plateColors, plateLayout } from '../../domain/colorVision.js';

/**
 * Uma prancha do teste de cores: círculo de bolinhas com um número escondido pela cor.
 * O fundo é sempre claro (como papel), também no tema escuro, para as cores não mudarem.
 */
export function ColorPlate({ plate, number, total, className }) {
  const dots = useMemo(
    () => paintPlate(plateLayout(plate.digit, plate.seed), plateColors(plate.type, plate.strength), plate.seed),
    [plate],
  );
  return (
    <svg
      viewBox="-1.04 -1.04 2.08 2.08"
      className={className}
      role="img"
      aria-label={`Prancha ${number} de ${total}: um círculo de bolinhas coloridas. Escolha abaixo o número que você vê.`}
    >
      <circle r="1.03" fill="#efebe3" />
      {dots.map((dot, i) => (
        <circle key={i} cx={dot.x} cy={dot.y} r={dot.r} fill={dot.color} />
      ))}
    </svg>
  );
}
