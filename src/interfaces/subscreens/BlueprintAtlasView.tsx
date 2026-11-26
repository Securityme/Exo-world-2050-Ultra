import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Download,
  FileCode2,
  GitBranch,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { M0_MANIFEST, M13_MANIFEST } from '../../data/blueprint-manifests.data.ts';
import { NF_AFNOR_DMTSW_NORMS_CATALOG } from '../../data/skills-vcs.catalog.ts';
import {
  evaluateMatrixArchitecture,
  renderBlueprintMarkdown,
  renderBlueprintYaml,
  type LayerCode,
} from '../../services/architecture/matrix-engine.ts';

type AtlasTab = 'MATRICES' | 'SADT_DUAL' | 'SRC_MAP' | 'NF_AFNOR' | 'EXPORT_PROMPT';

const LAYERS: readonly ('ALL' | LayerCode)[] = ['ALL', 'L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'];

function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * [L7] EXW.ATLAS.BLUEPRINT | v4.0.0-rc.1 | SADT A5.3
 * Interactive Master Blueprint Atlas:
 * - Live matrix-engine.ts evaluation (M0..M15, Kahn DSM 0 cycles, Release Gate GO/NO-GO)
 * - Layer filter L0..L8, Dual M13-A / M13-D view, SRC 1:1 SemVer/GATE table
 * - 1-click MD / YAML / JSON export + 1-click @Google Drive Tri-Format prompt copy
 */
export function BlueprintAtlasView() {
  const [tab, setTab] = useState<AtlasTab>('MATRICES');
  const [layerFilter, setLayerFilter] = useState<'ALL' | LayerCode>('ALL');
  const [copiedMsg, setCopiedMsg] = useState<string | null>(null);
  const [promptFmt, setPromptFmt] = useState<'FMT-S' | 'FMT-U' | 'FMT-M'>('FMT-S');

  const report = useMemo(() => evaluateMatrixArchitecture(M0_MANIFEST, M13_MANIFEST), []);

  const filteredMatrices = useMemo(
    () =>
      layerFilter === 'ALL'
        ? report.matrices
        : report.matrices.filter((m) => m.layers.includes(layerFilter)),
    [report.matrices, layerFilter],
  );

  const filteredSrc = useMemo(
    () =>
      layerFilter === 'ALL'
        ? M13_MANIFEST.srcMappings
        : M13_MANIFEST.srcMappings.filter((s) => s.layer === layerFilter),
    [layerFilter],
  );

  const generatedPrompt = useMemo(
    () => renderBlueprintMarkdown(M0_MANIFEST, M13_MANIFEST, report, promptFmt),
    [report, promptFmt],
  );

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopiedMsg(`Prompt ${promptFmt} copié pour @Google Drive / Antigravity`);
      window.setTimeout(() => setCopiedMsg(null), 2600);
    } catch {
      setCopiedMsg('Copie bloquée par le navigateur — utilisez le bouton Export MD.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Gate Banner */}
      <div className="exo-bento-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-300">
              {M0_MANIFEST.specStandard}
            </div>
            <h2 className="mt-0.5 font-display text-lg font-bold text-[#1f1224] dark:text-rose-50">
              Atlas Master Blueprint · {report.rootId}@{report.rootSemver}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-xs font-bold ${
                report.gate === 'GO'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-200'
                  : 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/25 dark:text-rose-200'
              }`}
            >
              {report.gate === 'GO' ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
              GATE : {report.gate} ({report.scorePct}%)
            </span>
            <span className="rounded-xl border border-rose-200 bg-white/80 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
              DSM : {report.dsmCycleCount} cycle · {M13_MANIFEST.srcMappings.length} modules SRC
            </span>
          </div>
        </div>

        {/* Navigation + Layer Filters */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-rose-200/70 pt-3 dark:border-rose-900/50">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['MATRICES', 'Matrices M0–M15', Layers],
                ['SADT_DUAL', 'Dualité M13-A / D1–D2', GitBranch],
                ['SRC_MAP', 'Cartographie SRC L0–L8', FileCode2],
                ['NF_AFNOR', 'Conformité NF / AFNOR & DMT-SW', ShieldCheck],
                ['EXPORT_PROMPT', 'Prompt @Google Drive & Exports', Sparkles],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition ${
                  tab === id
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'border border-rose-200 bg-white/85 text-rose-900 hover:border-rose-400 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {LAYERS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLayerFilter(l)}
                className={`rounded-lg px-2 py-1 font-mono text-[10.5px] font-bold transition ${
                  layerFilter === l
                    ? 'bg-amber-500 text-white'
                    : 'border border-rose-200/80 bg-white/75 text-rose-900/80 hover:border-rose-400 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB 1: All 16 Matrices M0..M15 */}
      {tab === 'MATRICES' && (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredMatrices.map((m) => (
            <div key={m.id} className="exo-bento-card p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-300">
                    {m.id} · {m.code} · {m.iso}
                  </span>
                  <h3 className="font-display text-sm font-bold text-[#1f1224] dark:text-rose-50">
                    {m.title}
                  </h3>
                </div>
                <span
                  className={`rounded-lg px-2 py-0.5 font-mono text-[10px] font-bold ${
                    m.status === 'PASS'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {m.status}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-rose-950/80 dark:text-rose-200/80">{m.summary}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 border-t border-rose-200/60 pt-2 font-mono text-[10.5px] dark:border-rose-900/50">
                <span className="font-semibold text-rose-700 dark:text-rose-300">{m.metric}</span>
                <span className="text-rose-900/60 dark:text-rose-200/60">{m.layers.join(' · ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: SADT Dual M13-A */}
      {tab === 'SADT_DUAL' && (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {M13_MANIFEST.d1Boxes.map((box) => (
              <div key={box.id} className="exo-bento-card p-3.5 text-xs">
                <div className="font-mono text-[10px] font-bold uppercase text-rose-600 dark:text-rose-300">
                  SADT D1 · {box.id} · {box.domain}
                </div>
                <h3 className="mt-0.5 font-display text-sm font-bold text-[#1f1224] dark:text-rose-50">
                  {box.title}
                </h3>
                <div className="mt-2 space-y-1 text-[11px] text-rose-950/85 dark:text-rose-200/80">
                  <div><strong>I:</strong> {box.icom.inputs.join(', ')}</div>
                  <div><strong>C:</strong> {box.icom.controls.join(', ')}</div>
                  <div><strong>O:</strong> {box.icom.outputs.join(', ')}</div>
                  <div><strong>M:</strong> {box.icom.mechanisms.join(', ')}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="exo-bento-card p-3.5">
            <div className="font-mono text-[10px] font-bold uppercase text-rose-600 dark:text-rose-300">
              Datagrammes D1..D5 & 15 Sous-boîtes D2
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {M13_MANIFEST.d2SubBoxes.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-xl border border-rose-200/70 bg-white/80 p-2.5 text-[11px] dark:border-rose-900/60 dark:bg-[#190d1f]"
                >
                  <div className="flex items-center justify-between font-mono text-[10px] font-bold text-rose-700 dark:text-rose-300">
                    <span>{sub.id} ({sub.layer})</span>
                    <span>{sub.datagrams.join(', ')}</span>
                  </div>
                  <div className="mt-0.5 font-semibold text-[#1f1224] dark:text-rose-50">{sub.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Interactive SRC 1:1 Map */}
      {tab === 'SRC_MAP' && (
        <div className="exo-bento-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-rose-200/70 px-4 py-2.5 dark:border-rose-900/50">
            <span className="font-mono text-xs font-bold text-[#1f1224] dark:text-rose-50">
              Cartographie 1:1 SRC ({filteredSrc.length} fichiers)
            </span>
            <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
              Synchro M13-D · 0 non-mappé
            </span>
          </div>
          <div className="max-h-[420px] overflow-y-auto divide-y divide-rose-200/50 dark:divide-rose-900/40">
            {filteredSrc.map((mod) => (
              <div
                key={mod.path}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 font-mono text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-rose-500/15 px-1.5 py-0.5 font-bold text-rose-700 dark:text-rose-300">
                    {mod.layer}
                  </span>
                  <span className="text-rose-900/60 dark:text-rose-300/70">{mod.sadtBox}</span>
                  <span className="text-[#1f1224] dark:text-rose-50">{mod.path}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-rose-900/70 dark:text-rose-200/70">v{mod.semver}</span>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    {mod.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: NF / AFNOR & DMT-SW Compliance Matrix */}
      {tab === 'NF_AFNOR' && (
        <div className="space-y-3" data-testid="atlas-nf-afnor-panel">
          <div className="exo-bento-card p-4 text-xs">
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider exo-accent-text">
              DMT-SW · Référentiel Normatif NF / AFNOR &amp; SSoT
            </div>
            <p className="mt-1 exo-muted-text">
              Traçabilité bidirectionnelle entre exigences (FUP-001..018 / R-01..69), architecture en 9 couches L0..L8, tests SHA-256 et Master Blueprint v2.14.0-MAITRE (Unity 6 URP Principal + Aperçu Three.js · OPT-02 A+ · Dossier /docs unifié).
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {NF_AFNOR_DMTSW_NORMS_CATALOG.map((row) => (
              <div key={row.code} className="exo-bento-card p-3.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-[10.5px] font-bold exo-accent-text">{row.code}</div>
                    <h3 className="font-display text-sm font-bold text-[var(--exo-text)]">{row.normTitle}</h3>
                  </div>
                  <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    {row.status}
                  </span>
                </div>
                <p className="mt-1.5 exo-muted-text">{row.scope}</p>
                <div className="mt-2 border-t exo-accent-border pt-2 font-mono text-[10.5px] text-[var(--exo-text)]">
                  Preuve : {row.evidence}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Tri-Format @Google Drive Prompt & Exports */}
      {tab === 'EXPORT_PROMPT' && (
        <div className="exo-bento-card space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1.5">
              {(['FMT-S', 'FMT-U', 'FMT-M'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setPromptFmt(fmt)}
                  className={`rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold ${
                    promptFmt === fmt
                      ? 'bg-rose-600 text-white'
                      : 'border border-rose-200 bg-white/80 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 text-xs font-bold text-white hover:bg-rose-500"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copier Prompt @Google Drive</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    `MASTER_BLUEPRINT_${promptFmt}_v4.0.0-rc.1.md`,
                    generatedPrompt,
                    'text/markdown',
                  )
                }
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-rose-200 bg-white/90 px-3 text-xs font-semibold text-rose-900 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
              >
                <Download className="h-3.5 w-3.5" />
                <span>MD</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    'MASTER_BLUEPRINT_v4.0.0-rc.1.yaml',
                    renderBlueprintYaml(M0_MANIFEST, report),
                    'text/yaml',
                  )
                }
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-rose-200 bg-white/90 px-3 text-xs font-semibold text-rose-900 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
              >
                <Download className="h-3.5 w-3.5" />
                <span>YAML</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    'MASTER_BLUEPRINT_v4.0.0-rc.1.json',
                    JSON.stringify({ m0: M0_MANIFEST, m13: M13_MANIFEST, report }, null, 2),
                    'application/json',
                  )
                }
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-rose-200 bg-white/90 px-3 text-xs font-semibold text-rose-900 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
              >
                <Download className="h-3.5 w-3.5" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {copiedMsg && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 px-3 py-2 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
              {copiedMsg}
            </div>
          )}

          <pre className="max-h-[380px] overflow-auto rounded-xl border border-rose-200/80 bg-rose-50/60 p-3 font-mono text-[11px] leading-relaxed text-[#1f1224] dark:border-rose-900/60 dark:bg-[#140a1a] dark:text-rose-100">
            {generatedPrompt}
          </pre>
        </div>
      )}
    </div>
  );
}
