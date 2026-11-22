import { useMemo, useState } from 'react';
import { flexRender } from '@tanstack/react-table';
import {
  getCoreRowModel,
  getSortedRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from '@tanstack/react-table/legacy';
import { ArrowUpDown, Globe, ShieldCheck } from 'lucide-react';
import { SUPERPOWERS_CATALOG } from '../../data/world.catalog.ts';
import { ExternalPolitiesPanel } from '../../components/world/ExternalPolitiesPanel.tsx';
import { useExoStore } from '../../stores/game.store.ts';

/**
 * [L7] FUP-006 | SM-04 | SADT A4.3
 * Autonomous Super-Alliance Directives + AI Comparator Table.
 */
interface PowerComparisonRow {
  readonly id: string;
  readonly name: string;
  readonly isPlayer: boolean;
  readonly era: number;
  readonly eraStars: number;
  readonly globalScore: number;
  readonly militaryPower: number;
  readonly controlledTiles: number;
  readonly relationLabel: string;
}

export function GeopoliticsTab() {
  const world = useExoStore((s) => s.world);
  const [sorting, setSorting] = useState([{ id: 'globalScore', desc: true }]);

  const rows = useMemo<PowerComparisonRow[]>(() => {
    const playerPower = world.militaryRoster.reduce((acc, u) => acc + u.count * u.basePower * u.level, 0);
    const playerScore =
      world.era * 120 + world.eraStars * 25 + world.capturedTiles.length * 14 + Math.round(world.approval);
    const playerTemplate = SUPERPOWERS_CATALOG.find((s) => s.id === world.superpowerId);
    const playerRow: PowerComparisonRow = {
      id: world.superpowerId,
      name: `${playerTemplate?.name ?? world.superpowerId} (Vous)`,
      isPlayer: true,
      era: world.era,
      eraStars: world.eraStars,
      globalScore: playerScore,
      militaryPower: playerPower,
      controlledTiles: world.capturedTiles.length,
      relationLabel: `Rang #${world.superAllianceRank}`,
    };
    const rivalRows: PowerComparisonRow[] = world.rivals.map((r) => ({
      id: r.id,
      name: r.name,
      isPlayer: false,
      era: r.era,
      eraStars: r.eraStars,
      globalScore: r.humankindScore,
      militaryPower: r.militaryPower,
      controlledTiles: r.controlledTiles,
      relationLabel:
        r.paralyzedCycles > 0
          ? `Paralysé (${r.paralyzedCycles}c)`
          : `${r.relationWithPlayer > 0 ? '+' : ''}${r.relationWithPlayer}`,
    }));
    return [playerRow, ...rivalRows];
  }, [world]);

  const columns = useMemo<LegacyColumnDef<PowerComparisonRow>[]>(
    () => [
      { accessorKey: 'name', header: 'Superpuissance' },
      { accessorKey: 'era', header: 'Ère', cell: (i) => `Ère ${String(i.getValue())}` },
      { accessorKey: 'eraStars', header: 'Étoiles', cell: (i) => `${String(i.getValue())}★` },
      { accessorKey: 'globalScore', header: 'Score Global' },
      { accessorKey: 'militaryPower', header: 'Puissance Mil.' },
      { accessorKey: 'controlledTiles', header: 'Secteurs' },
      { accessorKey: 'relationLabel', header: 'Statut / Relation' },
    ],
    [],
  );

  const table = useLegacyTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-rose-200/90 bg-white/85 p-4 dark:border-rose-900/60 dark:bg-[#190d1f]">
          <div className="flex items-center gap-2 font-display text-sm font-bold text-[#1f1224] dark:text-rose-100">
            <Globe className="h-4 w-4 text-rose-600 dark:text-rose-300" />
            {world.superAllianceName}
          </div>
          <div className="mt-1 font-mono text-xs text-rose-900/75 dark:text-rose-200/75">
            Rang fédéral : #{world.superAllianceRank}/6 · Confiance : {world.superAllianceTrust}%
          </div>
        </div>
        <div className="rounded-xl border border-emerald-300/80 bg-white/85 p-4 dark:border-emerald-500/35 dark:bg-[#190d1f] md:col-span-2">
          <div className="flex items-center gap-2 font-display text-sm font-bold text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            Directive Autonome de la Super-Alliance
          </div>
          <p className="mt-1 text-xs text-[#1f1224] dark:text-rose-100">{world.superAllianceDirective}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-rose-200/90 bg-white/90 dark:border-rose-900/60 dark:bg-[#190d1f]">
        <table className="min-w-[540px] w-full text-left text-xs">
          <thead className="border-b border-rose-200 bg-rose-50/90 font-mono text-[11px] uppercase text-rose-900/75 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-200/75">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="px-3.5 py-2.5">
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      className="inline-flex min-h-[36px] items-center gap-1 hover:text-rose-600 dark:hover:text-rose-300"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </button>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-rose-200/60 dark:divide-rose-900/40">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={
                  row.original.isPlayer
                    ? 'bg-rose-500/12 font-semibold text-[#1f1224] dark:bg-rose-500/20 dark:text-rose-50'
                    : 'text-[#1f1224] dark:text-rose-100'
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3.5 py-2.5 font-mono">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ExternalPolitiesPanel />
    </div>
  );
}
