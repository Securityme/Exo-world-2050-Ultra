import { useMemo, type MouseEvent } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Building2, MapPin, Sparkles, User } from 'lucide-react';
import { useExoStore } from '../stores/game.store.ts';
import {
  activeDossierIdAtom,
  activeSubscreenAtom,
  cameraFocusTargetAtom,
  focusNonceAtom,
  inspectedColonistIdAtom,
  inspectedEntityAtom,
  returnEventContextAtom,
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
    'border-[var(--exo-accent)]/75 bg-[var(--exo-accent-soft)] text-[var(--exo-text)] hover:brightness-110',
  BUILDING:
    'border-emerald-400/75 bg-emerald-500/12 text-emerald-900 hover:border-emerald-500 hover:bg-emerald-500/20 dark:border-emerald-500/70 dark:bg-emerald-500/20 dark:text-emerald-100',
  CHARACTER:
    'border-rose-400/75 bg-rose-500/12 text-rose-900 hover:border-rose-500 hover:bg-rose-500/20 dark:border-rose-500/70 dark:bg-rose-500/20 dark:text-rose-100',
  ENTITY:
    'border-amber-400/75 bg-amber-500/12 text-amber-950 hover:border-amber-500 hover:bg-amber-500/20 dark:border-amber-500/70 dark:bg-amber-500/20 dark:text-amber-100',
};

const KIND_ICON: Record<EntityTagKind, typeof MapPin> = {
  PLACE: MapPin,
  BUILDING: Building2,
  CHARACTER: User,
  ENTITY: Sparkles,
};

/**
 * [L7] Renders narrative text with ultra-compact line-height-aligned semantic entity badges
 * supporting automatic 3D scale switching (Space/Planet/City), camera focus, and easy return.
 */
export function RichEntityText({
  text,
  interactive = true,
  className,
}: RichEntityTextProps) {
  const world = useExoStore((s) => s.world);
  const setActiveScale = useExoStore((s) => s.setActiveScale);
  const setActiveSlot = useExoStore((s) => s.setActiveSlot);
  const activeDossierId = useAtomValue(activeDossierIdAtom);
  const subscreen = useAtomValue(activeSubscreenAtom);
  const focusNonce = useAtomValue(focusNonceAtom);
  const setFocusNonce = useSetAtom(focusNonceAtom);
  const setCameraFocus = useSetAtom(cameraFocusTargetAtom);
  const setReturnContext = useSetAtom(returnEventContextAtom);
  const setInspectedEntity = useSetAtom(inspectedEntityAtom);
  const setInspectedColonistId = useSetAtom(inspectedColonistIdAtom);
  const setSelectedTile = useSetAtom(selectedTileAtom);
  const setSelectedDistrict = useSetAtom(selectedDistrictIdAtom);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
  const setActiveDossierId = useSetAtom(activeDossierIdAtom);
  const setToast = useSetAtom(toastNoticeAtom);

  const segments = useMemo(() => tokenizeEntityText(text, world), [text, world]);

  const recordReturnContext = (entityLabel: string) => {
    if (!activeDossierId && subscreen !== 'EVENTS_HUB' && subscreen !== 'JOURNAL_HUB') return;
    const dos = activeDossierId ? world.activeDossiers.find((d) => d.id === activeDossierId) : null;
    setReturnContext({
      dossierId: activeDossierId,
      title: dos?.title ?? 'Événements & Dossiers',
      entityLabel,
      returnSubscreen: subscreen === 'NONE' ? 'EVENTS_HUB' : subscreen,
    });
  };

  const handleEntityClick = (
    event: MouseEvent,
    seg: Extract<EntityTextSegment, { type: 'ENTITY' }>,
  ) => {
    event.stopPropagation();
    const nextNonce = focusNonce + 1;

    if (seg.targetType === 'WORLD' && typeof seg.targetId === 'number') {
      recordReturnContext(seg.text);
      setFocusNonce(nextNonce);
      setActiveSlot(seg.targetId);
      setActiveScale(1);
      setCameraFocus({
        scale: 1,
        targetType: 'SLOT',
        slotIndex: seg.targetId,
        focusNonce: nextNonce,
      });
      setActiveDossierId(null);
      setSubscreen('NONE');
      setInspectedEntity({ kind: 'WORLD', slotIndex: seg.targetId });
      return;
    }

    if (seg.targetType === 'SECTOR' && typeof seg.targetId === 'number') {
      recordReturnContext(seg.text);
      setFocusNonce(nextNonce);
      setSelectedTile(seg.targetId);
      setActiveScale(2);
      setCameraFocus({
        scale: 2,
        targetType: 'TILE',
        tileIndex: seg.targetId,
        focusNonce: nextNonce,
      });
      setActiveDossierId(null);
      setSubscreen('NONE');
      setInspectedEntity({ kind: 'SECTOR', tileIndex: seg.targetId });
      return;
    }

    if (seg.targetType === 'DISTRICT' && typeof seg.targetId === 'string') {
      recordReturnContext(seg.text);
      setFocusNonce(nextNonce);
      setSelectedDistrict(seg.targetId);
      setActiveScale(3);
      setCameraFocus({
        scale: 3,
        targetType: 'DISTRICT',
        districtId: seg.targetId,
        focusNonce: nextNonce,
      });
      setActiveDossierId(null);
      setSubscreen('NONE');
      setInspectedEntity({ kind: 'DISTRICT', districtId: seg.targetId });
      return;
    }

    if (seg.targetType === 'COLONIST' && typeof seg.targetId === 'string') {
      recordReturnContext(seg.text);
      setFocusNonce(nextNonce);
      setActiveScale(3);
      setCameraFocus({
        scale: 3,
        targetType: 'COLONIST',
        colonistId: seg.targetId,
        focusNonce: nextNonce,
      });
      setActiveDossierId(null);
      setSubscreen('NONE');
      setInspectedColonistId(seg.targetId);
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
        const baseCls = `mx-[2px] inline-flex items-baseline gap-[3px] rounded border px-1 py-0 align-baseline font-semibold leading-none text-[0.92em] transition ${KIND_STYLES[seg.kind]}`;

        if (interactive) {
          return (
            <button
              key={`${seg.text}-${idx}`}
              type="button"
              data-testid={`entity-badge-${seg.targetType.toLowerCase()}`}
              onClick={(e) => handleEntityClick(e, seg)}
              title={seg.subtitle ? `${seg.text} · ${seg.subtitle} (Cliquer pour focaliser la vue 3D)` : seg.text}
              className={`${baseCls} cursor-pointer`}
            >
              <Icon className="h-[0.8em] w-[0.8em] shrink-0 self-center opacity-85" />
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
            <Icon className="h-[0.8em] w-[0.8em] shrink-0 self-center opacity-85" />
            <span>{seg.text}</span>
          </span>
        );
      })}
    </span>
  );
}
