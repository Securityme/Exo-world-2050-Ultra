import { useMemo, useState } from 'react';
import { useSetAtom } from 'jotai';
import {
  Award,
  Crown,
  Monitor,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { ERAS_CATALOG, SUPERPOWERS_CATALOG } from '../../data/world.catalog.ts';
import { useViewportLayout } from '../../hooks/use-viewport-layout.ts';
import { auth } from '../../services/firebase/firebase-client.ts';
import { useExoStore } from '../../stores/game.store.ts';
import { activeSubscreenAtom } from '../../stores/selection.atoms.ts';
import { evaluateCampaignCommanderProfile } from '../../systems/honors/honors-evaluator.ts';
import { formatAtmosphereStageName } from '../../utils/atmosphere-labels.ts';
import { TrophyShowcasePanel } from './TrophyShowcasePanel.tsx';

type ProfileTab = 'SHOWCASE' | 'COMMANDER' | 'PROGRESS';

/**
 * [L7] EXW.L7.PROFILE_HUB | v5.0.0 | SADT A5.1
 * Two-Tier Honors & Identity Hub:
 * - Tier 1 (Multi-Parties): Étendard, Avatar cliquable, Médailles & Badges persistants (TrophyShowcasePanel)
 * - Tier 2 (Partie Active — CK3): Traits, Titres Territoriaux & 5 Attributs de Commandant
 * - Pure tab labels (zero "et" / "&")
 */
export function ProfileHubTab() {
  const [tab, setTab] = useState<ProfileTab>('SHOWCASE');
  const world = useExoStore((s) => s.world);
  const setScreen = useExoStore((s) => s.setScreen);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
  const { isMobile, setLayoutMode } = useViewportLayout();

  const user = auth.currentUser;
  const superpower = SUPERPOWERS_CATALOG.find((s) => s.id === world.superpowerId);
  const eraInfo = ERAS_CATALOG.find((e) => e.era === world.era);
  const commander = useMemo(() => evaluateCampaignCommanderProfile(world), [world]);

  const xpTracks = [
    { label: 'Civilisation', value: world.xp.civilization, target: 300 },
    { label: 'Cabinet Présidentiel', value: world.xp.cabinet, target: 250 },
    { label: 'Super-Alliance', value: world.xp.alliance, target: 250 },
  ];

  const ck3Attributes = [
    { label: 'Diplomatie', value: commander.attributes.diplomacy, hint: 'Traités, Super-Alliance, médiations' },
    { label: 'Martial', value: commander.attributes.martial, hint: '4 Théâtres militaires, Taskforces' },
    { label: 'Intendance', value: commander.attributes.stewardship, hint: 'Quartiers 24-Hex, trésorerie, citoyens' },
    { label: 'Intrigue', value: commander.attributes.intrigue, hint: 'Cyberguerre, reconnaissance, pression civile' },
    { label: 'Érudition', value: commander.attributes.learning, hint: 'Technologies, atmosphère, philosophie' },
  ];

  return (
    <div className="space-y-4">
      <div className="exo-bento-card flex flex-wrap items-center justify-between gap-3 p-3.5">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'SHOWCASE' as const, label: 'Étendard Multi-Parties', icon: Award },
            { id: 'COMMANDER' as const, label: 'Commandant (Campagne)', icon: Crown },
            { id: 'PROGRESS' as const, label: 'Progression', icon: Shield },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                data-testid={`profile-tab-${item.id.toLowerCase()}`}
                onClick={() => setTab(item.id)}
                className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-xs font-bold ${
                  tab === item.id ? 'exo-accent-btn' : 'exo-accent-chip'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSubscreen('NONE');
              setScreen('EXO_AUTH');
            }}
            className="exo-accent-btn inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-xs font-bold"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>{user ? 'Compte Google' : 'Connecter Google'}</span>
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode(isMobile ? 'DESKTOP' : 'MOBILE')}
            className="exo-accent-chip inline-flex min-h-[40px] items-center gap-1.5 px-3 text-xs font-semibold"
          >
            {isMobile ? <Monitor className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
            <span>{isMobile ? 'Ordinateur' : 'Mobile'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSubscreen('NONE');
              setScreen('EXO_SETTINGS');
            }}
            className="exo-accent-chip inline-flex min-h-[40px] items-center gap-1.5 px-3 text-xs font-semibold"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Paramètres</span>
          </button>
        </div>
      </div>

      {tab === 'SHOWCASE' && <TrophyShowcasePanel />}

      {tab === 'COMMANDER' && (
        <div className="space-y-4">
          <div className="exo-bento-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="flex items-center gap-1.5 font-display text-sm font-bold exo-accent-text">
                  <Crown className="h-4 w-4" />
                  Hiérarchie de Campagne Active (Style CK3)
                </h3>
                <p className="text-xs exo-muted-text">
                  {superpower?.name ?? world.superpowerId} · {eraInfo?.name ?? `Ère ${world.era}`} ·{' '}
                  {formatAtmosphereStageName(world.atmosphereTier)} ({world.atmosphereProgress}%)
                </p>
              </div>
            </div>

            {/* 5 Character Attributes */}
            <div className="mt-3 grid gap-2 sm:grid-cols-5">
              {ck3Attributes.map((attr) => (
                <div key={attr.label} className="exo-surface-sub rounded-xl p-2.5 text-center">
                  <div className="font-mono text-[10px] uppercase exo-muted-text">{attr.label}</div>
                  <div className="mt-1 font-display text-xl font-black exo-accent-text">{attr.value}</div>
                  <div className="mt-0.5 text-[10px] exo-muted-text">{attr.hint}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Traits */}
            <div className="exo-bento-card space-y-2.5 p-4">
              <h4 className="flex items-center gap-1.5 font-display text-sm font-bold exo-accent-text">
                <Sparkles className="h-4 w-4" />
                Traits Souverains Actifs ({commander.traits.length})
              </h4>
              <div className="space-y-2">
                {commander.traits.map((tr) => (
                  <div key={tr.id} className="exo-surface-sub rounded-xl p-2.5 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span>{tr.label}</span>
                      <span className="font-mono text-[10px] exo-accent-2-text">{tr.category}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] exo-muted-text">{tr.bonusSummary}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Territorial Titles */}
            <div className="exo-bento-card space-y-2.5 p-4">
              <h4 className="flex items-center gap-1.5 font-display text-sm font-bold exo-accent-text">
                <Shield className="h-4 w-4" />
                Titres Territoriaux de la Partie ({commander.territorialTitles.length})
              </h4>
              <div className="space-y-2">
                {commander.territorialTitles.map((tt) => (
                  <div key={tt.id} className="exo-surface-sub rounded-xl p-2.5 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span>{tt.titleName}</span>
                      <span className="font-mono text-[10px] text-emerald-500 dark:text-emerald-300">
                        +{tt.prestigeBonus} Prestige
                      </span>
                    </div>
                    <div className="mt-0.5 font-mono text-[10.5px] exo-muted-text">
                      {tt.territoryLabel}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'PROGRESS' && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="exo-bento-card p-4">
            <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold exo-accent-text">
              <Shield className="h-4 w-4" />
              Progression Souveraine (XP)
            </h3>
            <div className="space-y-3">
              {xpTracks.map((track) => {
                const pct = Math.min(100, Math.round((track.value / track.target) * 100));
                return (
                  <div key={track.label}>
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="font-semibold">{track.label}</span>
                      <span className="exo-accent-text">
                        {track.value} / {track.target} XP
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/15 dark:bg-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--exo-accent)] to-[var(--exo-accent-2)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="exo-bento-card p-4">
            <h3 className="mb-3 font-display text-sm font-bold exo-accent-text">Indicateurs de Campagne</h3>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="exo-surface-sub rounded-lg p-2.5">
                <div className="text-[10px] exo-muted-text">Étoiles d&apos;Ère</div>
                <div className="mt-0.5 text-base font-bold exo-accent-2-text">{world.eraStars}★</div>
              </div>
              <div className="exo-surface-sub rounded-lg p-2.5">
                <div className="text-[10px] exo-muted-text">Atmosphère</div>
                <div className="mt-0.5 text-sm font-bold text-emerald-500 dark:text-emerald-300">
                  {formatAtmosphereStageName(world.atmosphereTier)} ({world.atmosphereProgress}%)
                </div>
              </div>
              <div className="exo-surface-sub rounded-lg p-2.5">
                <div className="text-[10px] exo-muted-text">Rang Alliance</div>
                <div className="mt-0.5 text-base font-bold">#{world.superAllianceRank}/6</div>
              </div>
              <div className="exo-surface-sub rounded-lg p-2.5">
                <div className="text-[10px] exo-muted-text">Secteurs</div>
                <div className="mt-0.5 text-base font-bold">{world.capturedTiles.length}/72</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
