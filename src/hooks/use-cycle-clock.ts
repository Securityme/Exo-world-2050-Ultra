/**
 * [L6] EXW.L6.TURN_CLOCK | v4.0.0-rc.1 | SADT A1.3
 * Strict Turn-Based Mode (M7 Turn Gate):
 * Auto-ticking is disabled in v4.0 — turns advance exclusively via T_END_TURN
 * once active dossiers are resolved.
 */
export function useCycleClock(): void {
  // Intentionally no-op in pure turn-based v4.0 architecture (T_END_TURN gate).
}
