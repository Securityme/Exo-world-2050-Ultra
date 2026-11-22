import { useRef, useState } from 'react';
import { Award, Cloud, Crown, Medal, Pin, Sparkles, Upload, User } from 'lucide-react';
import { FoundationSvgIcon } from '../../components/bento/FoundationSvgIcon.tsx';
import { AVATAR_PRESETS } from '../../data/honors.catalog.ts';
import { useMetaHonorsStore } from '../../stores/meta-honors.store.ts';

/**
 * [L7] EXW.L7.TROPHY_SHOWCASE | v5.0.0 | SADT A5.1
 * Tier 1 Multi-Campaign Player Showcase (Call of Duty / Foundation / Humankind):
 * - Clickable Avatar/Portrait (Preset Gallery + Local Image Upload)
 * - Calling Card / Étendard Joueur + Blason + Career Title + 4 Pinned Badges
 * - Persistent Bronze -> Silver -> Gold -> Platinum Medals across saves
 * - Symbolic Project Conception Global Platinum Trophy (clearly labeled symbolic)
 */
const BANNER_GRADIENT: Record<string, string> = {
  ASTRAL_ROSE: 'from-rose-600/35 via-fuchsia-600/20 to-amber-500/20 border-rose-400/70',
  SOLAR_GOLD: 'from-amber-500/35 via-orange-500/20 to-yellow-400/20 border-amber-400/70',
  EDEN_EMERALD: 'from-emerald-600/35 via-teal-500/20 to-lime-400/20 border-emerald-400/70',
  OBSIDIAN_PLATINUM: 'from-slate-600/35 via-indigo-500/20 to-rose-400/20 border-indigo-400/70',
};

const TIER_BADGE: Record<string, string> = {
  BRONZE: 'border-amber-700/70 bg-amber-900/20 text-amber-700 dark:text-amber-300',
  SILVER: 'border-slate-400/80 bg-slate-500/20 text-slate-700 dark:text-slate-200',
  GOLD: 'border-amber-400 bg-amber-500/20 text-amber-700 dark:text-amber-200',
  PLATINUM: 'border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-200',
};

export function TrophyShowcasePanel({ compact = false }: { readonly compact?: boolean }) {
  const showcase = useMetaHonorsStore((s) => s.showcase);
  const setCallsign = useMetaHonorsStore((s) => s.setCallsign);
  const setAvatarPreset = useMetaHonorsStore((s) => s.setAvatarPreset);
  const setCustomAvatar = useMetaHonorsStore((s) => s.setCustomAvatar);
  const setBannerStyle = useMetaHonorsStore((s) => s.setBannerStyle);
  const setEmblem = useMetaHonorsStore((s) => s.setEmblem);
  const setEquippedTitle = useMetaHonorsStore((s) => s.setEquippedTitle);
  const togglePinnedBadge = useMetaHonorsStore((s) => s.togglePinnedBadge);
  const pushToCloud = useMetaHonorsStore((s) => s.pushToCloud);

  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [cloudMsg, setCloudMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activePreset =
    AVATAR_PRESETS.find((p) => p.id === showcase.avatarPresetId) ?? AVATAR_PRESETS[0]!;
  const activeTitle =
    showcase.titles.find((t) => t.id === showcase.equippedTitleId) ?? showcase.titles[0]!;
  const pinnedBadges = showcase.badges.filter((b) => showcase.pinnedBadgeIds.includes(b.id));

  const onFileSelected = (file: File | undefined) => {
    if (!file || file.size > 120_000) {
      setCloudMsg('Image trop volumineuse (max 120 Ko recommandé).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomAvatar(reader.result);
        setAvatarPickerOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Étendard Joueur (Calling Card) */}
      <div
        data-testid="player-calling-card"
        className={`rounded-2xl border bg-gradient-to-r p-4 shadow-md ${
          BANNER_GRADIENT[showcase.bannerStyleId] ?? BANNER_GRADIENT.ASTRAL_ROSE
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Clickable Avatar / Portrait */}
            <button
              type="button"
              data-testid="showcase-avatar-btn"
              onClick={() => setAvatarPickerOpen((v) => !v)}
              title="Cliquer pour changer votre avatar / portrait"
              className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-white/70 shadow-md transition hover:scale-105"
            >
              {showcase.customAvatarDataUrl ? (
                <img
                  src={showcase.customAvatarDataUrl}
                  alt={showcase.callsign}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center font-display text-lg font-black text-white"
                  style={{
                    background: `linear-gradient(135deg, ${activePreset.gradientFrom}, ${activePreset.gradientTo})`,
                  }}
                >
                  {activePreset.monogram}
                </div>
              )}
              <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center font-mono text-[9px] text-white opacity-0 transition group-hover:opacity-100">
                Modifier
              </span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FoundationSvgIcon kind={showcase.emblemId} className="h-5 w-5 exo-accent-text" />
                <span className="font-display text-base font-bold">{showcase.callsign}</span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                <span className="exo-accent-chip px-2 py-0.5 font-bold">
                  {activeTitle.label}
                </span>
                {activeTitle.isSymbolicDistinction && (
                  <span className="rounded border border-fuchsia-400/70 bg-fuchsia-500/15 px-1.5 py-0.5 text-[9.5px] font-semibold text-fuchsia-600 dark:text-fuchsia-200">
                    Distinction symbolique en jeu
                  </span>
                )}
              </div>
              {/* 4 Pinned Badges */}
              <div className="mt-2 flex flex-wrap gap-1">
                {pinnedBadges.map((b) => (
                  <span
                    key={b.id}
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${
                      TIER_BADGE[b.tier] ?? ''
                    }`}
                  >
                    <Pin className="h-2.5 w-2.5" />
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {!compact && (
            <div className="flex flex-col items-end gap-1.5 font-mono text-[11px]">
              <div className="exo-surface-sub rounded-lg px-2.5 py-1">
                {showcase.campaignsPlayed} campagne(s) · {showcase.totalTurnsSimulated} tours ·{' '}
                {showcase.totalDecisionsSigned} décisions
              </div>
              <button
                type="button"
                onClick={async () => {
                  const ok = await pushToCloud();
                  setCloudMsg(
                    ok
                      ? 'Vitrine synchronisée sur Firestore.'
                      : 'Sauvegardé localement (connectez Google pour sync Cloud).',
                  );
                }}
                className="exo-accent-chip inline-flex min-h-[34px] items-center gap-1.5 px-2.5 text-[11px] font-semibold"
              >
                <Cloud className="h-3.5 w-3.5 exo-accent-text" />
                Synchroniser Vitrine Cloud
              </button>
              {cloudMsg && <span className="text-[10px] exo-muted-text">{cloudMsg}</span>}
            </div>
          )}
        </div>

        {/* Clickable Avatar Gallery & Upload Drawer */}
        {avatarPickerOpen && (
          <div className="mt-3 space-y-2.5 border-t pt-3 exo-accent-border">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 font-semibold">
                <User className="h-3.5 w-3.5 exo-accent-text" />
                Galerie d&apos;Avatars &amp; Portrait Local
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={showcase.callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                  maxLength={40}
                  aria-label="Indicatif de commandant"
                  className="rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2 py-1 font-mono text-xs"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => onFileSelected(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="exo-accent-chip inline-flex min-h-[32px] items-center gap-1 px-2 font-mono text-[10.5px] font-semibold"
                >
                  <Upload className="h-3 w-3" />
                  Importer photo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setAvatarPreset(preset.id);
                    setAvatarPickerOpen(false);
                  }}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center text-[10px] ${
                    showcase.avatarPresetId === preset.id && !showcase.customAvatarDataUrl
                      ? 'exo-accent-chip-active'
                      : 'exo-surface-sub exo-accent-border'
                  }`}
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl font-display text-xs font-black text-white"
                    style={{
                      background: `linear-gradient(135deg, ${preset.gradientFrom}, ${preset.gradientTo})`,
                    }}
                  >
                    {preset.monogram}
                  </span>
                  <span className="font-semibold leading-tight">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {!compact && (
        <>
          {/* Banner, Emblem & Title Customization */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="exo-bento-card space-y-2 p-3 text-xs">
              <div className="font-display font-bold exo-accent-text">Bannière</div>
              <div className="grid grid-cols-2 gap-1.5">
                {(['ASTRAL_ROSE', 'SOLAR_GOLD', 'EDEN_EMERALD', 'OBSIDIAN_PLATINUM'] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setBannerStyle(id)}
                    className={`px-2 py-1.5 font-mono text-[10px] font-semibold ${
                      showcase.bannerStyleId === id ? 'exo-accent-chip-active' : 'exo-accent-chip'
                    }`}
                  >
                    {id.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="exo-bento-card space-y-2 p-3 text-xs">
              <div className="font-display font-bold exo-accent-text">Blason Géométrique</div>
              <div className="flex flex-wrap gap-1.5">
                {(['FOUNDER_PRISM', 'STAR_COMPASS', 'ORBIT_CROWN', 'BIO_LEAF', 'AEGIS_SHIELD'] as const).map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEmblem(em)}
                    aria-label={`Choisir blason ${em}`}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                      showcase.emblemId === em ? 'exo-accent-chip-active' : 'exo-accent-chip'
                    }`}
                  >
                    <FoundationSvgIcon kind={em} className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="exo-bento-card space-y-2 p-3 text-xs">
              <div className="font-display font-bold exo-accent-text">Titre Équipé</div>
              <div className="space-y-1">
                {showcase.titles.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={!t.unlocked}
                    onClick={() => setEquippedTitle(t.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-[11px] ${
                      showcase.equippedTitleId === t.id
                        ? 'exo-accent-chip-active'
                        : 'exo-surface-sub disabled:opacity-45'
                    }`}
                  >
                    <span className="truncate font-semibold">{t.label}</span>
                    {!t.unlocked && <span className="font-mono text-[9px]">Verrouillé</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Persistent Medals & Symbolic Project Conception Trophy */}
          <div className="exo-bento-card space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-1.5 font-display text-sm font-bold exo-accent-text">
                <Medal className="h-4 w-4" />
                Médailles Multi-Parties (Bronze → Platine)
              </h3>
              <span className="font-mono text-[10.5px] exo-muted-text">
                {showcase.medals.filter((m) => m.unlocked).length}/{showcase.medals.length} débloquées
              </span>
            </div>

            <div className="grid gap-2.5 md:grid-cols-2">
              {showcase.medals.map((medal) => {
                const pct = Math.min(100, Math.round((medal.progressCurrent / medal.progressTarget) * 100));
                return (
                  <div
                    key={medal.id}
                    className={`rounded-xl border p-3 text-xs ${
                      medal.isSymbolicDistinction
                        ? 'border-fuchsia-400/80 bg-fuchsia-500/10'
                        : 'exo-surface-sub exo-accent-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 font-display font-bold">
                        {medal.isSymbolicDistinction ? (
                          <Crown className="h-4 w-4 shrink-0 text-fuchsia-500 dark:text-fuchsia-300" />
                        ) : (
                          <Award className="h-4 w-4 shrink-0 exo-accent-2-text" />
                        )}
                        <span>{medal.title}</span>
                      </div>
                      <span
                        className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9.5px] font-bold ${
                          TIER_BADGE[medal.tier] ?? ''
                        }`}
                      >
                        {medal.tier}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] exo-muted-text">{medal.description}</p>
                    <div className="mt-2 flex items-center justify-between font-mono text-[10px]">
                      <span>{medal.unlocked ? '✓ Débloquée' : `Progression ${medal.progressCurrent}/${medal.progressTarget}`}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/15 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--exo-accent)] to-[var(--exo-accent-2)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pinnable Badges Selector (up to 4) */}
          <div className="exo-bento-card space-y-2.5 p-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 font-display text-sm font-bold exo-accent-text">
                <Sparkles className="h-4 w-4" />
                Badges Épinglables sur l&apos;Étendard (max 4)
              </h3>
              <span className="font-mono text-[10.5px] exo-muted-text">
                {showcase.pinnedBadgeIds.length}/4 épinglés
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {showcase.badges.map((b) => {
                const pinned = showcase.pinnedBadgeIds.includes(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    disabled={!b.unlocked}
                    onClick={() => togglePinnedBadge(b.id)}
                    className={`rounded-xl border p-2.5 text-left text-xs transition ${
                      pinned ? 'exo-accent-chip-active' : 'exo-surface-sub exo-accent-border disabled:opacity-45'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 font-semibold">
                      <span>{b.label}</span>
                      <span className="font-mono text-[9.5px]">{pinned ? 'Épinglé' : b.unlocked ? 'Épingler' : 'Verrouillé'}</span>
                    </div>
                    <p className="mt-1 text-[10.5px] exo-muted-text">{b.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
