import { useEffect, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  AlertTriangle,
  Box,
  Building2,
  CheckCircle2,
  HeartPulse,
  Maximize2,
  RotateCw,
  Shield,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import { getColonistPortrait } from '../../data/art-manifest.data.ts';
import { handleAssignColonistToDistrict } from '../../pipelines/game-actions.pipeline.ts';
import { useExoStore } from '../../stores/game.store.ts';
import {
  activeSubscreenAtom,
  inspectedColonistIdAtom,
  isolated3DModalAtom,
  questUiMilestonesAtom,
  toastNoticeAtom,
} from '../../stores/selection.atoms.ts';
import {
  computeColonistEffectiveYieldPct,
  doesColonistMatchDistrict,
  formatSpecialtyLabel,
  getDistrictOccupantCount,
  getRecommendedDistrictKinds,
  MAX_COLONISTS_PER_DISTRICT,
} from '../../systems/economy-urban/workforce-assignments.ts';
import { formatDistrictKind } from '../../utils/ui-labels.ts';

/**
 * [L7] EXW.L7.COLONIST_DETAIL_MODAL | v5.0.0
 * Full Frostpunk RPG Colonist Sheet with clickable portrait zoom lightbox & rotating 3D preview.
 */
export function ColonistDetailModal() {
  const [colonistId, setColonistId] = useAtom(inspectedColonistIdAtom);
  const world = useExoStore((s) => s.world);
  const setIsolated3D = useSetAtom(isolated3DModalAtom);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
  const setToast = useSetAtom(toastNoticeAtom);
  const setQuestUi = useSetAtom(questUiMilestonesAtom);
  const [portraitZoomOpen, setPortraitZoomOpen] = useState(false);
  const [viewer3dAngle, setViewer3dAngle] = useState(18);

  const colonist = colonistId
    ? world.colonists.find((c) => c.id === colonistId) ?? null
    : null;

  useEffect(() => {
    if (colonist) {
      setQuestUi((prev) => (prev.colonistSheetOpened ? prev : { ...prev, colonistSheetOpened: true }));
    }
  }, [colonist, setQuestUi]);

  if (!colonist) return null;

  const portraitUrl = getColonistPortrait(colonist.id, colonist.specialty);
  const currentDistrict = world.districts.find((d) => d.id === colonist.assignedDistrictId) ?? null;
  const hasSynergy = currentDistrict
    ? doesColonistMatchDistrict(colonist.specialty, currentDistrict.kind)
    : false;
  const yieldPct = computeColonistEffectiveYieldPct(colonist, currentDistrict);
  const recommendedKinds = getRecommendedDistrictKinds(colonist.specialty);
  const health = colonist.health ?? 88;
  const happiness = colonist.happiness ?? colonist.morale;
  const burnout = colonist.fatigue >= 80;
  const xp = colonist.xp ?? 45;
  const xpPct = Math.min(100, xp % 100);

  const stats: readonly { label: string; val: number; color: string }[] = [
    { label: 'Santé', val: health, color: 'bg-emerald-500' },
    { label: 'Bonheur', val: happiness, color: 'bg-amber-400' },
    { label: 'Moral', val: colonist.morale, color: 'bg-rose-400' },
    { label: 'Fatigue', val: colonist.fatigue, color: burnout ? 'bg-rose-600' : 'bg-orange-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        data-testid="colonist-detail-modal"
        aria-label={`Fiche Colon ${colonist.name}`}
        className="exo-bento-card exo-astral-ticks flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b exo-accent-border px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              data-testid="colonist-portrait-zoom-btn"
              onClick={() => setPortraitZoomOpen(true)}
              title="Cliquer pour agrandir le portrait et inspecter le modèle 3D"
              className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border exo-accent-border shadow-sm"
            >
              <img
                src={portraitUrl}
                alt={colonist.name}
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
              <span className="absolute right-1 bottom-1 rounded bg-black/65 p-0.5 text-white">
                <Maximize2 className="h-3 w-3" />
              </span>
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded border exo-accent-border bg-[var(--exo-accent-soft)] px-1.5 py-0.5 font-mono text-[10px] font-bold exo-accent-text">
                  Niv. {colonist.level ?? 1} · {formatSpecialtyLabel(colonist.specialty)}
                </span>
                {burnout && (
                  <span className="inline-flex items-center gap-1 rounded bg-rose-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                    <AlertTriangle className="h-3 w-3" /> SURMENAGE
                  </span>
                )}
              </div>
              <h2 className="mt-0.5 truncate font-display text-lg font-bold text-[var(--exo-text)]">
                {colonist.name}
              </h2>
              <p className="font-mono text-[11px] exo-muted-text">Trait : {colonist.trait}</p>
            </div>
          </div>
          <button
            type="button"
            data-testid="close-colonist-modal-btn"
            onClick={() => setColonistId(null)}
            aria-label="Fermer la fiche colon"
            className="exo-accent-chip inline-flex h-10 w-10 shrink-0 items-center justify-center"
          >
            <X className="h-5 w-5 exo-accent-text" />
          </button>
        </div>

        {portraitZoomOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
            onClick={() => setPortraitZoomOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="exo-bento-card w-full max-w-lg space-y-3 p-4 text-xs"
            >
              <div className="flex items-center justify-between border-b exo-accent-border pb-2">
                <span className="font-display text-sm font-bold exo-accent-text">
                  Zoom Portrait &amp; Silhouette 3D — {colonist.name}
                </span>
                <button
                  type="button"
                  onClick={() => setPortraitZoomOpen(false)}
                  className="exo-accent-chip inline-flex h-8 w-8 items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <img
                  src={portraitUrl}
                  alt={colonist.name}
                  className="h-56 w-full rounded-xl border exo-accent-border object-cover"
                />
                <div className="exo-surface-sub flex flex-col items-center justify-between rounded-xl border exo-accent-border p-3">
                  <div className="font-mono text-[10px] uppercase exo-accent-text">
                    Vue 3D Exosuit ({viewer3dAngle}°)
                  </div>
                  <svg
                    viewBox="0 0 120 150"
                    className="h-36 w-28 transition-transform duration-300"
                    style={{ transform: `perspective(320px) rotateY(${viewer3dAngle}deg)` }}
                  >
                    <defs>
                      <linearGradient id="exoSuitGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="var(--exo-accent, #e11d74)" />
                        <stop offset="100%" stopColor="#14b8a6" />
                      </linearGradient>
                    </defs>
                    <ellipse cx="60" cy="140" rx="34" ry="7" fill="currentColor" opacity="0.18" />
                    <circle cx="60" cy="28" r="14" fill="url(#exoSuitGrad)" />
                    <rect x="52" y="23" width="16" height="7" rx="3" fill="#ffffff" opacity="0.85" />
                    <rect x="42" y="46" width="36" height="44" rx="10" fill="url(#exoSuitGrad)" />
                    <rect x="28" y="50" width="11" height="36" rx="5" fill="url(#exoSuitGrad)" opacity="0.85" />
                    <rect x="81" y="50" width="11" height="36" rx="5" fill="url(#exoSuitGrad)" opacity="0.85" />
                    <rect x="44" y="92" width="13" height="42" rx="5" fill="url(#exoSuitGrad)" opacity="0.9" />
                    <rect x="63" y="92" width="13" height="42" rx="5" fill="url(#exoSuitGrad)" opacity="0.9" />
                  </svg>
                  <button
                    type="button"
                    onClick={() => setViewer3dAngle((a) => (a + 45) % 360)}
                    className="exo-accent-chip inline-flex items-center gap-1 px-2.5 py-1 font-mono text-[10px] font-bold"
                  >
                    <RotateCw className="h-3 w-3 exo-accent-text" />
                    Pivoter +45°
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <div className="exo-surface-sub space-y-2 rounded-xl p-3 text-xs">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="flex items-center gap-1 font-semibold exo-accent-text">
                <Sparkles className="h-3.5 w-3.5" /> Expérience de terrain ({xp} XP)
              </span>
              <span className="exo-muted-text">
                Quartiers conseillés : {recommendedKinds.map(formatDistrictKind).join(' · ')}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/20 dark:bg-white/10">
              <div className="h-full bg-[var(--exo-accent)]" style={{ width: `${xpPct}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {stats.map((st) => (
              <div key={st.label} className="exo-surface-sub rounded-xl p-2.5 text-xs">
                <div className="flex items-center justify-between font-mono text-[10.5px]">
                  <span className="exo-muted-text">{st.label}</span>
                  <strong className="text-[var(--exo-text)]">{Math.round(st.val)}%</strong>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/20 dark:bg-white/10">
                  <div className={`h-full ${st.color}`} style={{ width: `${Math.min(100, Math.max(0, st.val))}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              { icon: Shield, label: 'Tenue Protect.', tier: colonist.gear?.outfitTier ?? 1 },
              { icon: Wrench, label: 'Outillage', tier: colonist.gear?.toolTier ?? 1 },
              { icon: HeartPulse, label: 'Défense Perso.', tier: colonist.gear?.weaponTier ?? 1 },
            ].map((g) => {
              const Icon = g.icon;
              return (
                <div key={g.label} className="exo-surface-sub flex items-center gap-2 rounded-xl p-2.5">
                  <Icon className="h-4 w-4 shrink-0 exo-accent-2-text" />
                  <div className="min-w-0">
                    <div className="truncate text-[10px] exo-muted-text">{g.label}</div>
                    <div className="font-mono text-xs font-bold text-[var(--exo-text)]">Équip. T{g.tier}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="exo-surface-sub space-y-2.5 rounded-xl p-3.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-display text-sm font-bold text-[var(--exo-text)]">
                <Building2 className="h-4 w-4 exo-accent-text" /> Affectation active
              </span>
              {currentDistrict ? (
                <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10.5px] font-bold ${
                  hasSynergy ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                }`}>
                  <CheckCircle2 className="h-3 w-3" />
                  {hasSynergy ? `Synergie +${yieldPct}%` : `Rendement +${yieldPct}%`}
                </span>
              ) : (
                <span className="font-mono text-[11px] exo-muted-text">En réserve</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label={`Affecter ${colonist.name} à un quartier`}
                data-testid="colonist-district-select"
                value={colonist.assignedDistrictId ?? ''}
                onChange={(e) => {
                  const nextId = e.target.value || null;
                  handleAssignColonistToDistrict(colonist.id, nextId);
                  setToast({
                    id: Date.now(),
                    tone: 'success',
                    text: nextId ? `${colonist.name} réaffecté(e) avec succès.` : `${colonist.name} mis(e) au repos.`,
                  });
                }}
                className="min-h-[40px] flex-1 rounded-xl border exo-accent-border bg-[var(--exo-surface)] px-3 font-mono text-xs font-semibold text-[var(--exo-text)] focus:outline-none"
              >
                <option value="">— Repos / Non affecté —</option>
                {world.districts.map((d) => {
                  const occ = getDistrictOccupantCount(world, d.id);
                  const isCurrent = d.id === colonist.assignedDistrictId;
                  const full = !isCurrent && occ >= MAX_COLONISTS_PER_DISTRICT;
                  const syn = doesColonistMatchDistrict(colonist.specialty, d.kind);
                  return (
                    <option key={d.id} value={d.id} disabled={full}>
                      {d.name} ({formatDistrictKind(d.kind)} · {occ}/{MAX_COLONISTS_PER_DISTRICT}){syn ? ' ★ Synergie' : ''}
                    </option>
                  );
                })}
              </select>

              {currentDistrict && (
                <button
                  type="button"
                  onClick={() => {
                    setColonistId(null);
                    setSubscreen('NONE');
                    setIsolated3D({ mode: 'BUILDING', districtId: currentDistrict.id });
                  }}
                  className="exo-accent-btn inline-flex min-h-[40px] items-center gap-1.5 px-3 text-xs font-bold"
                >
                  <Box className="h-3.5 w-3.5" />
                  <span>Voir B3D</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
