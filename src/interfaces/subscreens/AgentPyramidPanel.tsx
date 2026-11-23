import { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  CheckCircle2,
  ChevronRight,
  GitFork,
  Layers,
  Network,
  Play,
  RotateCcw,
  Send,
  ShieldCheck,
} from 'lucide-react';
import type {
  AgentDivision,
  AgentNodeStatus,
  AgentTierLevel,
  MissionPriority,
} from '../../contracts/agent-hierarchy.schema.ts';
import {
  AGENT_DIVISION_META,
  AGENT_PYRAMID_TIERS,
  PRESET_CASCADE_DIRECTIVES,
} from '../../data/agent-hierarchy.catalog.ts';
import {
  computePyramidSummary,
  createInitialAgentPyramidState,
  dispatchHierarchicalMission,
  getDirectSubordinates,
  getEscalationChain,
  getSubordinateSubtreeIds,
  groupAgentsByLevel,
  validatePyramidIntegrity,
} from '../../systems/governance/agent-hierarchy.engine.ts';

/**
 * [L7] EXW.L7.AGENT_PYRAMID_PANEL | v5.1.0 | SADT A5.4
 * Interactive 4-Level Triangular Multi-Agent Org-Chart (1 -> 2 -> 4 -> 8 = 15 Agents):
 * - Architectural SVG Triangle Backdrop & Vector Hierarchy Connectors
 * - Highlights upstream escalation path (cyan) & downstream delegation cone (amber)
 * - Live Mission Cascade dispatcher & responsive mobile pyramid layout
 */
const STATUS_LABELS: Readonly<Record<AgentNodeStatus, { readonly label: string; readonly cls: string }>> = {
  ACTIVE: { label: 'Actif', cls: 'text-emerald-500 dark:text-emerald-300' },
  DELEGATING: { label: 'Délégation', cls: 'text-cyan-600 dark:text-cyan-300' },
  VALIDATING: { label: 'Validation', cls: 'text-amber-600 dark:text-amber-300' },
  READY: { label: 'Prêt', cls: 'exo-muted-text' },
};

const LEVEL_ROW_Y: Readonly<Record<AgentTierLevel, number>> = {
  0: 66,
  1: 184,
  2: 312,
  3: 452,
};

const LEVEL_SPAN_X: Readonly<Record<AgentTierLevel, readonly [number, number]>> = {
  0: [500, 500],
  1: [295, 705],
  2: [165, 835],
  3: [68, 932],
};

function computeNodePosition(
  level: AgentTierLevel,
  indexInLevel: number,
  totalInLevel: number,
): { readonly x: number; readonly y: number } {
  const [minX, maxX] = LEVEL_SPAN_X[level];
  const x =
    totalInLevel <= 1
      ? 500
      : minX + (indexInLevel / (totalInLevel - 1)) * (maxX - minX);
  return { x, y: LEVEL_ROW_Y[level] };
}

export function AgentPyramidPanel() {
  const [pyramid, setPyramid] = useState(() => createInitialAgentPyramidState());
  const [selectedId, setSelectedId] = useState<string>('AG-L0-ARGON');
  const [divisionFilter, setDivisionFilter] = useState<'ALL' | AgentDivision>('ALL');
  const [directiveInput, setDirectiveInput] = useState('');
  const [priority, setPriority] = useState<MissionPriority>('ELEVATED');

  const grouped = useMemo(() => groupAgentsByLevel(pyramid.nodes), [pyramid.nodes]);
  const summary = useMemo(() => computePyramidSummary(pyramid.nodes), [pyramid.nodes]);
  const integrity = useMemo(() => validatePyramidIntegrity(pyramid.nodes), [pyramid.nodes]);

  const selectedNode =
    pyramid.nodes.find((n) => n.id === selectedId) ?? pyramid.nodes[0]!;

  const escalationChain = useMemo(
    () => getEscalationChain(selectedNode.id, pyramid.nodes),
    [selectedNode.id, pyramid.nodes],
  );
  const directChildren = useMemo(
    () => getDirectSubordinates(selectedNode.id, pyramid.nodes),
    [selectedNode.id, pyramid.nodes],
  );
  const subtreeIds = useMemo(
    () => new Set(getSubordinateSubtreeIds(selectedNode.id, pyramid.nodes)),
    [selectedNode.id, pyramid.nodes],
  );
  const escalationIds = useMemo(
    () => new Set(escalationChain.map((n) => n.id)),
    [escalationChain],
  );

  // Precompute deterministic SVG coordinates for the 4-level triangle
  const nodePositions = useMemo(() => {
    const map = new Map<string, { readonly x: number; readonly y: number }>();
    ([0, 1, 2, 3] as const).forEach((lvl) => {
      const row = grouped[lvl];
      row.forEach((node, idx) => {
        map.set(node.id, computeNodePosition(lvl, idx, row.length));
      });
    });
    return map;
  }, [grouped]);

  const handleDispatch = (targetId: string, text: string, prio: MissionPriority) => {
    const trimmed = text.trim();
    if (trimmed.length < 3) return;
    setPyramid((prev) => dispatchHierarchicalMission(prev, targetId, trimmed, prio));
    setSelectedId(targetId);
    setDirectiveInput('');
  };

  return (
    <div data-testid="agent-pyramid-panel" className="space-y-4">
      {/* Header & Pyramid Telemetry */}
      <div className="exo-bento-card space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-display text-base font-bold exo-accent-text">
              <Network className="h-4 w-4" />
              Organigramme Multi-Agents en Triangle ({summary.levelsCount} Niveaux · {summary.totalAgents} Agents)
            </h3>
            <p className="mt-0.5 text-xs exo-muted-text">
              Pyramide hiérarchique stricte {summary.triangleShape.join(' → ')} : Sommet N0 · Directions N1 · Chefs de Pôle N2 · Sous-Agents d&apos;Exécution N3.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] tabular-nums">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-500 dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              {integrity.valid ? 'Structure triangulaire valide' : 'Écart hiérarchique'}
            </span>
            <span className="exo-muted-text">
              {summary.activeCount} actifs · {pyramid.totalCascades} cascades
            </span>
            <button
              type="button"
              onClick={() => {
                setPyramid(createInitialAgentPyramidState());
                setSelectedId('AG-L0-ARGON');
              }}
              className="exo-accent-chip inline-flex min-h-[36px] items-center gap-1.5 px-2.5 text-[11px] font-semibold"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>

        {/* Division Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrer la pyramide par division">
          <button
            type="button"
            onClick={() => setDivisionFilter('ALL')}
            className={`min-h-[36px] rounded-xl px-3 font-mono text-[11px] font-semibold transition ${
              divisionFilter === 'ALL' ? 'exo-accent-btn' : 'exo-accent-chip'
            }`}
          >
            Toutes divisions (15)
          </button>
          {(Object.keys(AGENT_DIVISION_META) as AgentDivision[]).map((div) => (
            <button
              key={div}
              type="button"
              data-testid={`pyramid-filter-${div.toLowerCase()}`}
              onClick={() => setDivisionFilter(div)}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 font-mono text-[11px] font-semibold transition ${
                divisionFilter === div ? 'exo-accent-btn' : 'exo-accent-chip'
              }`}
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: AGENT_DIVISION_META[div].colorHex }}
              />
              <span>{AGENT_DIVISION_META[div].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Geometric Triangle Org-Chart (SVG + 4 Tier Rows) */}
      <div className="exo-bento-card overflow-x-auto p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] exo-muted-text">
          <span>Cliquez sur n&apos;importe quel nœud pour inspecter sa chaîne d&apos;escalade (cyan) et ses sous-agents délégués (ambre).</span>
          <span className="tabular-nums">
            Pyramide N0 (1) → N1 (2) → N2 (4) → N3 (8)
          </span>
        </div>

        {/* Interactive Triangular SVG Diagram (min-width 860px on small screens with smooth scroll) */}
        <div className="relative mx-auto min-w-[820px] max-w-[1040px]">
          <svg
            viewBox="0 0 1000 520"
            className="h-auto w-full select-none"
            role="img"
            aria-label="Organigramme triangulaire à 4 niveaux de 15 agents hiérarchiques"
          >
            <defs>
              <linearGradient id="exoTriangleFill" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.14" />
                <stop offset="55%" stopColor="#a855f7" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#ffb800" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Architectural Triangle Envelope */}
            <polygon
              points="500,14 14,504 986,504"
              fill="url(#exoTriangleFill)"
              stroke="rgba(148,163,184,0.28)"
              strokeWidth="1.5"
              strokeDasharray="6 6"
            />

            {/* Horizontal Tier Guide Lines + Left Tier Labels */}
            {AGENT_PYRAMID_TIERS.map((tier) => {
              const y = LEVEL_ROW_Y[tier.level];
              return (
                <g key={tier.code}>
                  <line
                    x1="20"
                    y1={y}
                    x2="980"
                    y2={y}
                    stroke="rgba(148,163,184,0.14)"
                    strokeWidth="1"
                  />
                  <text
                    x="22"
                    y={y - 8}
                    fill="currentColor"
                    opacity="0.55"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    {tier.code} · {tier.label.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* Hierarchy Edges (Parent -> Child) */}
            {pyramid.nodes.map((node) => {
              if (!node.parentId) return null;
              const pPos = nodePositions.get(node.parentId);
              const cPos = nodePositions.get(node.id);
              if (!pPos || !cPos) return null;

              const isEscalationEdge =
                escalationIds.has(node.id) && escalationIds.has(node.parentId);
              const isDelegationEdge =
                (node.parentId === selectedNode.id || subtreeIds.has(node.parentId)) &&
                subtreeIds.has(node.id);

              const midY = pPos.y + (cPos.y - pPos.y) * 0.52;
              const stroke = isEscalationEdge
                ? '#00f0ff'
                : isDelegationEdge
                  ? '#ffb800'
                  : 'rgba(148,163,184,0.34)';
              const strokeWidth = isEscalationEdge || isDelegationEdge ? 2.6 : 1.3;

              return (
                <path
                  key={`edge-${node.parentId}-${node.id}`}
                  d={`M ${pPos.x} ${pPos.y + 26} L ${pPos.x} ${midY} L ${cPos.x} ${midY} L ${cPos.x} ${cPos.y - 26}`}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

            {/* Clickable SVG-positioned ForeignObject or Native Overlay? Use crisp HTML buttons anchored via % below! */}
          </svg>

          {/* Accessible HTML Interactive Node Buttons precisely positioned over the SVG Triangle */}
          <div className="pointer-events-none absolute inset-0">
            {pyramid.nodes.map((node) => {
              const pos = nodePositions.get(node.id);
              if (!pos) return null;
              const isSelected = node.id === selectedNode.id;
              const isEscalation = escalationIds.has(node.id);
              const isSubordinate = subtreeIds.has(node.id);
              const dimmed =
                divisionFilter !== 'ALL' &&
                node.division !== divisionFilter &&
                !isSelected;

              const widthCls =
                node.level === 0
                  ? 'w-[228px]'
                  : node.level === 1
                    ? 'w-[214px]'
                    : node.level === 2
                      ? 'w-[186px]'
                      : 'w-[106px]';

              return (
                <button
                  key={node.id}
                  type="button"
                  data-testid={`agent-node-${node.id}`}
                  onClick={() => setSelectedId(node.id)}
                  aria-pressed={isSelected}
                  style={{
                    left: `${(pos.x / 1000) * 100}%`,
                    top: `${(pos.y / 520) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    borderColor: isSelected
                      ? '#00f0ff'
                      : isEscalation
                        ? 'rgba(0, 240, 255, 0.65)'
                        : isSubordinate
                          ? 'rgba(255, 184, 0, 0.72)'
                          : undefined,
                  }}
                  className={`pointer-events-auto absolute ${widthCls} rounded-xl border bg-[var(--exo-surface)] px-2 py-1.5 text-left shadow-md transition hover:z-20 hover:scale-[1.03] ${
                    isSelected
                      ? 'z-20 ring-2 ring-cyan-400/50'
                      : 'z-10 exo-accent-border'
                  } ${dimmed ? 'opacity-35' : 'opacity-100'}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="truncate font-mono text-[9px] font-bold uppercase tracking-wide"
                      style={{ color: node.accentHex }}
                    >
                      {node.code}
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: node.accentHex }}
                    />
                  </div>
                  <div
                    className={`mt-0.5 font-display font-bold leading-tight text-[var(--exo-text)] ${
                      node.level === 3 ? 'line-clamp-2 text-[10px]' : 'truncate text-[11.5px]'
                    }`}
                  >
                    {node.level === 3 ? node.name.replace(/^Sous-Agent\s+/i, '') : node.name}
                  </div>
                  {node.level < 3 && (
                    <div className="mt-0.5 truncate font-mono text-[9px] exo-muted-text">
                      {STATUS_LABELS[node.status].label} · {node.kpiLabel}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Agent Inspector + Mission Cascade Dispatcher */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Inspector Panel */}
        <div
          data-testid="agent-inspector-card"
          className="exo-bento-card space-y-3 p-4 lg:col-span-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10.5px]">
                <span className="font-bold" style={{ color: selectedNode.accentHex }}>
                  NIVEAU {selectedNode.level} · {selectedNode.code}
                </span>
                <span className="exo-muted-text">·</span>
                <span className={STATUS_LABELS[selectedNode.status].cls}>
                  {STATUS_LABELS[selectedNode.status].label}
                </span>
                <span className="exo-muted-text">·</span>
                <span className="exo-muted-text">
                  {AGENT_DIVISION_META[selectedNode.division].label}
                </span>
              </div>
              <h4 className="mt-1 font-display text-base font-bold">{selectedNode.name}</h4>
              <p className="text-xs exo-accent-2-text">{selectedNode.roleTitle}</p>
            </div>
            <div className="text-right font-mono text-[11px] tabular-nums exo-muted-text">
              <div>{selectedNode.kpiLabel}</div>
              <div>{directChildren.length} subordonné(s) direct(s)</div>
            </div>
          </div>

          <p className="text-xs leading-relaxed exo-muted-text">{selectedNode.summary}</p>

          {/* Escalation Chain Breadcrumb (N0 -> ... -> Selected) */}
          <div className="exo-surface-sub rounded-xl p-2.5 text-xs">
            <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase exo-muted-text">
              <Layers className="h-3 w-3 exo-accent-text" />
              Chaîne Hiérarchique (Escalade N0 → N{selectedNode.level})
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {escalationChain.map((step, idx) => (
                <div key={step.id} className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedId(step.id)}
                    className={`rounded-lg px-2 py-1 font-mono text-[10.5px] font-semibold transition ${
                      step.id === selectedNode.id
                        ? 'exo-accent-btn'
                        : 'exo-accent-chip'
                    }`}
                  >
                    {step.code}
                  </button>
                  {idx < escalationChain.length - 1 && (
                    <ChevronRight className="h-3 w-3 exo-muted-text" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Active Task */}
          <div className="exo-surface-sub rounded-xl border p-2.5 text-xs exo-accent-border">
            <div className="font-mono text-[10px] uppercase exo-accent-text">Mission Active</div>
            <div className="mt-0.5 font-semibold">{selectedNode.activeTask}</div>
          </div>

          {/* Responsibilities & Owned Modules */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 font-mono text-[10px] uppercase exo-muted-text">
                Responsabilités
              </div>
              <ul className="space-y-1 text-[11.5px]">
                {selectedNode.responsibilities.map((resp) => (
                  <li key={resp} className="flex items-start gap-1.5">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500 dark:text-emerald-300" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="mb-1 font-mono text-[10px] uppercase exo-muted-text">
                Modules &amp; Périmètre Code
              </div>
              <div className="space-y-1 font-mono text-[11px]">
                {selectedNode.ownedModules.map((mod) => (
                  <div key={mod} className="exo-surface-sub truncate rounded-lg px-2 py-1">
                    {mod}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Direct Subordinates Drill-Down */}
          {directChildren.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase exo-muted-text">
                <GitFork className="h-3 w-3 exo-accent-2-text" />
                Sous-Agents Directs ({directChildren.length})
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {directChildren.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => setSelectedId(child.id)}
                    className="exo-surface-sub flex min-h-[46px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs transition exo-accent-border hover:border-[var(--exo-accent)]"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-display font-bold">{child.name}</div>
                      <div className="truncate font-mono text-[10px] exo-muted-text">
                        {child.code} · {STATUS_LABELS[child.status].label}
                      </div>
                    </div>
                    <ArrowDownRight className="h-4 w-4 shrink-0 exo-accent-2-text" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mission Cascade Console */}
        <div className="exo-bento-card flex flex-col justify-between space-y-3 p-4 lg:col-span-5">
          <div className="space-y-3">
            <div>
              <h4 className="flex items-center gap-1.5 font-display text-sm font-bold exo-accent-text">
                <Send className="h-4 w-4" />
                Orchestrer une Cascade Hiérarchique
              </h4>
              <p className="mt-0.5 text-[11.5px] exo-muted-text">
                Propage une directive depuis le sommet <strong className="text-[var(--exo-text)]">N0 Argon</strong> jusqu&apos;à{' '}
                <strong className="text-[var(--exo-text)]">{selectedNode.name}</strong> et ses sous-agents.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <div className="font-mono text-[10px] uppercase exo-muted-text">
                Directives Rapides Multi-Niveaux
              </div>
              <div className="grid gap-1.5">
                {PRESET_CASCADE_DIRECTIVES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    data-testid={`cascade-preset-${preset.targetId.toLowerCase()}`}
                    onClick={() =>
                      handleDispatch(preset.targetId, preset.directive, preset.priority)
                    }
                    className="exo-surface-sub flex min-h-[42px] items-center justify-between gap-2 rounded-xl border px-3 py-1.5 text-left text-xs transition exo-accent-border hover:border-[var(--exo-accent)]"
                  >
                    <span className="font-semibold">{preset.label}</span>
                    <Play className="h-3.5 w-3.5 shrink-0 exo-accent-text" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Directive Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDispatch(selectedNode.id, directiveInput, priority);
              }}
              className="space-y-2 border-t pt-3 exo-accent-border"
            >
              <label htmlFor="pyramid-directive-input" className="block font-mono text-[10px] uppercase exo-muted-text">
                Nouvelle directive ciblée ({selectedNode.code})
              </label>
              <input
                id="pyramid-directive-input"
                type="text"
                value={directiveInput}
                onChange={(e) => setDirectiveInput(e.target.value)}
                placeholder="Ex. Valider les 10 modèles PBR et le cache TanStack..."
                maxLength={160}
                className="min-h-[42px] w-full rounded-xl border exo-accent-border bg-[var(--exo-surface)] px-3 py-2 text-xs"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-1" role="group" aria-label="Priorité de la directive">
                  {(
                    [
                      ['STANDARD', 'Normale'],
                      ['ELEVATED', 'Haute'],
                      ['CRITICAL', 'Critique'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPriority(val)}
                      className={`min-h-[34px] rounded-lg px-2.5 font-mono text-[10px] font-semibold ${
                        priority === val ? 'exo-accent-chip-active' : 'exo-surface-sub exo-muted-text'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  data-testid="dispatch-cascade-btn"
                  disabled={directiveInput.trim().length < 3}
                  className="exo-accent-btn inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold disabled:opacity-45"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Propager</span>
                </button>
              </div>
            </form>
          </div>

          {/* Recent Cascade Journal */}
          <div className="space-y-1.5 border-t pt-3 exo-accent-border">
            <div className="font-mono text-[10px] uppercase exo-muted-text">
              Journal des Cascades ({pyramid.missions.length})
            </div>
            <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
              {pyramid.missions.map((m) => (
                <div
                  key={m.id}
                  data-testid={`cascade-log-${m.id}`}
                  className="exo-surface-sub rounded-xl p-2.5 text-[11px]"
                >
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                    <span className="font-bold exo-accent-text">{m.id}</span>
                    <span className="exo-muted-text">
                      {m.chainIds.length} niveaux · {m.priority}
                    </span>
                  </div>
                  <div className="mt-0.5 font-semibold">{m.directive}</div>
                  <div className="mt-0.5 text-[10px] exo-muted-text">{m.outcomeSummary}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
