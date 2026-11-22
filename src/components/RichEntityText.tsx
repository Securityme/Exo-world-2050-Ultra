import { useMemo, type MouseEvent } from 'react';
import { useSetAtom } from 'jotai';
import { Building2, MapPin, Sparkles, User } from 'lucide-react';
import { useExoStore } from '../stores/game.store.ts';
import {
  activeDossierIdAtom,
  activeSubscreenAtom,
  inspectedEntityAtom,
  selectedDistrictIdAtom,
  selectedTileAtom,
  toastNoticeAtom,
} from '../stores/selection.atoms.ts';
import {
  tokenizeEntityText,
  type EntityTagKind,
  type EntityTextSegment,
} from '../systems/dossiers-pa/entity-markup.ts';

interface RichEntityTextProps {
  readonly text: string;
  /** Set false when rendered inside an outer <button> to preserve valid HTML nesting. */
  readonly interactive?: boolean;
  readonly className?: string;
}

const KIND_STYLES: Record<EntityTagKind, string> = {
  PLACE:
    'border-[var(--exo-accent)] bg-[var(--exo-accent-soft)] text-[var(--exo-text)] hover:brightness-110',
  BUILDING:
    'border-emerald-300/90 bg-emerald-500/12 text-emerald-900 hover:border-emerald-500 hover:bg-emerald-500/20 dark:border-emerald-600/70 dark:bg-emerald-500/20 dark:text-emerald-100',
  CHARACTER:
    'border-rose-300/90 bg-rose-500/12 text-rose-900 hover:border-rose-500 hover:bg-rose-500/20 dark:border-rose-600/70 dark:bg-rose-500/20 dark:text-rose-100',
  ENTITY:
    'border-amber-300/90 bg-amber-500/12 text-amber-950 hover:border-amber-500 hover:bg-amber-500/20 dark:border-amber-600/70 dark:bg-amber-500/20 dark:text-amber-100',
};

const KIND_ICON: Record<EntityTagKind, typeof MapPin> = {
  PLACE: MapPin,
  BUILDING: Building2,
  CHARACTER: User,
  ENTITY: Sparkles,
};

/**
 * [L7] Renders narrative text with highlighted, semantic inline entity tags (balises)
 * for places, sectors, buildings/districts, characters, and strategic game entities.
 */
export function RichEntityText({
  text,
  interactive = true,
  className,
}: RichEntityTextProps) {
  const world = useExoStore((s) => s.world);
  const setInspectedEntity = useSetAtom(inspectedEntityAtom);
  const setSelectedTile = useSetAtom(selectedTileAtom);
  const setSelectedDistrict = useSetAtom(selectedDistrictIdAtom);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
  const setActiveDossierId = useSetAtom(activeDossierIdAtom);
  const setToast = useSetAtom(toastNoticeAtom);

  const segments = useMemo(() => tokenizeEntityText(text, world), [text, world]);

  const handleEntityClick = (
    event: MouseEvent,
    seg: Extract<EntityTextSegment, { type: 'ENTITY' }>,
  ) => {
    event.stopPropagation();

    if (seg.targetType === 'DISTRICT' && typeof seg.targetId === 'string') {
      setActiveDossierId(null);
      setSubscreen('NONE');
      setSelectedDistrict(seg.targetId);
      setInspectedEntity({ kind: 'DISTRICT', districtId: seg.targetId });
      return;
    }

    if (seg.targetType === 'SECTOR' && typeof seg.targetId === 'number') {
      setActiveDossierId(null);
      setSubscreen('NONE');
      setSelectedTile(seg.targetId);
      setInspectedEntity({ kind: 'SECTOR', tileIndex: seg.targetId });
      return;
    }

    if (seg.targetType === 'WORLD' && typeof seg.targetId === 'number') {
      setActiveDossierId(null);
      setSubscreen('NONE');
      setInspectedEntity({ kind: 'WORLD', slotIndex: seg.targetId });
      return;
    }

    if (seg.targetType === 'ADVISOR' && typeof seg.targetId === 'string') {
      const advisor = world.advisors.find((a) => a.id === seg.targetId);
      setToast({
        id: Date.now(),
        tone: 'info',
        text: advisor
          ? `${advisor.name} — ${advisor.role} · Score ${advisor.attributeScore} · Spécialité : ${advisor.traitName} (Loyauté ${advisor.loyalty}%)`
          : `${seg.text}${seg.subtitle ? ` — ${seg.subtitle}` : ''}`,
      });
      return;
    }

    setToast({
      id: Date.now(),
      tone: 'info',
      text: `${seg.text}${seg.subtitle ? ` — ${seg.subtitle}` : ''}`,
    });
  };

  return (
    <span className={className}>
      {segments.map((seg, idx) => {
        if (seg.type === 'TEXT') {
          return <span key={idx}>{seg.text}</span>;
        }

        const Icon = KIND_ICON[seg.kind];
        const baseCls = `mx-[1px] inline-flex items-center gap-1 rounded-md border px-1.5 py-[1px] align-baseline font-semibold leading-[1.35] text-[0.92em] transition ${KIND_STYLES[seg.kind]}`;

        if (interactive) {
          return (
            <button
              key={`${seg.text}-${idx}`}
              type="button"
              onClick={(e) => handleEntityClick(e, seg)}
              title={seg.subtitle ? `${seg.text} · ${seg.subtitle} (Cliquer pour inspecter)` : seg.text}
              className={`${baseCls} cursor-pointer`}
            >
              <Icon className="h-3 w-3 shrink-0 opacity-85" />
              <span>{seg.text}</span>
            </button>
          );
        }

        return (
          <span
            key={`${seg.text}-${idx}`}
            title={seg.subtitle ? `${seg.text} · ${seg.subtitle}` : seg.text}
            className={baseCls}
          >
            <Icon className="h-3 w-3 shrink-0 opacity-85" />
            <span>{seg.text}</span>
          </span>
        );
      })}
    </span>
  );
}
