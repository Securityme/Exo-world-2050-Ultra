import { useMemo, useState } from 'react';
import {
  CloudUpload,
  Crosshair,
  FileJson,
  Filter,
  FolderSearch,
  History,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
} from 'lucide-react';
import type { CombatReport } from '../../contracts/combat-units.schema.ts';
import type { TurnSnapshot } from '../../contracts/v4-systems.schema.ts';
import {
  downloadPickedDriveFileText,
  openGoogleDrivePicker,
} from '../../doc-sync/google-picker.service.ts';
import {
  auth,
  connectGoogleWorkspaceDocsOAuth,
  getWorkspaceAccessToken,
} from '../../services/firebase/firebase-client.ts';
import { saveTurnSnapshotToFirestore } from '../../services/firebase/firestore-archives.service.ts';
import { useExoStore } from '../../stores/game.store.ts';
import {
  formatCombatOutcomeLabel,
  parseTurnSnapshotsForCombat,
} from '../../utils/combat-snapshot-parser.ts';
import { CombatPhaseTimeline } from './CombatPhaseTimeline.tsx';

/**
 * [L7] EXW.L7.COMBAT_HISTORY_VIEWER | v4.0.0-rc.1 | SADT A5.1
 * Combat History Viewer in `src/components/world/` parsing `turn_snapshots`
 * into an interactive step-by-step 4-phase combat resolution timeline,
 * with Google Picker Drive import and Firestore snapshot archiving.
 */

type OutcomeFilter = 'ALL' | CombatReport['outcome'];

interface CombatHistoryViewerProps {
  readonly turnSnapshots?: readonly TurnSnapshot[];
  readonly combatReports?: readonly CombatReport[];
  readonly onLaunchAssault?: () => void;
}

export function CombatHistoryViewer({
  turnSnapshots,
  combatReports = [],
  onLaunchAssault,
}: CombatHistoryViewerProps) {
  const campaignId = useExoStore((s) => s.world?.campaignId ?? null);
  const [filter, setFilter] = useState<OutcomeFilter>('ALL');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [customJson, setCustomJson] = useState('');
  const [activeCustomJson, setActiveCustomJson] = useState<string | null>(null);
  const [driveNotice, setDriveNotice] = useState<string | null>(null);
  const [busyDrive, setBusyDrive] = useState(false);

  const parsed = useMemo(() => {
    if (activeCustomJson !== null) {
      return parseTurnSnapshotsForCombat(activeCustomJson, []);
    }
    return parseTurnSnapshotsForCombat(turnSnapshots ?? [], combatReports);
  }, [activeCustomJson, turnSnapshots, combatReports]);

  const filtered = useMemo(
    () =>
      filter === 'ALL'
        ? parsed.engagements
        : parsed.engagements.filter((e) => e.outcome === filter),
    [parsed.engagements, filter],
  );

  const activeEngagement =
    filtered.find((e) => e.key === selectedKey) ?? filtered[0] ?? null;

  const handleApplyJson = () => {
    setActiveCustomJson(customJson.trim() ? customJson : null);
    setSelectedKey(null);
  };

  const handleResetLive = () => {
    setActiveCustomJson(null);
    setCustomJson('');
    setSelectedKey(null);
    setDriveNotice(null);
    setImportOpen(false);
  };

  const handleImportFromGooglePicker = async () => {
    setBusyDrive(true);
    setDriveNotice(null);
    let token = getWorkspaceAccessToken();
    if (!token) {
      const [authErr, authData] = await connectGoogleWorkspaceDocsOAuth();
      if (authErr || !authData) {
        setBusyDrive(false);
        setDriveNotice(authErr?.message ?? 'Connexion Google Drive annulée.');
        return;
      }
      token = authData.accessToken;
    }

    const [pickErr, picked] = await openGoogleDrivePicker({
      title: 'Importer un export JSON turn_snapshots depuis Google Drive',
      mimeTypes: 'application/json,text/plain',
      accessToken: token,
    });
    if (pickErr) {
      setBusyDrive(false);
      setDriveNotice(pickErr.message);
      return;
    }
    if (!picked) {
      setBusyDrive(false);
      return;
    }

    const [dlErr, rawText] = await downloadPickedDriveFileText(picked, token);
    setBusyDrive(false);
    if (dlErr || !rawText) {
      setDriveNotice(dlErr?.message ?? 'Lecture du fichier Drive impossible.');
      return;
    }
    setCustomJson(rawText);
    setActiveCustomJson(rawText);
    setSelectedKey(null);
    setDriveNotice(`Import Google Picker réussi : « ${picked.name} ».`);
  };

  const handleArchiveLatestToCloud = async () => {
    const latest = turnSnapshots?.[0];
    if (!latest || !campaignId) return;
    setBusyDrive(true);
    const [errSave, docId] = await saveTurnSnapshotToFirestore(campaignId, latest);
    setBusyDrive(false);
    if (errSave || !docId) {
      setDriveNotice(errSave?.message ?? 'Archivage Firestore refusé.');
      return;
    }
    setDriveNotice(`Snapshot Tour ${latest.cycle} archivé dans Firestore (${docId}).`);
  };

  return (
    <section
      className="exo-bento-card space-y-4 p-4"
      aria-label="Historique tactique des combats"
      data-testid="combat-history-viewer"
    >
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-300">
            <History className="h-3.5 w-3.5" />
            <span>
              Analyseur turn_snapshots · {parsed.metrics.snapshotsScanned} snapshot(s) scanné(s)
              {activeCustomJson !== null ? ' (Import JSON)' : ''}
            </span>
          </div>
          <h3 className="mt-0.5 font-display text-base font-bold text-[#1f1224] dark:text-rose-50">
            Historique Tactique des Combats · Timeline 4 Phases
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {onLaunchAssault && (
            <button
              type="button"
              onClick={onLaunchAssault}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-rose-600 px-3 text-xs font-bold text-white shadow-xs hover:bg-rose-500"
            >
              <Crosshair className="h-3.5 w-3.5" />
              <span>Nouvel assaut 4 phases</span>
            </button>
          )}
          <button
            type="button"
            disabled={busyDrive}
            onClick={() => void handleImportFromGooglePicker()}
            data-testid="combat-picker-import-btn"
            className="exo-accent-chip inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold disabled:opacity-50"
          >
            <FolderSearch className="h-3.5 w-3.5 exo-accent-text" />
            <span>Google Picker</span>
          </button>
          {auth.currentUser && campaignId && turnSnapshots && turnSnapshots.length > 0 && (
            <button
              type="button"
              disabled={busyDrive}
              onClick={() => void handleArchiveLatestToCloud()}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50/90 px-2.5 text-xs font-semibold text-emerald-900 hover:border-emerald-500 disabled:opacity-50 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100"
            >
              <CloudUpload className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
              <span>Archiver Cloud</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setImportOpen((v) => !v)}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-900 hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
          >
            <FileJson className="h-3.5 w-3.5 text-rose-600 dark:text-rose-300" />
            <span>{importOpen ? 'Masquer JSON' : 'Parser turn_snapshots'}</span>
          </button>
          {activeCustomJson !== null && (
            <button
              type="button"
              onClick={handleResetLive}
              className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-2.5 text-xs font-semibold text-amber-900 hover:border-amber-500 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Direct</span>
            </button>
          )}
        </div>
      </div>

      {driveNotice && (
        <div className="rounded-lg border border-fuchsia-200 bg-fuchsia-50/80 px-3 py-1.5 font-mono text-[11px] text-fuchsia-900 dark:border-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-100">
          {driveNotice}
        </div>
      )}

      {/* Optional turn_snapshots JSON Parser Drawer */}
      {importOpen && (
        <div className="space-y-2 rounded-xl border border-rose-200/80 bg-rose-50/60 p-3 dark:border-rose-900/60 dark:bg-rose-950/35">
          <label className="block text-xs font-semibold text-[#1f1224] dark:text-rose-100">
            Collez un tableau JSON <code className="font-mono text-rose-700 dark:text-rose-300">turn_snapshots</code> (camelCase ou snake_case) :
            <textarea
              value={customJson}
              onChange={(e) => setCustomJson(e.target.value)}
              rows={4}
              placeholder='[{"cycle":2,"state_hash":"a1b2c3d4","combat_reports":[...]}]'
              className="mt-1.5 w-full rounded-lg border border-rose-200 bg-white p-2 font-mono text-[11px] text-[#1f1224] dark:border-rose-800 dark:bg-[#140a1a] dark:text-rose-50"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-2">
            {parsed.parseError ? (
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                {parsed.parseError}
              </span>
            ) : (
              <span className="font-mono text-[10.5px] text-rose-900/70 dark:text-rose-200/70">
                Déduplication automatique par orderId + hash SHA-256.
              </span>
            )}
            <button
              type="button"
              onClick={handleApplyJson}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-rose-600 px-3 font-mono text-xs font-bold text-white hover:bg-rose-500"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Analyser le JSON</span>
            </button>
          </div>
        </div>
      )}

      {/* Compact Metrics Strip */}
      <div className="grid grid-cols-2 gap-2 font-mono text-xs sm:grid-cols-4">
        <div className="rounded-xl border border-rose-200/80 bg-white/85 px-3 py-2 dark:border-rose-900/60 dark:bg-[#190d1f]">
          <div className="text-[10px] uppercase text-rose-900/65 dark:text-rose-200/65">Engagements</div>
          <div className="mt-0.5 text-sm font-bold text-[#1f1224] dark:text-rose-50">
            {parsed.metrics.totalBattles} combat(s)
          </div>
        </div>
        <div className="rounded-xl border border-emerald-300/70 bg-emerald-500/8 px-3 py-2 dark:border-emerald-800/60 dark:bg-emerald-950/30">
          <div className="text-[10px] uppercase text-emerald-900/75 dark:text-emerald-300/75">Conquêtes</div>
          <div className="mt-0.5 text-sm font-bold text-emerald-800 dark:text-emerald-200">
            {parsed.metrics.capturedCount} / {parsed.metrics.totalBattles}
          </div>
        </div>
        <div className="rounded-xl border border-fuchsia-300/70 bg-fuchsia-500/8 px-3 py-2 dark:border-fuchsia-800/60 dark:bg-fuchsia-950/30">
          <div className="text-[10px] uppercase text-fuchsia-900/75 dark:text-fuchsia-300/75">Paralysies Cyber</div>
          <div className="mt-0.5 text-sm font-bold text-fuchsia-900 dark:text-fuchsia-200">
            {parsed.metrics.cyberParalysisCount} op(s)
          </div>
        </div>
        <div className="rounded-xl border border-amber-300/70 bg-amber-500/8 px-3 py-2 dark:border-amber-800/60 dark:bg-amber-950/30">
          <div className="text-[10px] uppercase text-amber-900/75 dark:text-amber-300/75">Étoiles Stratège</div>
          <div className="mt-0.5 text-sm font-bold text-amber-900 dark:text-amber-200">
            +{parsed.metrics.totalMilitaryStars}★
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Filter className="h-3.5 w-3.5 text-rose-600 dark:text-rose-300" />
        {(
          [
            ['ALL', `Tous (${parsed.metrics.totalBattles})`],
            ['CAPTURED', `Capturés (${parsed.metrics.capturedCount})`],
            ['REPELLED', `Repoussés (${parsed.metrics.repelledCount})`],
            ['STALEMATE', `Statu quo (${parsed.metrics.stalemateCount})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`min-h-[32px] rounded-lg border px-2.5 font-mono text-[11px] font-semibold transition ${
              filter === id
                ? 'border-rose-500 bg-rose-600 text-white'
                : 'border-rose-200 bg-white/85 text-rose-900 hover:border-rose-400 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Split Master-Detail: Engagements List + 4-Phase Timeline */}
      {activeEngagement ? (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-2 lg:col-span-4">
            {filtered.map((eng) => {
              const selected = eng.key === activeEngagement.key;
              return (
                <button
                  key={eng.key}
                  type="button"
                  onClick={() => setSelectedKey(eng.key)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selected
                      ? 'border-rose-500 bg-rose-500/12 shadow-xs dark:border-rose-400 dark:bg-rose-500/20'
                      : 'border-rose-200/80 bg-white/85 hover:border-rose-400 dark:border-rose-900/60 dark:bg-[#190d1f]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                    <span className="font-bold text-rose-700 dark:text-rose-300">
                      Tour {eng.cycleResolved}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-bold ${
                        eng.outcome === 'CAPTURED'
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                          : eng.outcome === 'REPELLED'
                            ? 'bg-rose-500/15 text-rose-800 dark:text-rose-200'
                            : 'bg-amber-500/15 text-amber-900 dark:text-amber-200'
                      }`}
                    >
                      {formatCombatOutcomeLabel(eng.outcome)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 font-display text-xs font-bold text-[#1f1224] dark:text-rose-50">
                    <Swords className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-300" />
                    <span className="truncate">{eng.targetZoneName}</span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-rose-900/70 dark:text-rose-200/70">
                    Dégâts +{eng.totalAttackerDamage.toFixed(0)} · Pertes -{eng.attackerLosses}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-3.5 lg:col-span-8 dark:border-rose-900/50 dark:bg-rose-950/20">
            <CombatPhaseTimeline engagement={activeEngagement} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-rose-300/80 bg-rose-50/40 px-4 py-8 text-center dark:border-rose-800/70 dark:bg-rose-950/25">
          <Shield className="h-7 w-7 text-rose-500/75 dark:text-rose-300/75" />
          <p className="mt-2 font-display text-sm font-bold text-[#1f1224] dark:text-rose-50">
            Aucun engagement correspondant dans les snapshots analysés
          </p>
          <p className="mt-1 max-w-md text-xs text-rose-900/70 dark:text-rose-200/70">
            Lancez un ordre de conquête tactique en 4 phases ou importez un export JSON <code className="font-mono">turn_snapshots</code> pour inspecter la chronologie des phases.
          </p>
        </div>
      )}
    </section>
  );
}
