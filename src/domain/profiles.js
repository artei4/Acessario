/**
 * Perfis de mobilidade e o peso que cada característica do caminho tem para eles.
 * Peso 1 = impacto total, 0 = indiferente.
 */
export const PROFILES = {
  cadeirante: {
    id: 'cadeirante',
    label: 'Cadeirante',
    description: 'Evita escadas, calçadas estreitas e inclinações elevadas.',
    icon: 'wheelchair',
    weights: { stairs: 1, slope: 1, width: 1, floor: 1, ramps: 1, tactile: 0 },
    blockedByStairs: true,
  },
  mobilidade_reduzida: {
    id: 'mobilidade_reduzida',
    label: 'Mobilidade reduzida',
    description: 'Prefere caminhos planos, com piso regular e poucos degraus.',
    icon: 'walk',
    weights: { stairs: 0.6, slope: 0.8, width: 0.5, floor: 1, ramps: 0.6, tactile: 0 },
    blockedByStairs: false,
  },
  deficiencia_visual: {
    id: 'deficiencia_visual',
    label: 'Deficiência visual',
    description: 'Valoriza piso tátil, travessias sinalizadas e calçadas livres.',
    icon: 'eye',
    weights: { stairs: 0.2, slope: 0.2, width: 0.4, floor: 0.8, ramps: 0.2, tactile: 1 },
    blockedByStairs: false,
  },
  idoso: {
    id: 'idoso',
    label: 'Idoso',
    description: 'Evita ladeiras e pisos irregulares, prefere pontos de descanso.',
    icon: 'cane',
    weights: { stairs: 0.5, slope: 0.7, width: 0.4, floor: 0.9, ramps: 0.5, tactile: 0 },
    blockedByStairs: false,
  },
};

export const PROFILE_LIST = Object.values(PROFILES);

export function getProfile(id) {
  return PROFILES[id] ?? PROFILES.cadeirante;
}
