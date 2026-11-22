/**
 * [L1] FUP-002 | SM-01 | SADT A2.1–A2.3
 * Frozen PA & Dossier constants (R-24, R-26, R-29, R-33, R-52).
 */
export const PA_CONSTANTS = Object.freeze({
  GENERAL_BASE_REGEN: 4,
  ACCUMULATION_CAP_FACTOR: 1.5,
  REFINEMENT_COST_STEP: 0.5,
  DIRECT_INITIATIVE_PA_COST: 2,
  FATIGUE_PENALTY_THRESHOLD: 80,
  CLASS_COLORS: Object.freeze({
    P0: Object.freeze({ hex: '#ef4444', border: 'rgba(239, 68, 68, 0.72)', label: 'Crise P0' }),
    C1: Object.freeze({ hex: '#eab308', border: 'rgba(234, 179, 8, 0.72)', label: 'C1 Scénario' }),
    C2: Object.freeze({ hex: '#06b6d4', border: 'rgba(6, 182, 212, 0.72)', label: 'C2 Gestion & Build' }),
    C3: Object.freeze({ hex: '#f59e0b', border: 'rgba(245, 158, 11, 0.72)', label: 'C3 Maintenance' }),
    C4: Object.freeze({ hex: '#10b981', border: 'rgba(16, 185, 129, 0.72)', label: 'C4 Biomes & Colons' }),
    C5: Object.freeze({ hex: '#8b5cf6', border: 'rgba(139, 92, 246, 0.72)', label: 'C5 Politique & Cyber' }),
  }),
});
