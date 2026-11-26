import { useEffect, useState } from 'react';
import { FileCode2, RefreshCw, Save } from 'lucide-react';
import type { DevBridgeState, TriSurfaceSyncLog } from '../../contracts/dev-bridge.schema.ts';
import type { DocVcsStoreState } from '../../contracts/skills-vcs.schema.ts';
import { connectGoogleWorkspaceDocsOAuth, getWorkspaceAccessToken, testFirestoreConnection } from '../../services/firebase/firebase-client.ts';
import { executeTriSurfaceSave, fetchDevBridgeState, getGithubSessionAuth, postDevCommsMessage, readWorkspaceTextFile, runDataAgentLiveAudit, setGithubSessionTokenInMemory, startGithubOAuthPopup, triggerVercelDeployHook } from '../../services/governance/dev-bridge.service.ts';
import { sanitizeWorkspaceRelativePath } from '../../systems/governance/dev-bridge.engine.ts';
import { DevCommsBusPanel } from './DevCommsBusPanel.tsx';
import { DevConnectorsStrip } from './DevConnectorsStrip.tsx';
import { DevDataVercelCard } from './DevDataVercelCard.tsx';
import { TriSurfaceSaveModal } from './TriSurfaceSaveModal.tsx';

interface DevConnectivityPanelProps {
  readonly vcsState: DocVcsStoreState;
}

const PRESET_PATHS = [
  'docs/inter-ia/BUS_MESSAGES.md',
  'docs/DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md',
  'docs/master-blueprint/M0_MetaSemVer.json',
  '.exo-sync/agent-handoff.md',
] as const;

/**
 * [L7] EXW.L7.DEV_CONNECTIVITY_PANEL | v5.1.0 | <= 200 lines (R-14)
 */
export function DevConnectivityPanel({ vcsState }: DevConnectivityPanelProps) {
  const [bridge, setBridge] = useState<DevBridgeState | null>(null);
  const [relativePath, setRelativePath] = useState<string>(PRESET_PATHS[0]);
  const [fileContent, setFileContent] = useState<string>('# Note Multi-Surfaces EXO WORLD : 2050\n\nSynchronisée entre AI Studio, Drive et GitHub.\n');
  const [commitSummary, setCommitSummary] = useState('sync: mise à jour multi-surfaces EXO-DEV');
  const [driveConnected, setDriveConnected] = useState(() => Boolean(getWorkspaceAccessToken()));
  const [ghAuth, setGhAuth] = useState(() => getGithubSessionAuth());
  const [showPatBox, setShowPatBox] = useState(false);
  const [patInput, setPatInput] = useState('');
  const [firebaseOk, setFirebaseOk] = useState<boolean | null>(null);
  const [vercelHookInput, setVercelHookInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastSync, setLastSync] = useState<TriSurfaceSyncLog | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    void fetchDevBridgeState().then(setBridge);
    void testFirestoreConnection().then(setFirebaseOk);
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith('.run.app') && !event.origin.includes('localhost')) return;
      const data = event.data as { type?: string; accessToken?: string; login?: string; error?: string } | null;
      if (data?.type === 'GITHUB_OAUTH_SUCCESS' && data.accessToken) {
        setGithubSessionTokenInMemory(data.accessToken, data.login ?? 'github-oauth');
        setGhAuth(getGithubSessionAuth());
        setFeedback(`GitHub connecté via OAuth (${data.login ?? 'compte'}).`);
      } else if (data?.type === 'GITHUB_OAUTH_ERROR' && data.error) {
        setFeedback(`OAuth GitHub : ${data.error}`);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const handleLoadWorkspace = async (pathToLoad: string) => {
    setBusy(true);
    const res = await readWorkspaceTextFile(pathToLoad);
    if (res.ok && res.content !== undefined) {
      setRelativePath(pathToLoad);
      setFileContent(res.content);
      setFeedback(`Fichier local chargé : ${pathToLoad}`);
    } else {
      setFeedback(res.error ?? 'Fichier local non trouvé (sera créé à l’enregistrement).');
    }
    setBusy(false);
  };

  const handleConnectGithub = async () => {
    setBusy(true);
    const res = await startGithubOAuthPopup();
    setBusy(false);
    if (res.ok && res.url) {
      const popup = window.open(res.url, 'github_oauth_popup', 'width=620,height=720');
      if (!popup) {
        setShowPatBox(true);
        setFeedback('Popup bloquée : utilisez le jeton session mémoire ci-dessous.');
      }
      return;
    }
    setShowPatBox(true);
    setFeedback(res.error ?? 'OAuth GitHub indisponible : utilisez le jeton session mémoire.');
  };

  const handleConfirmSave = async () => {
    const pathCheck = sanitizeWorkspaceRelativePath(relativePath);
    if (!pathCheck.ok) {
      setConfirmOpen(false);
      setFeedback(pathCheck.error ?? 'Chemin invalide.');
      return;
    }
    setBusy(true);
    const res = await executeTriSurfaceSave({ relativePath: pathCheck.normalized, content: fileContent, commitSummary: commitSummary.trim() || `sync: ${pathCheck.normalized}` });
    setLastSync(res.log);
    if (res.nextState) setBridge(res.nextState);
    setConfirmOpen(false);
    setBusy(false);
    setFeedback(`Synchronisation tri-surface terminée pour ${pathCheck.normalized}.`);
  };

  const handleRunAudit = async () => {
    setBusy(true);
    const res = await runDataAgentLiveAudit();
    if (res.state) setBridge(res.state);
    setFeedback(res.ok && res.diagnostics ? `Data Agent Kit : ${res.diagnostics.gate} · ${res.diagnostics.modulesCount} modules · ${res.diagnostics.dsmCycleCount} cycles.` : (res.error ?? 'Échec Data Agent Kit.'));
    setBusy(false);
  };

  const handleTriggerVercel = async () => {
    setBusy(true);
    const res = await triggerVercelDeployHook({ hookUrl: vercelHookInput || undefined });
    if (res.state) setBridge(res.state);
    setFeedback(res.ok ? `Vercel Deploy Hook déclenché (${res.jobId ?? 'OK'}).` : (res.error ?? 'Erreur Vercel.'));
    setBusy(false);
  };

  const handleApplyPat = () => {
    setGithubSessionTokenInMemory(patInput, 'session-pat');
    setGhAuth(getGithubSessionAuth());
    setPatInput('');
    setShowPatBox(false);
    setFeedback('Jeton GitHub enregistré en mémoire vive uniquement.');
  };

  const handleConnectDrive = async () => {
    setBusy(true);
    const [err] = await connectGoogleWorkspaceDocsOAuth();
    setDriveConnected(Boolean(getWorkspaceAccessToken()));
    setFeedback(err ? err.message : 'Google Drive & Docs connecté en mémoire de session.');
    setBusy(false);
  };

  const pathValidation = sanitizeWorkspaceRelativePath(relativePath);

  return (
    <div className="space-y-4 text-xs" data-testid="dev-connectivity-wing">
      <DevConnectorsStrip
        driveConnected={driveConnected} githubConnected={ghAuth.connected} githubLogin={ghAuth.login}
        firebaseOk={firebaseOk} vercelHookConfigured={Boolean(bridge?.vercelHookConfigured)}
        lastAudit={bridge?.lastAudit ?? null} showPatBox={showPatBox} patInput={patInput}
        onPatInputChange={setPatInput} onApplyPat={handleApplyPat}
        onConnectDrive={() => void handleConnectDrive()} onConnectGithub={() => void handleConnectGithub()}
        onTestFirebase={() => void testFirestoreConnection().then(setFirebaseOk)}
        onRunAudit={() => void handleRunAudit()} onTriggerVercel={() => void handleTriggerVercel()}
      />

      {feedback && (
        <div className="rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-3 py-2 text-cyan-100" data-testid="dev-bridge-feedback">{feedback}</div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="exo-bento-card space-y-3 p-3.5 lg:col-span-7" data-testid="tri-surface-editor-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-display text-sm font-bold text-[var(--exo-text)]"><FileCode2 className="h-4 w-4 exo-accent-text" /><span>Enregistrement Direct · AI Studio + Drive + GitHub</span></div>
            <span className="font-mono text-[10.5px] exo-muted-text tabular-nums">{vcsState.docs.length} docs VCS · {bridge?.syncLogs.length ?? 0} syncs</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_PATHS.map((p) => (
              <button key={p} type="button" onClick={() => void handleLoadWorkspace(p)} className={`min-h-[34px] rounded-lg px-2.5 font-mono text-[10.5px] whitespace-nowrap shrink-0 ${relativePath === p ? 'exo-window-tab-active font-bold' : 'exo-accent-chip'}`}>{p.split('/').pop()}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={relativePath} onChange={(e) => setRelativePath(e.target.value)} data-testid="tri-surface-path-input" aria-label="Chemin relatif du fichier" className="min-h-[42px] flex-1 rounded-xl border exo-accent-border bg-[var(--exo-surface)] px-3 font-mono text-xs text-[var(--exo-text)]" />
            <button type="button" onClick={() => void handleLoadWorkspace(relativePath)} disabled={busy} className="exo-accent-chip inline-flex min-h-[42px] items-center gap-1.5 px-3 font-semibold whitespace-nowrap shrink-0"><RefreshCw className="h-3.5 w-3.5" /><span>Charger</span></button>
          </div>
          {!pathValidation.ok && <div className="text-[11px] text-rose-300">{pathValidation.error}</div>}
          <textarea value={fileContent} onChange={(e) => setFileContent(e.target.value)} rows={8} data-testid="tri-surface-content-textarea" aria-label="Contenu du fichier multi-surfaces" className="w-full rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-3 font-mono text-[11.5px] text-[var(--exo-text)]" />
          <div className="flex flex-wrap gap-2">
            <input type="text" value={commitSummary} onChange={(e) => setCommitSummary(e.target.value)} placeholder="Résumé du commit multi-surfaces..." data-testid="tri-surface-summary-input" aria-label="Résumé du commit" className="min-h-[44px] min-w-[200px] flex-1 rounded-xl border exo-accent-border bg-[var(--exo-surface)] px-3 text-xs text-[var(--exo-text)]" />
            <button type="button" onClick={() => setConfirmOpen(true)} disabled={busy || !pathValidation.ok || fileContent.trim().length === 0} data-testid="tri-surface-save-btn" className="exo-window-tab-active inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 font-bold whitespace-nowrap shrink-0"><Save className="h-4 w-4" /><span>Enregistrer (AI Studio + Drive + GitHub)</span></button>
          </div>
          {lastSync && (
            <div className="space-y-1 rounded-xl border exo-accent-border bg-[var(--exo-surface-alt)] p-3 font-mono text-[11]" data-testid="tri-surface-last-result">
              <div className="font-semibold text-[var(--exo-text)]">Dernière exécution · {lastSync.relativePath}</div>
              <div>AI Studio : {lastSync.aiStudio.status} · {lastSync.aiStudio.detail}</div>
              <div>Drive : {lastSync.drive.status} · {lastSync.drive.detail}</div>
              <div>GitHub : {lastSync.github.status} · {lastSync.github.detail}</div>
            </div>
          )}
        </div>
        <div className="space-y-4 lg:col-span-5">
          <DevCommsBusPanel messages={bridge?.messages ?? []} activePath={relativePath} busy={busy} onSendMessage={async (input) => { setBusy(true); const res = await postDevCommsMessage(input); if (res.state) setBridge(res.state); else if (res.error) setFeedback(res.error); setBusy(false); }} />
          <DevDataVercelCard firebaseOk={firebaseOk} lastAudit={bridge?.lastAudit ?? null} vercelHookInput={vercelHookInput} busy={busy} onVercelHookInputChange={setVercelHookInput} onTriggerVercel={() => void handleTriggerVercel()} />
        </div>
      </div>

      <TriSurfaceSaveModal open={confirmOpen} relativePath={relativePath} byteLength={fileContent.length} commitSummary={commitSummary.trim() || `sync: ${relativePath}`} driveConnected={driveConnected} githubConnected={ghAuth.connected} githubLogin={ghAuth.login} busy={busy} onCancel={() => setConfirmOpen(false)} onConfirm={() => void handleConfirmSave()} />
    </div>
  );
}
