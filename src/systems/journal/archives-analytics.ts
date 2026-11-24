import type { WorldState } from '../../contracts/world-state.schema.ts';

/**
 * [L3] EXW.L3.ARCHIVES_ANALYTICS | v5.1.0 | SADT A3.1
 * Pure deterministic analytics, replay timeline builder, CSV/HTML report formatters,
 * and multi-campaign comparison logic for the Journal Archives Suite.
 * Zero DOM / IO / Math.random / Date.now.
 */
export interface CampaignSummaryEntry {
  readonly campaignId: string;
  readonly superpowerId: string;
  readonly doctrineId: string;
  readonly era: number;
  readonly cycle: number;
  readonly atmosphereTier: string;
  readonly approval: number;
  readonly stateHash: string;
}

export interface TimelineFrame {
  readonly cycle: number;
  readonly year: number;
  readonly season: string;
  readonly era: number;
  readonly atmoPct: number;
  readonly approvalPct: number;
  readonly capturedCount: number;
  readonly creditsEst: number;
  readonly score: number;
  readonly snapshotId: string;
  readonly headline: string;
  readonly stateHash: string;
}

export interface CampaignComparisonRow {
  readonly id: string;
  readonly label: string;
  readonly superpowerId: string;
  readonly era: number;
  readonly cycle: number;
  readonly atmosphereTier: string;
  readonly approval: number;
  readonly score: number;
  readonly isCurrent: boolean;
  readonly isBenchmark: boolean;
}

const SEASON_ORDER = ['PRINTEMPS', 'ETE', 'AUTOMNE', 'HIVER'] as const;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function computeCivilizationScore(world: WorldState): number {
  const terraComposite = world.terra?.compositeScore ?? world.atmosphereProgress;
  const fame = world.hk?.fame ?? 120;
  return Math.round(
    world.era * 220 +
      world.cycle * 24 +
      world.capturedTiles.length * 18 +
      terraComposite * 6 +
      world.approval * 3 +
      fame * 0.4,
  );
}

export function buildCampaignTimelineFrames(world: WorldState): readonly TimelineFrame[] {
  const snapshots = world.turn_snapshots ?? [];
  const chronicleByCycle = new Map<number, string>();
  for (const entry of world.chronicle) {
    if (!chronicleByCycle.has(entry.cycle)) {
      chronicleByCycle.set(entry.cycle, entry.title);
    }
  }

  const maxCycle = Math.max(1, world.cycle);
  const startAtmo = clamp(Math.round(world.atmosphereProgress - Math.max(0, maxCycle - 1) * 2.2), 6, 95);
  const startTiles = Math.max(1, world.capturedTiles.length - Math.max(0, maxCycle - 1));
  const currentScore = computeCivilizationScore(world);

  const snapshotByCycle = new Map(snapshots.map((s) => [s.cycle, s]));
  const frames: TimelineFrame[] = [];

  for (let c = 1; c <= maxCycle; c++) {
    const snap = snapshotByCycle.get(c);
    const ratio = maxCycle === 1 ? 1 : (c - 1) / (maxCycle - 1);
    const isLast = c === maxCycle;
    const atmoPct = isLast
      ? Math.round(world.atmosphereProgress)
      : Math.round(startAtmo + (world.atmosphereProgress - startAtmo) * ratio);
    const approvalPct = isLast
      ? Math.round(world.approval)
      : clamp(Math.round(62 + (world.approval - 62) * ratio), 15, 99);
    const capturedCount = isLast
      ? world.capturedTiles.length
      : Math.max(1, Math.round(startTiles + (world.capturedTiles.length - startTiles) * ratio));
    const creditsEst = isLast
      ? Math.round(world.resources.credits)
      : Math.round(450 + (world.resources.credits - 450) * ratio);
    const score = isLast
      ? currentScore
      : Math.round(280 + (currentScore - 280) * ratio);

    frames.push({
      cycle: c,
      year: snap?.year ?? 2050 + Math.floor((c - 1) / 4),
      season: snap?.season ?? SEASON_ORDER[(c - 1) % 4] ?? 'PRINTEMPS',
      era: snap?.era ?? (isLast ? world.era : Math.max(1, Math.min(world.era, 1 + Math.floor((c - 1) / 6)))),
      atmoPct,
      approvalPct,
      capturedCount,
      creditsEst,
      score,
      snapshotId: snap?.id ?? `frame-c${c}`,
      headline:
        chronicleByCycle.get(c) ??
        (c === 1
          ? 'Fondation du périmètre solarpunk ouvert'
          : `Consolidation atmosphérique — Cycle ${c}`),
      stateHash: snap?.stateHash ?? world.stateHash,
    });
  }

  return frames;
}

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function formatCampaignCsvExport(world: WorldState): string {
  const lines: string[] = [];
  lines.push('SECTION,CLÉ,VALEUR,DÉTAIL');
  lines.push(
    [
      'CAMPAGNE',
      escapeCsvCell(world.campaignId),
      escapeCsvCell(`${world.superpowerId} · Ère ${world.era}`),
      escapeCsvCell(`Cycle ${world.cycle} (${world.year} ${world.season}) · Palier ${world.atmosphereTier}`),
    ].join(','),
  );
  lines.push(
    [
      'RESSOURCES',
      'STOCK_ACTUEL',
      escapeCsvCell(`${world.resources.credits} Cr`),
      escapeCsvCell(
        `Énergie=${world.resources.energy} | Eau=${world.resources.water} | Vivres=${world.resources.food} | Matériaux=${world.resources.materials} | Calcul=${world.resources.compute}`,
      ),
    ].join(','),
  );
  lines.push('');
  lines.push('QUARTIER,TYPE,NIVEAU,INTÉGRITÉ_%,EXTENSIONS');
  for (const dist of world.districts) {
    lines.push(
      [
        escapeCsvCell(dist.name),
        escapeCsvCell(dist.kind),
        dist.level,
        dist.integrity,
        dist.modulesCount,
      ].join(','),
    );
  }
  lines.push('');
  lines.push('FRISE_CYCLE,ANNÉE,SAISON,ÈRE,ATMOSPHÈRE_%,APPROBATION_%,SECTEURS,SCORE,TITRE');
  for (const frame of buildCampaignTimelineFrames(world)) {
    lines.push(
      [
        frame.cycle,
        frame.year,
        escapeCsvCell(frame.season),
        frame.era,
        frame.atmoPct,
        frame.approvalPct,
        frame.capturedCount,
        frame.score,
        escapeCsvCell(frame.headline),
      ].join(','),
    );
  }
  return `\uFEFF${lines.join('\n')}\n`;
}

function escapeHtml(text: string | number): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatCampaignHtmlReport(world: WorldState, superpowerName: string): string {
  const frames = buildCampaignTimelineFrames(world);
  const score = computeCivilizationScore(world);
  const districtRows = world.districts
    .map(
      (d) =>
        `<tr><td>${escapeHtml(d.name)}</td><td>${escapeHtml(d.kind)}</td><td>Niv. ${d.level}</td><td>${d.integrity}%</td><td>${d.modulesCount}</td></tr>`,
    )
    .join('');
  const chronicleRows = world.chronicle
    .slice(0, 15)
    .map(
      (c) =>
        `<tr><td>C${c.cycle}</td><td>${escapeHtml(c.category)}</td><td><strong>${escapeHtml(c.title)}</strong></td><td>${escapeHtml(c.detail)}</td></tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Rapport Souverain — ${escapeHtml(world.campaignId)}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; color: #1f1224; background: #fff9fb; margin: 32px auto; max-width: 900px; padding: 0 20px; }
  h1, h2 { color: #9f1239; margin-bottom: 6px; }
  .meta { font-family: monospace; font-size: 12px; color: #64748b; margin-bottom: 20px; }
  .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 16px 0 24px; }
  .kpi { border: 1px solid #fecdd3; border-radius: 10px; background: #ffffff; padding: 12px; }
  .kpi .lbl { font-size: 11px; text-transform: uppercase; color: #881337; font-family: monospace; }
  .kpi .val { font-size: 20px; font-weight: 700; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0 24px; background: #fff; font-size: 13px; }
  th, td { border: 1px solid #fce7f3; padding: 8px 10px; text-align: left; }
  th { background: #fff1f2; color: #881337; font-family: monospace; font-size: 11px; text-transform: uppercase; }
</style>
</head>
<body>
  <h1>EXO WORLD : 2050 — Rapport Souverain</h1>
  <div class="meta">Campagne ${escapeHtml(world.campaignId)} · Puissance : ${escapeHtml(superpowerName)} · Empreinte ${escapeHtml(world.stateHash.slice(0, 12))}</div>
  <div class="grid">
    <div class="kpi"><div class="lbl">Avancement</div><div class="val">Ère ${world.era} · C${world.cycle}</div></div>
    <div class="kpi"><div class="lbl">Atmosphère</div><div class="val">${escapeHtml(world.atmosphereTier)} (${Math.round(world.atmosphereProgress)}%)</div></div>
    <div class="kpi"><div class="lbl">Territoire</div><div class="val">${world.capturedTiles.length} / 72</div></div>
    <div class="kpi"><div class="lbl">Score Global</div><div class="val">${score} pts</div></div>
  </div>
  <h2>Quartiers &amp; Infrastructures (${world.districts.length})</h2>
  <table><thead><tr><th>Nom</th><th>Domaine</th><th>Niveau</th><th>Intégrité</th><th>Extensions</th></tr></thead><tbody>${districtRows}</tbody></table>
  <h2>Frise Chronologique (${frames.length} cycles) &amp; Chronique (${world.chronicle.length} entrées)</h2>
  <table><thead><tr><th>Cycle</th><th>Catégorie</th><th>Titre</th><th>Détail</th></tr></thead><tbody>${chronicleRows}</tbody></table>
</body>
</html>`;
}

export function buildCampaignComparisonRows(
  world: WorldState,
  savedMeta: readonly CampaignSummaryEntry[],
): readonly CampaignComparisonRow[] {
  const activeScore = computeCivilizationScore(world);
  const rows: CampaignComparisonRow[] = [
    {
      id: world.campaignId,
      label: `Session active (${world.superpowerId})`,
      superpowerId: world.superpowerId,
      era: world.era,
      cycle: world.cycle,
      atmosphereTier: world.atmosphereTier,
      approval: Math.round(world.approval),
      score: activeScore,
      isCurrent: true,
      isBenchmark: false,
    },
  ];

  for (const save of savedMeta) {
    if (save.campaignId === world.campaignId) continue;
    const estScore = Math.round(save.era * 220 + save.cycle * 24 + save.approval * 3 + 260);
    rows.push({
      id: save.campaignId,
      label: `${save.superpowerId} · ${save.campaignId.slice(0, 12)}`,
      superpowerId: save.superpowerId,
      era: save.era,
      cycle: save.cycle,
      atmosphereTier: save.atmosphereTier,
      approval: Math.round(save.approval),
      score: estScore,
      isCurrent: false,
      isBenchmark: false,
    });
  }

  rows.push({
    id: 'benchmark-0x2050e801',
    label: 'Référence Solarpunk (Seed 0x2050E801)',
    superpowerId: 'EUROPA',
    era: 3,
    cycle: 12,
    atmosphereTier: 'P3',
    approval: 78,
    score: 1840,
    isCurrent: false,
    isBenchmark: true,
  });

  return rows.sort((a, b) => b.score - a.score);
}
