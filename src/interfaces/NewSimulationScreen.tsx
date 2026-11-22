import { ArrowLeft, Bot, Check, Play, Shuffle, Sparkles } from 'lucide-react';
import { ART_MANIFEST, getSuperpowerEmblem } from '../data/art-manifest.data.ts';
import { AI_PERSONALITIES_CATALOG, SUPERPOWERS_V4_CATALOG } from '../data/v4-catalog.data.ts';
import { useExoStore } from '../stores/game.store.ts';

const EXTENSION_OPTIONS = [
  { id: 'GENESE_2050', label: 'Protocole Genèse 2050' },
  { id: 'HK_STARS', label: 'Étoiles & Gloire Humankind' },
  { id: 'FP_WORKFORCE', label: 'Colons RPG & Équipement' },
  { id: 'GEMINI_4T', label: 'Événements Live Gemini 4T' },
] as const;

/**
 * [L7] EXW.L7.NEW_SIMULATION | v4.0.0-rc.1 | SADT A5.1
 * Enriched New Simulation Configurator:
 * - 5 Superpowers 2050 with generated 1:1 heraldic emblems
 * - Custom AI Co-pilot (Name, 5 Personalities, Adaptability toggle)
 * - Campaign / Infinite mode + Extension modules + Protocole Genèse Act 0 toggle
 */
export function NewSimulationScreen() {
  const draft = useExoStore((s) => s.draftConfig);
  const updateDraft = useExoStore((s) => s.updateDraftConfig);
  const startNewCampaign = useExoStore((s) => s.startNewCampaign);
  const setScreen = useExoStore((s) => s.setScreen);

  const toggleExtension = (id: string) => {
    const exists = draft.enabledExtensions.includes(id);
    const next = exists
      ? draft.enabledExtensions.filter((e) => e !== id)
      : [...draft.enabledExtensions, id];
    updateDraft({ enabledExtensions: next });
  };

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-[#fff7f9] px-4 py-6 dark:bg-[#120916] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-5">
        {/* Atmospheric Banner Header */}
        <div className="exo-bento-card relative overflow-hidden rounded-2xl">
          <img
            src={ART_MANIFEST.menuBackground}
            alt="Exo World 2050"
            className="h-36 w-full object-cover sm:h-44"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#180a21]/92 via-[#180a21]/65 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-between p-5 sm:p-6">
            <div>
              <button
                type="button"
                onClick={() => setScreen('EXO_MAIN_MENU')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-black/40 px-2.5 py-1 font-mono text-[11px] font-semibold text-rose-100 hover:bg-black/60"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Menu Principal</span>
              </button>
              <h1 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
                Nouvelle Simulation · 2050
              </h1>
              <p className="mt-0.5 text-xs text-rose-100/85">
                Configurez votre Superpuissance, votre Co-pilote IA et les extensions de campagne.
              </p>
            </div>
          </div>
        </div>

        {/* 1. Superpower Selection (5 Superpuissances 2050 with Emblems) */}
        <section className="exo-bento-card p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#1f1224] dark:text-rose-50">
              1 · Choisir votre Superpuissance 2050
            </h2>
            <span className="font-mono text-[11px] text-rose-700 dark:text-rose-300">
              5 Blocs · 6 Identités d’Ères Évolutives
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {SUPERPOWERS_V4_CATALOG.map((sp) => {
              const selected = draft.superpowerId === sp.id;
              return (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => updateDraft({ superpowerId: sp.id })}
                  className={`flex flex-col items-center rounded-xl border p-3 text-center transition ${
                    selected
                      ? 'border-rose-500 bg-rose-500/12 ring-2 ring-rose-500/35 dark:bg-rose-500/20'
                      : 'border-rose-200 bg-white/85 hover:border-rose-400 dark:border-rose-900/60 dark:bg-[#190d1f]'
                  }`}
                >
                  <img
                    src={getSuperpowerEmblem(sp.id)}
                    alt={sp.name}
                    className="h-16 w-16 rounded-full border-2 border-rose-300/70 object-cover shadow-sm"
                  />
                  <span className="mt-2 rounded bg-rose-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-700 dark:text-rose-300">
                    {sp.code}
                  </span>
                  <div className="mt-1 font-display text-xs font-bold text-[#1f1224] dark:text-rose-50">
                    {sp.name}
                  </div>
                  <p className="mt-1 text-[10.5px] leading-snug text-rose-950/75 dark:text-rose-200/75">
                    {sp.startingBonus}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. AI Co-pilot Customization + Campaign Mode & Extensions */}
        <div className="grid gap-5 lg:grid-cols-12">
          <section className="exo-bento-card space-y-3 p-4 sm:p-5 lg:col-span-7">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-rose-600 dark:text-rose-300" />
              <h2 className="font-display text-base font-bold text-[#1f1224] dark:text-rose-50">
                2 · Co-pilote IA Personnalisé (AI-P)
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs">
                <span className="font-mono text-[10.5px] font-bold uppercase text-rose-800 dark:text-rose-200">
                  Nom du Co-pilote IA
                </span>
                <input
                  type="text"
                  maxLength={32}
                  value={draft.aiPersonaName}
                  onChange={(e) => updateDraft({ aiPersonaName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-rose-200 bg-white px-3 py-2 font-mono text-sm font-semibold text-[#1f1224] focus:border-rose-500 focus:outline-none dark:border-rose-800 dark:bg-[#160b1c] dark:text-rose-50"
                />
              </label>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => updateDraft({ aiAdaptability: !draft.aiAdaptability })}
                  className={`flex w-full min-h-[40px] items-center justify-between rounded-xl border px-3 text-xs font-semibold ${
                    draft.aiAdaptability
                      ? 'border-emerald-400 bg-emerald-500/12 text-emerald-900 dark:text-emerald-200'
                      : 'border-rose-200 bg-white/80 text-rose-900 dark:border-rose-800 dark:bg-[#160b1c] dark:text-rose-200'
                  }`}
                >
                  <span>Adaptabilité comportementale</span>
                  <span className="font-mono text-[11px] font-bold">
                    {draft.aiAdaptability ? 'ACTIVE' : 'FIXE'}
                  </span>
                </button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-5">
              {AI_PERSONALITIES_CATALOG.map((p) => {
                const active = draft.aiPersonality === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => updateDraft({ aiPersonality: p.id })}
                    className={`rounded-xl border p-2 text-left text-[11px] transition ${
                      active
                        ? 'border-rose-500 bg-rose-600 text-white'
                        : 'border-rose-200 bg-white/85 text-[#1f1224] hover:border-rose-400 dark:border-rose-900/60 dark:bg-[#190d1f] dark:text-rose-100'
                    }`}
                  >
                    <div className="font-bold">{p.label}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11.5px] text-rose-950/75 dark:text-rose-200/75">
              {AI_PERSONALITIES_CATALOG.find((p) => p.id === draft.aiPersonality)?.tagline}
            </p>
          </section>

          <section className="exo-bento-card space-y-3 p-4 sm:p-5 lg:col-span-5">
            <h2 className="font-display text-base font-bold text-[#1f1224] dark:text-rose-50">
              3 · Mode, Extensions & Graine
            </h2>

            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['CAMPAIGN', 'Campagne (6 Ères)'],
                  ['INFINITE_SANDBOX', 'Bac à sable Infini'],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => updateDraft({ mode: m })}
                  className={`min-h-[38px] rounded-xl border px-3 text-xs font-bold ${
                    draft.mode === m
                      ? 'border-rose-500 bg-rose-600 text-white'
                      : 'border-rose-200 bg-white/85 text-rose-900 dark:border-rose-800 dark:bg-[#190d1f] dark:text-rose-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {EXTENSION_OPTIONS.map((ext) => {
                const on = draft.enabledExtensions.includes(ext.id);
                return (
                  <button
                    key={ext.id}
                    type="button"
                    onClick={() => toggleExtension(ext.id)}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${
                      on
                        ? 'border-emerald-400 bg-emerald-500/12 text-emerald-900 dark:text-emerald-200'
                        : 'border-rose-200 bg-white/70 text-rose-900/70 dark:border-rose-900 dark:bg-[#160b1c] dark:text-rose-200/70'
                    }`}
                  >
                    <Check className={`h-3.5 w-3.5 ${on ? 'opacity-100' : 'opacity-20'}`} />
                    <span className="truncate">{ext.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl border border-rose-200 bg-white/85 px-3 py-1.5 font-mono text-xs dark:border-rose-800 dark:bg-[#160b1c]">
                <span className="text-[10px] text-rose-900/60 dark:text-rose-200/60">GRAINE PCG32 : </span>
                <strong className="text-[#1f1224] dark:text-rose-50">{draft.worldSeed}</strong>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateDraft({ worldSeed: Math.floor(10_000_000 + Math.random() * 89_000_000) })
                }
                aria-label="Nouvelle graine"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-800 hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
              >
                <Shuffle className="h-4 w-4" />
              </button>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-rose-950/80 dark:text-rose-200/80">
              <input
                type="checkbox"
                checked={!draft.skipGeneseAct0}
                onChange={(e) => updateDraft({ skipGeneseAct0: !e.target.checked })}
                className="h-4 w-4 accent-rose-600"
              />
              <span>Démarrer avec le Protocole Genèse 2050 (Acte 0)</span>
            </label>
          </section>
        </div>

        {/* Launch Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-white/90 p-4 dark:border-rose-900/60 dark:bg-[#190d1f]">
          <div className="flex items-center gap-2 text-xs text-rose-900/80 dark:text-rose-200/80">
            <Sparkles className="h-4 w-4 text-rose-600 dark:text-rose-300" />
            <span>
              Moteur déterministe 6-flux PCG32 · Tour par tour strict (`T_END_TURN`) · Audio FIP actif au 1er geste
            </span>
          </div>
          <button
            type="button"
            onClick={startNewCampaign}
            className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-rose-600 px-6 font-display text-sm font-bold text-white shadow-md hover:bg-rose-500"
          >
            <Play className="h-4 w-4" />
            <span>Lancer la Colonie 2050</span>
          </button>
        </div>
      </div>
    </div>
  );
}
