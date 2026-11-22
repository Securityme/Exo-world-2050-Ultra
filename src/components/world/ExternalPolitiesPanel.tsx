import { useMemo, useState } from 'react';
import { useSetAtom } from 'jotai';
import {
  Building2,
  Eye,
  Handshake,
  Leaf,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react';
import { PromptSuggestionChips } from '../bento/PromptSuggestionChips.tsx';
import { handleGenerateActionEvent } from '../../pipelines/game-actions.pipeline.ts';
import { useExoStore } from '../../stores/game.store.ts';
import { activeDossierIdAtom, toastNoticeAtom } from '../../stores/selection.atoms.ts';
import {
  buildExternalCitiesRoster,
  buildLocalPolitiesRoster,
} from '../../systems/combat-conquest/theaters-and-polities.ts';
import { useMetaHonorsStore } from '../../stores/meta-honors.store.ts';

interface FreeformReply {
  readonly id: string;
  readonly prompt: string;
  readonly summary: string;
  readonly modelUsed: string;
  readonly targetFaction: string;
}

/**
 * [L7] EXW.L7.EXTERNAL_POLITIES_PANEL | v5.0.0 | SADT A4.1/A4.3
 * External Cities (Allied/Neutral/Hostile + GTA2-style Faction Respect Meter),
 * Local Fauna & Pre-Spacefaring Polities, plus Pax Historia Freeform Directive & Diplomacy Chat.
 */
export function ExternalPolitiesPanel() {
  const world = useExoStore((s) => s.world);
  const setActiveDossierId = useSetAtom(activeDossierIdAtom);
  const setToast = useSetAtom(toastNoticeAtom);
  const logGeminiUsage = useMetaHonorsStore((s) => s.logGeminiUsage);

  const externalCities = useMemo(() => buildExternalCitiesRoster(world), [world]);
  const localPolities = useMemo(() => buildLocalPolitiesRoster(world), [world]);

  const [chatTarget, setChatTarget] = useState<string>(externalCities[0]?.factionName ?? 'Super-Alliance');
  const [freeformInput, setFreeformInput] = useState('');
  const [sending, setSending] = useState(false);
  const [replies, setReplies] = useState<readonly FreeformReply[]>([]);

  const handleSendFreeform = async (mode: 'DIPLOMACY' | 'DIRECTIVE') => {
    const clean = freeformInput.trim();
    if (clean.length < 6 || sending) return;
    setSending(true);
    try {
      const resp = await fetch('/api/gemini/channel/freeform-directive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `[${mode} · Cible: ${chatTarget}] ${clean}`,
          worldSummary: `Tour ${world.cycle}, Ère ${world.era}, Crédits ${world.resources.credits}, Approbation ${Math.round(world.approval)}%, Confiance Alliance ${world.superAllianceTrust}%`,
        }),
      });
      const json = (await resp.json()) as {
        summary?: string;
        modelUsed?: string;
        inputTokens?: number;
        outputTokens?: number;
      };
      const summary =
        json.summary ??
        `Réponse enregistrée par ${chatTarget} : votre proposition a été transmise au conseil exécutif (repli local).`;
      const modelUsed = json.modelUsed ?? 'gemini-4-hydrogen';
      logGeminiUsage('text', modelUsed, json.inputTokens ?? 260, json.outputTokens ?? 140);
      setReplies((prev) => [
        {
          id: `reply-${Date.now()}`,
          prompt: clean,
          summary,
          modelUsed,
          targetFaction: chatTarget,
        },
        ...prev.slice(0, 5),
      ]);
      setFreeformInput('');
      setToast({
        id: Date.now(),
        tone: 'success',
        text: `Canal ${mode === 'DIPLOMACY' ? 'diplomatique' : 'directive libre'} traité (${modelUsed}).`,
      });
    } catch {
      setReplies((prev) => [
        {
          id: `reply-${Date.now()}`,
          prompt: clean,
          summary: `Synthèse locale déterministe : ${chatTarget} accuse réception de votre message et prépare une réponse au prochain tour.`,
          modelUsed: 'local-fallback',
          targetFaction: chatTarget,
        },
        ...prev.slice(0, 5),
      ]);
      setFreeformInput('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="external-polities-panel">
      {/* External Cities + GTA2-style Faction Respect Meter */}
      <div className="exo-bento-card space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-display text-sm font-bold text-[var(--exo-text)]">
            <Building2 className="h-4 w-4 exo-accent-text" />
            <span>Cités Extérieures &amp; Jauge de Respect des Factions</span>
          </div>
          <span className="font-mono text-[10.5px] exo-muted-text">
            Commerce · Renseignement · Échange Technologique
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {externalCities.map((city) => {
            const stanceBadge =
              city.stance === 'ALLIED'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                : city.stance === 'HOSTILE'
                  ? 'bg-rose-500/20 text-rose-500 dark:text-rose-300'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-300';
            const respectPct = Math.round(((city.respectScore + 100) / 200) * 100);

            return (
              <div
                key={city.id}
                className="exo-surface-sub space-y-2 rounded-xl border exo-accent-border p-3 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display font-bold text-[var(--exo-text)]">{city.name}</div>
                    <div className="font-mono text-[10px] exo-muted-text">
                      {city.factionName} · Secteur #{city.sectorIndex}
                    </div>
                  </div>
                  <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${stanceBadge}`}>
                    {city.stance === 'ALLIED' ? 'ALLIÉE' : city.stance === 'HOSTILE' ? 'HOSTILE' : 'NEUTRE'}
                  </span>
                </div>

                {/* GTA2-inspired Faction Respect Meter */}
                <div>
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="exo-muted-text">Respect Faction</span>
                    <strong>{city.respectScore >= 0 ? `+${city.respectScore}` : city.respectScore}</strong>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/20 dark:bg-white/10">
                    <div
                      className={`h-full ${
                        city.respectScore >= 15
                          ? 'bg-emerald-500'
                          : city.respectScore <= -15
                            ? 'bg-rose-500'
                            : 'bg-amber-400'
                      }`}
                      style={{ width: `${respectPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-[10.5px]">
                  <span>Commerce : +{city.tradeBonusCredits} Cr</span>
                  <span className="inline-flex items-center gap-1 exo-accent-2-text">
                    <Eye className="h-3 w-3" /> Intel {city.intelLevelPct}%
                  </span>
                </div>
                <div className="text-[11px] exo-muted-text">
                  Tech échangeable : <strong className="text-[var(--exo-text)]">{city.techExchangeAvailable}</strong>
                </div>

                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setChatTarget(city.factionName)}
                    className="exo-accent-chip inline-flex min-h-[32px] flex-1 items-center justify-center gap-1 font-mono text-[10.5px] font-bold"
                  >
                    <MessageSquare className="h-3 w-3 exo-accent-text" />
                    Négocier
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const [err, dos] = handleGenerateActionEvent({
                        kind: 'MARKET_TRADE',
                        resource: 'materials',
                        action: 'BUY',
                        quantity: 15,
                      });
                      if (!err && dos) setActiveDossierId(dos.id);
                    }}
                    className="exo-accent-chip inline-flex min-h-[32px] flex-1 items-center justify-center gap-1 font-mono text-[10.5px] font-bold"
                  >
                    <Handshake className="h-3 w-3 text-emerald-500" />
                    Accord Com.
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Local Fauna & Pre-Spacefaring Polities */}
      <div className="exo-bento-card space-y-2.5 p-4 text-xs">
        <div className="flex items-center gap-1.5 font-display text-sm font-bold text-[var(--exo-text)]">
          <Leaf className="h-4 w-4 text-emerald-500" />
          <span>Faune Locale &amp; Polities Pré-Spatiales</span>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {localPolities.map((pol) => (
            <div key={pol.id} className="exo-surface-sub rounded-xl border exo-accent-border p-3">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="exo-accent-text font-bold">{pol.kind}</span>
                <span className="exo-muted-text">Secteur #{pol.sectorIndex}</span>
              </div>
              <div className="mt-1 font-display font-bold text-[var(--exo-text)]">{pol.name}</div>
              <div className="mt-1 text-[11px] exo-muted-text">{pol.ecologicalRole}</div>
              <div className="mt-2 flex items-center justify-between font-mono text-[10px]">
                <span>Pop. ~{pol.populationEstimate}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-300">{pol.attitude}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pax Historia Freeform Directive & Private Diplomacy Chat */}
      <div className="exo-bento-card space-y-3 p-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-display text-sm font-bold exo-accent-text">
            <Sparkles className="h-4 w-4" />
            <span>Directives Libres &amp; Diplomatie Privée (Inspiration Pax Historia · Free Tier)</span>
          </div>
          <select
            aria-label="Destinataire diplomatique"
            value={chatTarget}
            onChange={(e) => setChatTarget(e.target.value)}
            className="min-h-[34px] rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2.5 font-mono text-[11px] text-[var(--exo-text)]"
          >
            <option value="Super-Alliance">Super-Alliance</option>
            {externalCities.map((c) => (
              <option key={c.id} value={c.factionName}>
                {c.factionName}
              </option>
            ))}
          </select>
        </div>

        <PromptSuggestionChips domain="DIPLOMACY" onInject={(txt) => setFreeformInput(txt)} />
        <PromptSuggestionChips
          domain="DIRECTIVE"
          label="Ou injecter une directive intérieure :"
          onInject={(txt) => setFreeformInput(txt)}
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            data-testid="pax-diplomacy-input"
            value={freeformInput}
            onChange={(e) => setFreeformInput(e.target.value)}
            placeholder={`Rédigez une dépêche ou directive pour ${chatTarget}…`}
            className="min-h-[42px] flex-1 rounded-xl border exo-accent-border bg-[var(--exo-surface)] px-3 text-xs text-[var(--exo-text)]"
          />
          <button
            type="button"
            disabled={sending || freeformInput.trim().length < 6}
            onClick={() => void handleSendFreeform('DIPLOMACY')}
            className="exo-accent-btn inline-flex min-h-[42px] items-center justify-center gap-1.5 px-4 font-mono text-xs font-bold disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{sending ? 'Envoi…' : 'Transmettre'}</span>
          </button>
        </div>

        {replies.length > 0 && (
          <div className="space-y-2 border-t exo-accent-border pt-2.5">
            {replies.map((r) => (
              <div key={r.id} className="exo-surface-sub rounded-xl p-2.5">
                <div className="flex items-center justify-between font-mono text-[10px] exo-muted-text">
                  <span>À : {r.targetFaction}</span>
                  <span className="exo-accent-text">{r.modelUsed}</span>
                </div>
                <div className="mt-1 font-semibold text-[var(--exo-text)]">« {r.prompt} »</div>
                <p className="mt-1 text-[11px] leading-relaxed exo-muted-text">{r.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
