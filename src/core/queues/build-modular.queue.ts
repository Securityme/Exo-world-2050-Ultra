import { ECONOMY_CONSTANTS } from '../../config/economy.constants.ts';
import type { AnnoModuleGraftIntent } from '../../contracts/economy-cyber.schema.ts';
import type { CityDistrictPacket } from '../../contracts/render-bridge.schema.ts';
import { err, ok, type ExwResult } from '../../contracts/trigger-bus.schema.ts';

/**
 * [L2] FUP-004 | SM-03 | SADT A3.3 (R-36)
 * Pure Anno Modular Extension Queue: enforces strict max 3 modules per district.
 */
export interface ModularBuildOrder {
  readonly intent: AnnoModuleGraftIntent;
  readonly remainingCycles: number;
}

export function enqueueModularBuild(
  districts: readonly CityDistrictPacket[],
  queue: readonly ModularBuildOrder[],
  intent: AnnoModuleGraftIntent,
): ExwResult<ModularBuildOrder[]> {
  const district = districts.find((d) => d.id === intent.districtId);
  if (!district) {
    return err('EXW_ERR_SCHEMA', `District introuvable : ${intent.districtId}`);
  }
  const pendingForDistrict = queue.filter((q) => q.intent.districtId === intent.districtId).length;
  if (district.modulesCount + pendingForDistrict >= ECONOMY_CONSTANTS.MAX_MODULES_PER_BUILDING) {
    return err(
      'EXW_ERR_FINANCE_LIMIT',
      `R-36 : Plafond de ${ECONOMY_CONSTANTS.MAX_MODULES_PER_BUILDING} modules atteint sur ${district.name}.`,
    );
  }
  return ok([...queue, { intent, remainingCycles: 1 }]);
}
