import { useMemo, useRef, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Cloud,
  Crown,
  Filter,
  Image as ImageIcon,
  Lock,
  Medal,
  Pin,
  Sparkles,
  Upload,
} from 'lucide-react';
import { FoundationSvgIcon } from '../../components/bento/FoundationSvgIcon.tsx';
import { ProfileAvatarFrame } from '../../components/bento/ProfileAvatarFrame.tsx';
import type { MedalTier } from '../../contracts/honors.schema.ts';
import {
  AVATAR_PRESETS,
  BANNER_STYLES_CATALOG,
  type AvatarCategory,
} from '../../data/honors.catalog.ts';
import { useMetaHonorsStore } from '../../stores/meta-honors.store.ts';

/**
 * [L7] EXW.L7.TROPHY_SHOWCASE | v5.1.0 | SADT A5.1
 * Tier 1 Multi-Campaign Player Showcase:
 * - Clickable Photographic Portrait Catalog (12 Solarpunk 2050 portraits + Local Upload)
 * - Calling Card / Étendard Joueur (6 Astralis/Solarpunk banners, 5 emblems, 8 titles, 4 pinned badges)
 * - Filterable 16-Achievement Catalog (8 categories, Bronze -> Silver -> Gold -> Platinum)
 */
const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  ALL: 'Tous',
  CONCEPTION: 'Conception',
  EXPLORATION: 'Exploration',
  BIOSPHERE: 'Biosphère',
  DIPLOMACY: 'Diplomatie',
  MILITARY: 'Militaire',
  ECONOMY: 'Économie',
  SCIENCE: 'Science',
  PHILOSOPHY: 'Philosophie',
};

const AVATAR_CATEGORY_LABELS: Readonly<Record<'ALL' | AvatarCategory, string>> = {
  ALL: 'Tous',
  DIRECTION: 'Direction',
  SCIENCE: 'Science',
  TERRAIN: 'Terrain',
  DIPLOMATIE: 'Diplomatie',
};

const TIER_ACCENT: Readonly<Record<MedalTier, string>> = {
  BRONZE: 'text-amber-600 dark:text-amber-400',
  SILVER: 'text-slate-500 dark:text-slate-300',
  GOLD: 'text-amber-500 dark:text-yellow-300',
  PLATINUM: 'text-cyan-600 dark:text-cyan-300',
};

const TIER_BORDER: Readonly<Record<MedalTier, string>> = {
  BRONZE: 'border-amber-700/45',
  SILVER: 'border-slate-400/55',
  GOLD: 'border-amber-400/70',
  PLATINUM: 'border-cyan-400/75',
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
  const [avatarCategory, setAvatarCategory] = useState<'ALL' | AvatarCategory>('ALL');
  const [medalCategory, setMedalCategory] = useState<string>('ALL');
  const [medalStatus, setMedalStatus] = useState<'ALL' | 'UNLOCKED' | 'IN_PROGRESS'>('ALL');
  const [medalTier, setMedalTier] = useState<'ALL' | MedalTier>('ALL');
  const [cloudMsg, setCloudMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activePreset =
    AVATAR_PRESETS.find((p) => p.id === showcase.avatarPresetId) ?? AVATAR_PRESETS[0]!;
  const activeBanner =
    BANNER_STYLES_CATALOG.find((b) => b.id === showcase.bannerStyleId) ?? BANNER_STYLES_CATALOG[0]!;
  const activeTitle =
    showcase.titles.find((t) => t.id === showcase.equippedTitleId) ?? showcase.titles[0]!;
  const pinnedBadges = showcase.badges.filter((b) => showcase.pinnedBadgeIds.includes(b.id));

  const filteredAvatars = useMemo(
    () =>
      avatarCategory === 'ALL'
        ? AVATAR_PRESETS
        : AVATAR_PRESETS.filter((p) => p.category === avatarCategory),
    [avatarCategory],
  );

  const unlockedCount = useMemo(
    () => showcase.medals.filter((m) => m.unlocked).length,
    [showcase.medals],
  );
  const totalCompletionPct = Math.round(
    (unlockedCount / Math.max(1, showcase.medals.length)) * 100,
  );

  const filteredMedals = useMemo(
    () =>
      showcase.medals.filter((m) => {
        if (medalCategory !== 'ALL' && m.category !== medalCategory) return false;
        if (medalStatus === 'UNLOCKED' && !m.unlocked) return false;
        if (medalStatus === 'IN_PROGRESS' && m.unlocked) return false;
        if (medalTier !== 'ALL' && m.tier !== medalTier) return false;
        return true;
      }),
    [showcase.medals, medalCategory, medalStatus, medalTier],
  );

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
        setCloudMsg('Portrait local appliqué avec succès.');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Étendard Joueur (Calling Card) */}
      <div
        data-testid="player-calling-card"
        className={`rounded-2xl border bg-gradient-to-r p-4 shadow-md ${activeBanner.gradientClass}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Clickable Portrait */}
            <button
              type="button"
              data-testid="showcase-avatar-btn"
              onClick={() => setAvatarPickerOpen((v) => !v)}
              aria-expanded={avatarPickerOpen}
              aria-label="Ouvrir le catalogue de portraits du profil"
              className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-white/75 shadow-lg transition hover:scale-[1.03]"
            >
              <ProfileAvatarFrame
                preset={activePreset}
                customDataUrl={showcase.customAvatarDataUrl}
                alt={`Portrait de ${showcase.callsign}`}
                className="h-full w-full rounded-none"
                monogramClassName="text-xl"
              />
              <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center font-mono text-[9.5px] font-semibold text-white transition group-hover:bg-black/85">
                {avatarPickerOpen ? 'Fermer' : 'Portraits'}
              </span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FoundationSvgIcon kind={showcase.emblemId} className="h-5 w-5 shrink-0 exo-accent-text" />
                <span className="truncate font-display text-lg font-bold tracking-tight">
                  {showcase.callsign}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px]">
                <span className="font-bold exo-accent-text">{activeTitle.label}</span>
                <span aria-hidden="true" className="exo-muted-text">·</span>
                <span className="exo-muted-text">
                  {activePreset.label} ({activePreset.role})
                </span>
              </div>
              {pinnedBadges.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px]">
                  {pinnedBadges.map((b) => (
                    <span
                      key={b.id}
                      className={`inline-flex items-center gap-1 font-semibold ${TIER_ACCENT[b.tier]}`}
                    >
                      <Pin className="h-2.5 w-2.5 shrink-0" />
                      {b.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {!compact && (
            <div className="flex flex-col items-end gap-2 font-mono text-[11px]">
              <div className="tabular-nums exo-muted-text">
                {showcase.campaignsPlayed} campagne(s) · {showcase.totalTurnsSimulated} tours ·{' '}
                {showcase.totalDecisionsSigned} décisions
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  data-testid="toggle-portrait-catalog-btn"
                  onClick={() => setAvatarPickerOpen((v) => !v)}
                  className="exo-accent-chip inline-flex min-h-[40px] items-center gap-1.5 px-3 text-[11px] font-semibold"
                >
                  <ImageIcon className="h-3.5 w-3.5 exo-accent-text" />
                  <span>{avatarPickerOpen ? 'Masquer Catalogue' : 'Catalogue Portraits (12)'}</span>
                </button>
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
                  className="exo-accent-chip inline-flex min-h-[40px] items-center gap-1.5 px-3 text-[11px] font-semibold"
                >
                  <Cloud className="h-3.5 w-3.5 exo-accent-text" />
                  <span>Sync Cloud</span>
                </button>
              </div>
              {cloudMsg && <span className="text-[10px] exo-muted-text">{cloudMsg}</span>}
            </div>
          )}
        </div>

        {/* Photographic Profile Portrait Catalog & Local Upload Drawer */}
        {avatarPickerOpen && (
          <div
            data-testid="portrait-catalog-drawer"
            className="mt-4 space-y-3 border-t pt-4 exo-accent-border"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <h4 className="flex items-center gap-1.5 font-display text-sm font-bold exo-accent-text">
                  <ImageIcon className="h-4 w-4" />
                  Catalogue de Portraits 2050 ({filteredAvatars.length}/{AVATAR_PRESETS.length})
                </h4>
                <p className="text-[11px] exo-muted-text">
                  Sélectionnez un portrait haute définition ou importez votre propre photo locale.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={showcase.callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                  maxLength={40}
                  aria-label="Indicatif du dirigeant"
                  className="min-h-[40px] rounded-xl border exo-accent-border bg-[var(--exo-surface)] px-3 py-1 font-mono text-xs"
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
                  className="exo-accent-btn inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 font-mono text-[11px] font-semibold"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Importer photo</span>
                </button>
              </div>
            </div>

            {/* Category Filters for Portraits */}
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer les portraits par spécialité">
              {(['ALL', 'DIRECTION', 'SCIENCE', 'TERRAIN', 'DIPLOMATIE'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setAvatarCategory(cat)}
                  className={`min-h-[36px] rounded-xl px-3 font-mono text-[11px] font-semibold transition ${
                    avatarCategory === cat ? 'exo-accent-btn' : 'exo-accent-chip'
                  }`}
                >
                  {AVATAR_CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {filteredAvatars.map((preset) => {
                const isSelected =
                  showcase.avatarPresetId === preset.id && !showcase.customAvatarDataUrl;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    data-testid={`avatar-preset-${preset.id}`}
                    onClick={() => setAvatarPreset(preset.id)}
                    className={`group flex flex-col overflow-hidden rounded-xl border text-left transition ${
                      isSelected
                        ? 'border-[var(--exo-accent)] bg-[var(--exo-surface)] ring-2 ring-[var(--exo-accent)]/40'
                        : 'exo-surface-sub exo-accent-border hover:border-[var(--exo-accent)]/70'
                    }`}
                  >
                    <div className="relative aspect-square w-full overflow-hidden">
                      <ProfileAvatarFrame
                        preset={preset}
                        alt={`Portrait ${preset.label} — ${preset.role}`}
                        className="h-full w-full rounded-none transition duration-300 group-hover:scale-105"
                        monogramClassName="text-2xl"
                      />
                      {isSelected && (
                        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-black/75 px-2 py-0.5 font-mono text-[9.5px] font-bold text-cyan-300">
                          <CheckCircle2 className="h-3 w-3" />
                          Actif
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <div className="font-display text-xs font-bold leading-tight">{preset.label}</div>
                      <div className="mt-0.5 font-mono text-[10px] exo-accent-2-text">
                        {preset.role}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[10px] leading-snug exo-muted-text">
                        {preset.tagline}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {!compact && (
        <>
          {/* Banner, Emblem & Title Customization */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="exo-bento-card space-y-2.5 p-3.5 text-xs">
              <div className="font-display font-bold exo-accent-text">Bannière ({BANNER_STYLES_CATALOG.length})</div>
              <div className="grid grid-cols-2 gap-1.5">
                {BANNER_STYLES_CATALOG.map((banner) => (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => setBannerStyle(banner.id)}
                    className={`flex min-h-[38px] items-center gap-2 rounded-xl px-2.5 py-1.5 text-left font-mono text-[10.5px] font-semibold transition ${
                      showcase.bannerStyleId === banner.id ? 'exo-accent-chip-active' : 'exo-accent-chip'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: banner.swatchHex }}
                    />
                    <span className="truncate">{banner.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="exo-bento-card space-y-2.5 p-3.5 text-xs">
              <div className="font-display font-bold exo-accent-text">Blason Géométrique</div>
              <div className="flex flex-wrap gap-2">
                {(['FOUNDER_PRISM', 'STAR_COMPASS', 'ORBIT_CROWN', 'BIO_LEAF', 'AEGIS_SHIELD'] as const).map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEmblem(em)}
                    aria-label={`Choisir blason ${em}`}
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition ${
                      showcase.emblemId === em ? 'exo-accent-chip-active' : 'exo-accent-chip'
                    }`}
                  >
                    <FoundationSvgIcon kind={em} className="h-5 w-5" />
                  </button>
                ))}
              </div>
              <p className="text-[11px] exo-muted-text">
                Affiché sur votre étendard du menu principal et dans les archives de campagne.
              </p>
            </div>

            <div className="exo-bento-card space-y-2.5 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold exo-accent-text">Titres de Carrière</span>
                <span className="font-mono text-[10px] tabular-nums exo-muted-text">
                  {showcase.titles.filter((t) => t.unlocked).length}/{showcase.titles.length}
                </span>
              </div>
              <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
                {showcase.titles.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={!t.unlocked}
                    title={t.requirement}
                    onClick={() => setEquippedTitle(t.id)}
                    className={`flex min-h-[36px] w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] transition ${
                      showcase.equippedTitleId === t.id
                        ? 'exo-accent-chip-active'
                        : 'exo-surface-sub disabled:opacity-45'
                    }`}
                  >
                    <span className="truncate font-semibold">{t.label}</span>
                    {!t.unlocked && <Lock className="h-3 w-3 shrink-0 exo-muted-text" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Expanded Filterable Achievement Catalog (16 Achievements) */}
          <div data-testid="achievements-catalog" className="exo-bento-card space-y-3.5 p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-1.5 font-display text-base font-bold exo-accent-text">
                  <Medal className="h-4 w-4" />
                  Catalogue de Succès &amp; Médailles Multi-Parties
                </h3>
                <p className="mt-0.5 text-xs exo-muted-text">
                  Progression persistante multi-campagnes · Bronze → Argent → Or → Platine
                </p>
              </div>
              <div className="text-right font-mono text-xs tabular-nums">
                <span className="font-bold exo-accent-text">
                  {unlockedCount}/{showcase.medals.length}
                </span>
                <span className="exo-muted-text"> débloqués · {totalCompletionPct}%</span>
              </div>
            </div>

            {/* Global Completion Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/15 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--exo-accent)] to-[var(--exo-accent-2)] transition-all duration-500"
                style={{ width: `${totalCompletionPct}%` }}
              />
            </div>

            {/* Filters Row: Category + Status + Tier */}
            <div className="space-y-2 border-y py-2.5 exo-accent-border">
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrer par domaine">
                <Filter className="mr-1 h-3.5 w-3.5 exo-muted-text" />
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    data-testid={`medal-filter-cat-${key.toLowerCase()}`}
                    onClick={() => setMedalCategory(key)}
                    className={`min-h-[34px] rounded-lg px-2.5 font-mono text-[10.5px] font-semibold transition ${
                      medalCategory === key ? 'exo-accent-btn' : 'exo-accent-chip'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer par statut">
                  {(
                    [
                      ['ALL', 'Tous statuts'],
                      ['UNLOCKED', 'Débloqués'],
                      ['IN_PROGRESS', 'En cours'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMedalStatus(val)}
                      className={`min-h-[32px] rounded-lg px-2.5 font-mono text-[10px] font-semibold ${
                        medalStatus === val ? 'exo-accent-chip-active' : 'exo-surface-sub exo-muted-text'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer par rang">
                  {(
                    [
                      ['ALL', 'Tous rangs'],
                      ['BRONZE', 'Bronze'],
                      ['SILVER', 'Argent'],
                      ['GOLD', 'Or'],
                      ['PLATINUM', 'Platine'],
                    ] as const
                  ).map(([tier, label]) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setMedalTier(tier)}
                      className={`min-h-[32px] rounded-lg px-2 font-mono text-[10px] font-semibold ${
                        medalTier === tier ? 'exo-accent-chip-active' : 'exo-surface-sub exo-muted-text'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Achievements Grid */}
            {filteredMedals.length === 0 ? (
              <div className="exo-surface-sub rounded-xl p-6 text-center text-xs exo-muted-text">
                Aucun succès ne correspond aux filtres sélectionnés.
              </div>
            ) : (
              <div className="grid gap-2.5 md:grid-cols-2">
                {filteredMedals.map((medal) => {
                  const pct = Math.min(
                    100,
                    Math.round((medal.progressCurrent / medal.progressTarget) * 100),
                  );
                  return (
                    <div
                      key={medal.id}
                      data-testid={`medal-card-${medal.id}`}
                      className={`rounded-xl border p-3.5 text-xs transition ${
                        medal.isSymbolicDistinction
                          ? 'border-fuchsia-400/70 bg-fuchsia-500/10'
                          : medal.unlocked
                            ? `${TIER_BORDER[medal.tier]} bg-[var(--exo-surface)]`
                            : 'exo-surface-sub exo-accent-border opacity-90'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          {medal.isSymbolicDistinction ? (
                            <Crown className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-500 dark:text-fuchsia-300" />
                          ) : medal.unlocked ? (
                            <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${TIER_ACCENT[medal.tier]}`} />
                          ) : (
                            <Award className="mt-0.5 h-4 w-4 shrink-0 exo-muted-text" />
                          )}
                          <div>
                            <div className="font-display text-[13px] font-bold leading-snug">
                              {medal.title}
                            </div>
                            <div className="mt-0.5 font-mono text-[10px] exo-muted-text">
                              {CATEGORY_LABELS[medal.category] ?? medal.category} ·{' '}
                              <span className={`font-bold ${TIER_ACCENT[medal.tier]}`}>
                                {medal.tier}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums exo-accent-text">
                          {pct}%
                        </span>
                      </div>

                      <p className="mt-2 text-[11px] leading-relaxed exo-muted-text">
                        {medal.description}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between font-mono text-[10px] tabular-nums">
                        <span className={medal.unlocked ? 'font-semibold text-emerald-500 dark:text-emerald-300' : 'exo-muted-text'}>
                          {medal.unlocked
                            ? 'Succès débloqué'
                            : `Progression ${medal.progressCurrent} / ${medal.progressTarget}`}
                        </span>
                        {medal.isSymbolicDistinction && (
                          <span className="text-fuchsia-500 dark:text-fuchsia-300">Distinction symbolique</span>
                        )}
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
            )}
          </div>

          {/* Pinnable Badges Selector (10 Badges, up to 4 pinned) */}
          <div className="exo-bento-card space-y-2.5 p-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 font-display text-sm font-bold exo-accent-text">
                <Sparkles className="h-4 w-4" />
                Badges Épinglables sur l&apos;Étendard ({showcase.badges.length} disponibles)
              </h3>
              <span className="font-mono text-[10.5px] tabular-nums exo-muted-text">
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
                    className={`min-h-[64px] rounded-xl border p-2.5 text-left text-xs transition ${
                      pinned ? 'exo-accent-chip-active' : 'exo-surface-sub exo-accent-border disabled:opacity-45'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: b.colorHex }}
                        />
                        <span>{b.label}</span>
                      </span>
                      <span className="font-mono text-[9.5px]">
                        {pinned ? 'Épinglé' : b.unlocked ? 'Épingler' : 'Verrouillé'}
                      </span>
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
