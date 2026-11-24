import { useMemo, useState } from 'react';
import {
  Building2,
  Coins,
  Cpu,
  Crosshair,
  Hammer,
  Plus,
  Rocket,
  Shield,
  Sparkles,
  Swords,
  Wrench,
  Zap,
} from 'lucide-react';
import type { UnitClass, UnitLevel } from '../../contracts/combat-units.schema.ts';
import type { FleetShip, ShipModuleSlot } from '../../contracts/v4-systems.schema.ts';
import {
  COLONIST_GEAR_UPGRADE_SPECS,
  SHIP_BLUEPRINTS_CATALOG,
  SHIP_CLASS_LABELS,
  SHIP_MODULE_SLOT_LABELS,
  SHIP_MODULES_CATALOG,
} from '../../data/ship-equipment.catalog.ts';
import { SHARED_TECHS_30 } from '../../data/v4-catalog.data.ts';
import { useExoStore } from '../../stores/game.store.ts';
import type { ActionEventRequest } from '../../systems/dossiers-pa/action-event-generator.ts';
import {
  computeFleetTotals,
  computeShipStats,
  getShipRefitCosts,
} from '../../systems/fleet/ship-loadout.engine.ts';

export type GatewayDomain = 'FLEET' | 'URBAN' | 'DEFENSE' | 'ECONOMY';

interface ActionGatewayDrawerProps {
  readonly onLaunchAction: (request: ActionEventRequest) => void;
  readonly onOpenHangar: () => void;
  readonly activeDomain?: GatewayDomain;
  readonly onDomainChange?: (domain: GatewayDomain) => void;
}

const SLOT_BADGE_TONE: Record<ShipModuleSlot, string> = {
  WEAPON: 'border-rose-300/80 bg-rose-500/12 text-rose-800 dark:border-rose-700/70 dark:text-rose-200',
  DEFENSE: 'border-cyan-300/80 bg-cyan-500/12 text-cyan-800 dark:border-cyan-700/70 dark:text-cyan-200',
  PROPULSION: 'border-amber-300/80 bg-amber-500/12 text-amber-800 dark:border-amber-700/70 dark:text-amber-200',
  UTILITY: 'border-emerald-300/80 bg-emerald-500/12 text-emerald-800 dark:border-emerald-700/70 dark:text-emerald-200',
};

const UNIT_CLASSES: readonly { id: UnitClass; label: string }[] = [
  { id: 'INFANTRY_EXO', label: 'Infanterie Exo' },
  { id: 'ARMOR_MECH', label: 'Blindés Mech' },
  { id: 'DRONE_SWARM', label: 'Essaim Drones' },
  { id: 'ORBITAL_CORVETTE', label: 'Corvette Orbitale' },
  { id: 'CYBER_EW', label: 'Cyber-EW' },
];

/**
 * [L7] EXW.L7.ACTION_GATEWAY_DRAWER | v5.1.0 | SADT A2.1/A3.3
 * Unified R-24 Action Center inside the Événements tab:
 * Concentrates ALL operational actions in one structured workspace (Fleet weapons/modules/refit/build,
 * Urban extensions & Colonist gear, Defense/Drones/Cyber/Combat, Economy/Market/Research).
 */
export function ActionGatewayDrawer({
  onLaunchAction,
  onOpenHangar,
  activeDomain,
  onDomainChange,
}: ActionGatewayDrawerProps) {
  const world = useExoStore((s) => s.world);
  const ships = world.fleetShips ?? [];
  const fleetTotals = useMemo(() => computeFleetTotals(ships), [ships]);

  const [internalDomain, setInternalDomain] = useState<GatewayDomain>('FLEET');
  const domain = activeDomain ?? internalDomain;
  const setDomain = (next: GatewayDomain) => {
    setInternalDomain(next);
    onDomainChange?.(next);
  };
  const [selectedShipId, setSelectedShipId] = useState<string>(ships[0]?.id ?? '');
  const [slotFilter, setSlotFilter] = useState<'ALL' | ShipModuleSlot>('ALL');
  const [buildClass, setBuildClass] = useState<FleetShip['shipClass']>('CORVETTE_ORBITAL');

  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(
    world.districts.find((d) => d.modulesCount < 3)?.id ?? world.districts[0]?.id ?? '',
  );
  const [unitClass, setUnitClass] = useState<UnitClass>('INFANTRY_EXO');
  const [unitLevel, setUnitLevel] = useState<UnitLevel>(1);
  const [targetSector, setTargetSector] = useState<number>(world.rivalTiles[0] ?? 24);
  const [tradeResource, setTradeResource] = useState<'materials' | 'water' | 'food' | 'electronics'>('materials');
  const [tradeAction, setTradeAction] = useState<'BUY' | 'SELL'>('BUY');

  const activeShip = useMemo(
    () => ships.find((s) => s.id === selectedShipId) ?? ships[0] ?? null,
    [ships, selectedShipId],
  );
  const activeShipStats = useMemo(
    () => (activeShip ? computeShipStats(activeShip) : null),
    [activeShip],
  );
  const filteredModules = useMemo(
    () =>
      SHIP_MODULES_CATALOG.filter((m) => slotFilter === 'ALL' || m.slot === slotFilter),
    [slotFilter],
  );

  const availableTechs = useMemo(
    () =>
      SHARED_TECHS_30.filter(
        (t) => t.era <= world.era && !(world.hk?.unlockedTechIds ?? []).includes(t.id),
      ).slice(0, 6),
    [world.era, world.hk?.unlockedTechIds],
  );

  const domainTabs: readonly { id: GatewayDomain; label: string; icon: typeof Rocket }[] = [
    { id: 'FLEET', label: `Flotte & Armement (${ships.length})`, icon: Rocket },
    { id: 'URBAN', label: 'Urbanisme & Colons', icon: Building2 },
    { id: 'DEFENSE', label: 'Militaire & Cyber', icon: Shield },
    { id: 'ECONOMY', label: 'Diplomatie, Marché & Techs', icon: Coins },
  ];

  return (
    <div
      data-testid="action-gateway-drawer"
      className="mt-3 space-y-3 border-t border-rose-200/75 pt-3 dark:border-rose-900/55"
    >
      {/* Header & Domain Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] text-rose-950/75 dark:text-rose-200/80">
          <strong>Passerelle Événements (R-24) :</strong> toute action génère un dossier à 4 choix (option 0 PA garantie + 3 modalités).
        </div>
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px]">
          <span className="rounded-md border border-rose-200/80 bg-rose-50/70 px-2 py-0.5 font-bold text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
            {world.resources.credits} Cr · {world.resources.materials} Mat. · {world.resources.electronics} Élec.
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {domainTabs.map((t) => {
          const Icon = t.icon;
          const active = domain === t.id;
          return (
            <button
              key={t.id}
              type="button"
              data-testid={`gateway-domain-${t.id.toLowerCase()}`}
              onClick={() => setDomain(t.id)}
              className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition ${
                active
                  ? 'border-rose-500 bg-rose-600 text-white shadow-xs'
                  : 'border-rose-200 bg-white/90 text-rose-950 hover:border-rose-400 dark:border-rose-800 dark:bg-rose-950/35 dark:text-rose-100'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* DOMAIN 1: FLEET WEAPONS, MODULES, REFIT & COMMISSIONING */}
      {domain === 'FLEET' && (
        <div className="space-y-3">
          {/* Fleet Aggregate Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200/80 bg-rose-50/50 px-3 py-2 font-mono text-[11px] dark:border-rose-900/50 dark:bg-rose-950/25">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                Puiss. Flotte : <strong className="text-rose-700 dark:text-rose-300">{fleetTotals.totalFirepower}</strong>
              </span>
              <span>
                Défense : <strong className="text-cyan-700 dark:text-cyan-300">{fleetTotals.totalDefense}</strong>
              </span>
              <span>
                Rendement Util. : <strong className="text-emerald-700 dark:text-emerald-300">+{fleetTotals.totalUtilityYield}</strong>
              </span>
              <span>
                Modules montés : <strong>{fleetTotals.totalModulesFitted}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenHangar}
              className="inline-flex min-h-[30px] items-center gap-1 rounded-lg border border-rose-300 bg-white px-2.5 font-mono text-[10.5px] font-bold text-rose-800 hover:border-rose-500 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-100"
            >
              <Rocket className="h-3 w-3" />
              Inspecter en 3D
            </button>
          </div>

          {/* Vessel Selector Grid */}
          <div className="grid gap-2 sm:grid-cols-3">
            {ships.map((ship) => {
              const st = computeShipStats(ship);
              const selected = activeShip?.id === ship.id;
              return (
                <button
                  key={ship.id}
                  type="button"
                  data-testid={`gateway-ship-${ship.id}`}
                  onClick={() => setSelectedShipId(ship.id)}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    selected
                      ? 'border-rose-500 bg-rose-500/12 ring-1 ring-rose-500 dark:border-rose-400 dark:bg-rose-500/20'
                      : 'border-rose-200/85 bg-white/90 hover:border-rose-400 dark:border-rose-900/60 dark:bg-[#160b1b]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 font-mono text-[10px]">
                    <span className="font-bold text-rose-700 dark:text-rose-300">
                      {SHIP_CLASS_LABELS[ship.shipClass]} · Niv.{ship.level}
                    </span>
                    <span className={ship.integrity < 75 ? 'font-bold text-amber-600' : 'text-emerald-600 dark:text-emerald-300'}>
                      {ship.integrity}%
                    </span>
                  </div>
                  <div className="mt-0.5 truncate font-display text-xs font-bold text-[#1f1224] dark:text-rose-50">
                    {ship.name}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1 font-mono text-[10px] text-rose-950/75 dark:text-rose-200/75">
                    <span>Puiss {st.firepower}</span>
                    <span>· Déf {st.defense}</span>
                    <span>· Baies {st.slotsUsed}/{st.maxSlots}</span>
                  </div>
                  {(ship.loadout ?? []).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(ship.loadout ?? []).map((m) => (
                        <span
                          key={m.id}
                          className={`rounded border px-1.5 py-0.5 font-mono text-[9.5px] font-semibold ${SLOT_BADGE_TONE[m.slot]}`}
                        >
                          {m.name}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Ship Actions & Module Bay */}
          {activeShip && activeShipStats && (
            <div className="space-y-2.5 rounded-xl border border-rose-200/90 bg-white/90 p-3 dark:border-rose-900/60 dark:bg-[#160b1b]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-display text-xs font-bold text-[#1f1224] dark:text-rose-50">
                    Armurerie &amp; Baies — {activeShip.name} ({activeShipStats.slotsUsed}/{activeShipStats.maxSlots} baies)
                  </div>
                  <div className="font-mono text-[10.5px] text-rose-900/70 dark:text-rose-200/70">
                    Puiss. {activeShipStats.firepower} · Déf. {activeShipStats.defense} · Vit. {activeShipStats.speed} · Util. {activeShipStats.utilityYield}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeShip.integrity < 100 && (
                    <button
                      type="button"
                      data-testid="gateway-ship-repair-btn"
                      onClick={() =>
                        onLaunchAction({ kind: 'REFIT_SHIP', shipId: activeShip.id, mode: 'REPAIR' })
                      }
                      className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50/80 px-2.5 font-mono text-[10.5px] font-bold text-emerald-900 hover:border-emerald-500 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                    >
                      <Wrench className="h-3 w-3" />
                      Réparer ({getShipRefitCosts(activeShip, 'REPAIR').credits} Cr)
                    </button>
                  )}
                  <button
                    type="button"
                    data-testid="gateway-ship-upgrade-btn"
                    disabled={activeShip.level >= 5}
                    onClick={() =>
                      onLaunchAction({ kind: 'REFIT_SHIP', shipId: activeShip.id, mode: 'UPGRADE_LEVEL' })
                    }
                    className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-amber-300 bg-amber-50/80 px-2.5 font-mono text-[10.5px] font-bold text-amber-950 hover:border-amber-500 disabled:opacity-45 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                  >
                    <Zap className="h-3 w-3" />
                    {activeShip.level >= 5
                      ? 'Niv. Max'
                      : `Moderniser Niv.${activeShip.level + 1} (${getShipRefitCosts(activeShip, 'UPGRADE_LEVEL').credits} Cr)`}
                  </button>
                </div>
              </div>

              {/* Slot Filter Chips */}
              <div className="flex flex-wrap gap-1">
                {(['ALL', 'WEAPON', 'DEFENSE', 'PROPULSION', 'UTILITY'] as const).map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSlotFilter(slot)}
                    className={`rounded-md border px-2 py-1 font-mono text-[10px] font-bold transition ${
                      slotFilter === slot
                        ? 'border-rose-500 bg-rose-500/15 text-rose-800 dark:border-rose-400 dark:text-rose-100'
                        : 'border-rose-200/80 bg-rose-50/40 text-rose-900/75 hover:border-rose-400 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200'
                    }`}
                  >
                    {slot === 'ALL' ? 'Tous les modules (12)' : SHIP_MODULE_SLOT_LABELS[slot]}
                  </button>
                ))}
              </div>

              {/* Mountable Modules Grid */}
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filteredModules.map((mod) => {
                  const alreadyInstalled = (activeShip.loadout ?? []).some((m) => m.id === mod.id);
                  const lockedEra = world.era < mod.minEra;
                  const canAfford =
                    world.resources.credits >= mod.costCredits &&
                    world.resources.materials >= mod.costMaterials &&
                    world.resources.electronics >= mod.costElectronics &&
                    world.resources.compute >= mod.costCompute;
                  const stats = [
                    mod.firepower > 0 ? `+${mod.firepower} Puiss` : null,
                    mod.defense > 0 ? `+${mod.defense} Déf` : null,
                    mod.speed > 0 ? `+${mod.speed} Vit` : null,
                    mod.utilityYield > 0 ? `+${mod.utilityYield} Util` : null,
                  ].filter(Boolean);

                  return (
                    <div
                      key={mod.id}
                      className="flex flex-col justify-between rounded-xl border border-rose-200/80 bg-rose-50/35 p-2.5 text-[11px] dark:border-rose-900/50 dark:bg-rose-950/20"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 font-mono text-[9.5px]">
                          <span className={`rounded border px-1.5 py-0.5 font-bold ${SLOT_BADGE_TONE[mod.slot]}`}>
                            {SHIP_MODULE_SLOT_LABELS[mod.slot]} · T{mod.tier}
                          </span>
                          <span className="font-bold text-rose-800 dark:text-rose-200">
                            {stats.join(' · ')}
                          </span>
                        </div>
                        <div className="mt-1 font-display text-xs font-bold text-[#1f1224] dark:text-rose-50">
                          {mod.name}
                        </div>
                        <p className="mt-0.5 text-[10.5px] leading-snug text-rose-950/75 dark:text-rose-200/75">
                          {mod.summary}
                        </p>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2 border-t border-rose-200/60 pt-1.5 dark:border-rose-900/40">
                        <span className={`font-mono text-[10px] ${canAfford ? 'text-rose-900/75 dark:text-rose-200/75' : 'text-rose-600 dark:text-rose-400'}`}>
                          {mod.costCredits} Cr · {mod.costMaterials} Mat · {mod.costElectronics} Él.
                        </span>
                        <button
                          type="button"
                          data-testid={`equip-mod-${mod.id}`}
                          disabled={alreadyInstalled || lockedEra}
                          onClick={() =>
                            onLaunchAction({
                              kind: 'EQUIP_SHIP_MODULE',
                              shipId: activeShip.id,
                              moduleId: mod.id,
                            })
                          }
                          className="inline-flex min-h-[28px] shrink-0 items-center gap-1 rounded-lg bg-rose-600 px-2.5 font-mono text-[10px] font-bold text-white hover:bg-rose-500 disabled:bg-rose-300 dark:disabled:bg-rose-950 dark:disabled:text-rose-400"
                        >
                          {alreadyInstalled
                            ? 'Monté'
                            : lockedEra
                              ? `Ère ${mod.minEra}`
                              : 'Installer'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Commission New Vessel Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200/85 bg-white/85 px-3 py-2.5 text-xs dark:border-rose-900/60 dark:bg-[#160b1b]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10.5px] font-bold uppercase text-rose-700 dark:text-rose-300">
                Chantier Orbital :
              </span>
              <select
                aria-label="Classe de vaisseau à construire"
                value={buildClass}
                onChange={(e) => setBuildClass(e.target.value as FleetShip['shipClass'])}
                className="min-h-[34px] rounded-lg border border-rose-200 bg-rose-50/60 px-2.5 font-mono text-[11px] font-semibold text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-50"
              >
                {SHIP_BLUEPRINTS_CATALOG.map((bp) => (
                  <option key={bp.shipClass} value={bp.shipClass} disabled={world.era < bp.minEra}>
                    {bp.label} ({bp.baseSlots} baies · {bp.costCredits} Cr · {bp.costMaterials} Mat.)
                    {world.era < bp.minEra ? ` — Ère ${bp.minEra}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              data-testid="gateway-commission-ship-btn"
              onClick={() => onLaunchAction({ kind: 'COMMISSION_SHIP', shipClass: buildClass })}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-rose-600 px-3 font-mono text-[11px] font-bold text-white hover:bg-rose-500"
            >
              <Plus className="h-3.5 w-3.5" />
              Construire Vaisseau (Dossier)
            </button>
          </div>
        </div>
      )}

      {/* DOMAIN 2: URBAN EXTENSIONS & COLONIST GEAR */}
      {domain === 'URBAN' && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2.5 rounded-xl border border-rose-200/85 bg-white/90 p-3 dark:border-rose-900/60 dark:bg-[#160b1b]">
            <div className="flex items-center gap-1.5 font-display text-xs font-bold text-[#1f1224] dark:text-rose-50">
              <Building2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
              Extensions de Quartiers (140 Cr · 30 Mat.)
            </div>
            <select
              aria-label="Choisir un quartier à étendre"
              value={selectedDistrictId}
              onChange={(e) => setSelectedDistrictId(e.target.value)}
              className="min-h-[36px] w-full rounded-lg border border-rose-200 bg-rose-50/50 px-2.5 font-mono text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-50"
            >
              {world.districts.map((d) => (
                <option key={d.id} value={d.id} disabled={d.modulesCount >= 3}>
                  {d.name} (Niv.{d.level} · {d.modulesCount}/3 ext. · État {d.integrity}%)
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedDistrictId}
              onClick={() => onLaunchAction({ kind: 'GRAFT_MODULE', districtId: selectedDistrictId })}
              className="inline-flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 font-mono text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-45"
            >
              <Hammer className="h-3.5 w-3.5" />
              Lancer Dossier d’Extension
            </button>
          </div>

          <div className="space-y-2 rounded-xl border border-rose-200/85 bg-white/90 p-3 dark:border-rose-900/60 dark:bg-[#160b1b]">
            <div className="flex items-center gap-1.5 font-display text-xs font-bold text-[#1f1224] dark:text-rose-50">
              <Sparkles className="h-3.5 w-3.5 text-rose-600 dark:text-rose-300" />
              Équipement &amp; Dotation des Colons (T1 → T3)
            </div>
            <div className="space-y-1.5">
              {(['outfitTier', 'toolTier', 'weaponTier'] as const).map((slot) => {
                const spec = COLONIST_GEAR_UPGRADE_SPECS[slot];
                const curTier = world.colonistGear?.[slot] ?? 1;
                const costCr = spec.costCreditsPerTier * curTier;
                return (
                  <div
                    key={slot}
                    className="flex items-center justify-between gap-2 rounded-lg border border-rose-200/70 bg-rose-50/40 px-2.5 py-1.5 text-[11px] dark:border-rose-900/50 dark:bg-rose-950/25"
                  >
                    <div>
                      <div className="font-semibold text-[#1f1224] dark:text-rose-50">
                        {spec.label} <span className="font-mono text-rose-600 dark:text-rose-300">T{curTier}</span>
                      </div>
                      <div className="text-[10px] text-rose-900/70 dark:text-rose-200/70">{spec.summary}</div>
                    </div>
                    <button
                      type="button"
                      data-testid={`gateway-gear-${slot}`}
                      disabled={curTier >= 3}
                      onClick={() => onLaunchAction({ kind: 'UPGRADE_COLONIST_GEAR', gearSlot: slot })}
                      className="inline-flex min-h-[30px] shrink-0 items-center rounded-lg bg-rose-600 px-2.5 font-mono text-[10px] font-bold text-white hover:bg-rose-500 disabled:opacity-40"
                    >
                      {curTier >= 3 ? 'T3 Max' : `Passer T${curTier + 1} (${costCr} Cr)`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DOMAIN 3: DEFENSE, DRONES, CYBER & ASSAULT */}
      {domain === 'DEFENSE' && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2.5 rounded-xl border border-rose-200/85 bg-white/90 p-3 dark:border-rose-900/60 dark:bg-[#160b1b]">
            <div className="flex items-center gap-1.5 font-display text-xs font-bold text-[#1f1224] dark:text-rose-50">
              <Shield className="h-3.5 w-3.5 text-rose-600 dark:text-rose-300" />
              Recrutement &amp; Drones
            </div>
            <div className="flex flex-wrap gap-1.5">
              <select
                aria-label="Classe d'unité"
                value={unitClass}
                onChange={(e) => setUnitClass(e.target.value as UnitClass)}
                className="min-h-[34px] flex-1 rounded-lg border border-rose-200 bg-rose-50/50 px-2 font-mono text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-50"
              >
                {UNIT_CLASSES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <select
                aria-label="Niveau unité"
                value={unitLevel}
                onChange={(e) => setUnitLevel(Number(e.target.value) as UnitLevel)}
                className="min-h-[34px] rounded-lg border border-rose-200 bg-rose-50/50 px-2 font-mono text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-50"
              >
                {[1, 2, 3, 4, 5].map((lv) => (
                  <option key={lv} value={lv}>Niv.{lv}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onLaunchAction({ kind: 'RECRUIT_UNIT', unitClass, level: unitLevel })}
                className="inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-rose-600 px-3 font-mono text-[11px] font-bold text-white hover:bg-rose-500"
              >
                Recruter +3
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => onLaunchAction({ kind: 'REASSIGN_DRONE', fromRole: 'recon', toRole: 'construction' })}
                className="inline-flex min-h-[32px] flex-1 items-center justify-center gap-1 rounded-lg border border-orange-300/80 bg-orange-50/70 px-2 font-mono text-[10.5px] font-bold text-orange-950 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-100"
              >
                <Wrench className="h-3 w-3" /> Drone Recon → Constr.
              </button>
              <button
                type="button"
                onClick={() => onLaunchAction({ kind: 'REASSIGN_DRONE', fromRole: 'construction', toRole: 'defense' })}
                className="inline-flex min-h-[32px] flex-1 items-center justify-center gap-1 rounded-lg border border-rose-300/80 bg-rose-50/70 px-2 font-mono text-[10.5px] font-bold text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100"
              >
                <Shield className="h-3 w-3" /> Drone Constr. → Défense
              </button>
            </div>
          </div>

          <div className="space-y-2.5 rounded-xl border border-rose-200/85 bg-white/90 p-3 dark:border-rose-900/60 dark:bg-[#160b1b]">
            <div className="flex items-center gap-1.5 font-display text-xs font-bold text-[#1f1224] dark:text-rose-50">
              <Swords className="h-3.5 w-3.5 text-rose-600 dark:text-rose-300" />
              Assaut Secteur &amp; Opération Cyber
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 font-mono text-[11px] text-rose-900/80 dark:text-rose-200/80">
                <span>Secteur #</span>
                <input
                  type="number"
                  min={0}
                  max={71}
                  value={targetSector}
                  onChange={(e) => setTargetSector(Math.max(0, Math.min(71, Number(e.target.value) || 0)))}
                  className="min-h-[34px] w-16 rounded-lg border border-rose-200 bg-rose-50/50 px-2 font-mono text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-50"
                />
              </label>
              <button
                type="button"
                onClick={() => onLaunchAction({ kind: 'LAUNCH_COMBAT', targetTileIndex: targetSector })}
                className="inline-flex min-h-[34px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 font-mono text-[11px] font-bold text-white hover:bg-rose-500"
              >
                <Crosshair className="h-3.5 w-3.5" />
                Ordre de Conquête (+{fleetTotals.totalFirepower} Flotte)
              </button>
            </div>
            {world.rivals[0] && (
              <button
                type="button"
                onClick={() => onLaunchAction({ kind: 'CYBER_PARALYSIS', rivalId: world.rivals[0]!.id })}
                className="inline-flex min-h-[32px] w-full items-center justify-center gap-1.5 rounded-lg border border-cyan-300/80 bg-cyan-50/70 px-3 font-mono text-[11px] font-bold text-cyan-950 hover:border-cyan-500 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-100"
              >
                <Cpu className="h-3.5 w-3.5" />
                Cyber-Paralysie sur {world.rivals[0].name} (Calcul {world.resources.compute}/{world.rivals[0].computeDefense * 2})
              </button>
            )}
          </div>
        </div>
      )}

      {/* DOMAIN 4: ECONOMY, MARKET & RESEARCH */}
      {domain === 'ECONOMY' && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2.5 rounded-xl border border-rose-200/85 bg-white/90 p-3 dark:border-rose-900/60 dark:bg-[#160b1b]">
            <div className="flex items-center gap-1.5 font-display text-xs font-bold text-[#1f1224] dark:text-rose-50">
              <Coins className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" />
              Diplomatie, Banque &amp; Marché
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onLaunchAction({ kind: 'DIPLOMATIC_INITIATIVE', mode: 'ALLIANCE_PACT' })}
                className="inline-flex min-h-[32px] flex-1 items-center justify-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50/80 px-2.5 font-mono text-[10.5px] font-bold text-emerald-950 hover:border-emerald-500 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
              >
                Pacte Alliance (+6%)
              </button>
              <button
                type="button"
                onClick={() =>
                  onLaunchAction({
                    kind: 'DIPLOMATIC_INITIATIVE',
                    mode: 'RIVAL_DETENTE',
                    rivalId: world.rivals[0]?.id,
                  })
                }
                className="inline-flex min-h-[32px] flex-1 items-center justify-center gap-1 rounded-lg border border-cyan-300 bg-cyan-50/80 px-2.5 font-mono text-[10.5px] font-bold text-cyan-950 hover:border-cyan-500 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-100"
              >
                Détente Rivale (+14)
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onLaunchAction({ kind: 'BANK_LOAN', principal: 400 })}
                className="inline-flex min-h-[34px] flex-1 items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-50/80 px-2.5 font-mono text-[11px] font-bold text-amber-950 hover:border-amber-500 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
              >
                Emprunt +400 Cr
              </button>
              <button
                type="button"
                onClick={() => onLaunchAction({ kind: 'BANK_LOAN', principal: 750 })}
                className="inline-flex min-h-[34px] flex-1 items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-50/80 px-2.5 font-mono text-[11px] font-bold text-amber-950 hover:border-amber-500 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
              >
                Emprunt +750 Cr
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <select
                aria-label="Action marché"
                value={tradeAction}
                onChange={(e) => setTradeAction(e.target.value as 'BUY' | 'SELL')}
                className="min-h-[34px] rounded-lg border border-rose-200 bg-rose-50/50 px-2 font-mono text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-50"
              >
                <option value="BUY">Acheter</option>
                <option value="SELL">Vendre</option>
              </select>
              <select
                aria-label="Ressource marché"
                value={tradeResource}
                onChange={(e) =>
                  setTradeResource(e.target.value as 'materials' | 'water' | 'food' | 'electronics')
                }
                className="min-h-[34px] flex-1 rounded-lg border border-rose-200 bg-rose-50/50 px-2 font-mono text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-50"
              >
                <option value="materials">20 Matériaux</option>
                <option value="electronics">20 Électronique</option>
                <option value="water">20 Eau</option>
                <option value="food">20 Vivres</option>
              </select>
              <button
                type="button"
                onClick={() =>
                  onLaunchAction({
                    kind: 'MARKET_TRADE',
                    resource: tradeResource,
                    action: tradeAction,
                    quantity: 20,
                  })
                }
                className="inline-flex min-h-[34px] items-center rounded-lg bg-rose-600 px-3 font-mono text-[11px] font-bold text-white hover:bg-rose-500"
              >
                Exécuter
              </button>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-rose-200/85 bg-white/90 p-3 dark:border-rose-900/60 dark:bg-[#160b1b]">
            <div className="flex items-center gap-1.5 font-display text-xs font-bold text-[#1f1224] dark:text-rose-50">
              <Cpu className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-300" />
              Orientation Recherche Scientifique (Ère {world.era})
            </div>
            <div className="space-y-1.5">
              {availableTechs.map((tech) => {
                const isActive = world.hk?.activeResearchTechId === tech.id;
                return (
                  <div
                    key={tech.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-rose-200/70 bg-rose-50/40 px-2.5 py-1.5 text-[11px] dark:border-rose-900/50 dark:bg-rose-950/25"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[#1f1224] dark:text-rose-50">
                        {tech.name}
                      </div>
                      <div className="text-[10px] text-rose-900/70 dark:text-rose-200/70">
                        {tech.domain} · {tech.effectLabel}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isActive}
                      onClick={() => onLaunchAction({ kind: 'START_RESEARCH', techId: tech.id })}
                      className="inline-flex min-h-[28px] shrink-0 items-center rounded-lg bg-rose-600 px-2.5 font-mono text-[10px] font-bold text-white hover:bg-rose-500 disabled:bg-emerald-600/80"
                    >
                      {isActive ? 'En cours' : 'Lancer'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
