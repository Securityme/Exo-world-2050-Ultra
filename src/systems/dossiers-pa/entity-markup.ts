import type { ExecutiveDossier } from '../../contracts/pa-dossiers.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import { PLANETARY_SLOTS_CATALOG, SCIENTIFIC_DISCOVERIES_CATALOG } from '../../data/world.catalog.ts';

/**
 * [L3] Pure Deterministic Entity Markup Tokenizer & Astralis Dossier Context Resolver.
 * Detects locations, sectors, buildings/districts, characters/advisors, and game entities
 * inside any French narrative text to render semantic highlighted tags (balises) in UI.
 * Zero React/DOM imports, zero Math.random(), zero side effects.
 */
export type EntityTagKind = 'PLACE' | 'BUILDING' | 'CHARACTER' | 'ENTITY';

export type EntityTargetType =
  | 'WORLD'
  | 'SECTOR'
  | 'DISTRICT'
  | 'ADVISOR'
  | 'COLONIST'
  | 'RIVAL'
  | 'SYSTEM';

export interface EntityMatchMetadata {
  readonly kind: EntityTagKind;
  readonly targetType: EntityTargetType;
  readonly targetId?: string | number;
  readonly subtitle?: string;
}

export type EntityTextSegment =
  | { readonly type: 'TEXT'; readonly text: string }
  | ({
      readonly type: 'ENTITY';
      readonly text: string;
    } & EntityMatchMetadata);

interface DictionaryEntry extends EntityMatchMetadata {
  readonly phrase: string;
  readonly lower: string;
}

export interface DossierContextSummary {
  readonly placeLabel: string;
  readonly slotIndex: number;
  readonly tileIndex: number;
  readonly building: {
    readonly id: string;
    readonly name: string;
    readonly integrity: number;
    readonly modulesCount: number;
  } | null;
  readonly advisor: {
    readonly id: string;
    readonly name: string;
    readonly role: string;
    readonly attributeScore: number;
  } | null;
  readonly urgency: {
    readonly level: 'CRITICAL' | 'HIGH' | 'NORMAL';
    readonly label: string;
  };
  readonly entityBadge: string | null;
  readonly tensionPct: number;
}

function isWordChar(ch: string | undefined): boolean {
  if (!ch) return false;
  return /[A-Za-zÀ-ÖØ-öø-ÿ0-9_-]/.test(ch);
}

function buildEntityDictionary(world: WorldState): readonly DictionaryEntry[] {
  const entries: DictionaryEntry[] = [];
  const seen = new Set<string>();

  const push = (phrase: string, meta: EntityMatchMetadata) => {
    const clean = phrase.trim();
    if (clean.length < 3) return;
    const lower = clean.toLowerCase();
    if (seen.has(lower)) return;
    seen.add(lower);
    entries.push({ phrase: clean, lower, ...meta });
  };

  // 1. Characters: Advisors & Colonists
  for (const adv of world.advisors) {
    push(adv.name, {
      kind: 'CHARACTER',
      targetType: 'ADVISOR',
      targetId: adv.id,
      subtitle: `${adv.role} · Score ${adv.attributeScore}`,
    });
    const lastName = adv.name.split(' ').slice(-1)[0];
    if (lastName && lastName.length >= 5) {
      push(lastName, {
        kind: 'CHARACTER',
        targetType: 'ADVISOR',
        targetId: adv.id,
        subtitle: `${adv.name} (${adv.role})`,
      });
    }
  }
  for (const col of world.colonists) {
    push(col.name, {
      kind: 'CHARACTER',
      targetType: 'COLONIST',
      targetId: col.id,
      subtitle: `Spécialiste ${col.trait} · Moral ${col.morale}%`,
    });
  }

  // 2. Buildings / Districts (plus contextual aliases)
  for (const dist of world.districts) {
    push(dist.name, {
      kind: 'BUILDING',
      targetType: 'DISTRICT',
      targetId: dist.id,
      subtitle: `Niv.${dist.level} · Ext. ${dist.modulesCount}/3 · État ${dist.integrity}%`,
    });
  }

  const distByKind = (kind: string) => world.districts.find((d) => d.kind === kind);
  const indDist = distByKind('INDUSTRY');
  if (indDist) {
    push('district industriel Nord', {
      kind: 'BUILDING',
      targetType: 'DISTRICT',
      targetId: indDist.id,
      subtitle: `${indDist.name} · État ${indDist.integrity}%`,
    });
    push('Pôle Industriel', {
      kind: 'BUILDING',
      targetType: 'DISTRICT',
      targetId: indDist.id,
      subtitle: `${indDist.name} · État ${indDist.integrity}%`,
    });
  }
  const dcDist = distByKind('DATACENTER');
  if (dcDist) {
    push('Datacenters Souverains', {
      kind: 'BUILDING',
      targetType: 'DISTRICT',
      targetId: dcDist.id,
      subtitle: `${dcDist.name} · État ${dcDist.integrity}%`,
    });
    push('Datacenter Souverain', {
      kind: 'BUILDING',
      targetType: 'DISTRICT',
      targetId: dcDist.id,
      subtitle: `${dcDist.name} · État ${dcDist.integrity}%`,
    });
  }
  const habDist = distByKind('HABITAT');
  if (habDist) {
    push('quartiers résidentiels', {
      kind: 'BUILDING',
      targetType: 'DISTRICT',
      targetId: habDist.id,
      subtitle: `${habDist.name} · État ${habDist.integrity}%`,
    });
  }
  const bioDist = distByKind('BIOPARK');
  if (bioDist) {
    push('fermes aéroponiques', {
      kind: 'BUILDING',
      targetType: 'DISTRICT',
      targetId: bioDist.id,
      subtitle: `${bioDist.name} · État ${bioDist.integrity}%`,
    });
    push('station géo-eau', {
      kind: 'BUILDING',
      targetType: 'DISTRICT',
      targetId: bioDist.id,
      subtitle: `${bioDist.name} · État ${bioDist.integrity}%`,
    });
  }

  // 3. Places / Planetary Worlds
  for (const slot of PLANETARY_SLOTS_CATALOG) {
    push(slot.name, {
      kind: 'PLACE',
      targetType: 'WORLD',
      targetId: slot.slotIndex,
      subtitle: `${slot.bodyType} · ${slot.signatureResource}`,
    });
  }
  push('Novaterra-1', {
    kind: 'PLACE',
    targetType: 'WORLD',
    targetId: 1,
    subtitle: 'Colonie principale (Zone 1)',
  });
  push('bassins équatoriaux', {
    kind: 'PLACE',
    targetType: 'WORLD',
    targetId: world.activeSlotIndex,
    subtitle: 'Zone climatique équatoriale',
  });
  push('Slot lunaire', {
    kind: 'PLACE',
    targetType: 'WORLD',
    targetId: 2,
    subtitle: 'Base lunaire (Zone 2)',
  });

  // 4. Entities: Rivals, Alliances, Scientific Sites, Drones & Strategic Assets
  for (const rival of world.rivals) {
    push(rival.name, {
      kind: 'ENTITY',
      targetType: 'RIVAL',
      targetId: rival.id,
      subtitle: `Puissance rivale · Défense ${rival.computeDefense}`,
    });
  }
  if (world.superAllianceName) {
    push(world.superAllianceName, {
      kind: 'ENTITY',
      targetType: 'SYSTEM',
      subtitle: `Confiance ${world.superAllianceTrust}%`,
    });
  }
  push('Super-Alliance', {
    kind: 'ENTITY',
    targetType: 'SYSTEM',
    subtitle: `Alliance fédérale · Confiance ${world.superAllianceTrust}%`,
  });
  push('Pacte BRICS+', {
    kind: 'ENTITY',
    targetType: 'RIVAL',
    targetId: 'brics-plus',
    subtitle: 'Puissance rivale exosphérique',
  });

  for (const discovery of SCIENTIFIC_DISCOVERIES_CATALOG) {
    push(discovery, {
      kind: 'ENTITY',
      targetType: 'SYSTEM',
      subtitle: 'Site scientifique & ressource stratégique',
    });
  }

  const strategicEntities: readonly { phrase: string; subtitle: string }[] = [
    { phrase: 'Drones de Chantier', subtitle: `${world.drones.construction} drones en service` },
    { phrase: 'réseau de drones', subtitle: `${world.drones.construction + world.drones.defense + world.drones.attack + world.drones.recon} drones actifs` },
    { phrase: 'Hélium-3', subtitle: `Stock actuel : ${world.resources.helium3}` },
    { phrase: 'Kits O₂', subtitle: `Stock actuel : ${world.resources.breathingKits}` },
    { phrase: 'Kits Respiratoires', subtitle: `Stock actuel : ${world.resources.breathingKits}` },
    { phrase: 'Banque Fédérale', subtitle: `Cote ${world.finance.solvencyRating} · ${world.finance.loans.length}/3 prêts` },
    { phrase: 'Atmosphère Hostile', subtitle: `Stade atmosphérique initial (air filtré requis)` },
    { phrase: 'Atmosphère Stabilisée', subtitle: `Stade atmosphérique actuel : ${world.atmosphereProgress}%` },
    { phrase: 'Atmosphère Respirable', subtitle: `Stade atmosphérique avancé (${world.atmosphereProgress}%)` },
    { phrase: 'Atmosphère Éden', subtitle: `Stade atmosphérique optimal (${world.atmosphereProgress}%)` },
    { phrase: 'assemblée civique', subtitle: 'Conseil citoyen de la colonie' },
    { phrase: 'consortiums', subtitle: 'Partenaires industriels privés' },
    { phrase: 'Alliance', subtitle: `Confiance ${world.superAllianceTrust}%` },
    { phrase: 'drones', subtitle: `${world.drones.construction + world.drones.defense + world.drones.attack + world.drones.recon} drones actifs` },
  ];
  for (const item of strategicEntities) {
    push(item.phrase, {
      kind: 'ENTITY',
      targetType: 'SYSTEM',
      subtitle: item.subtitle,
    });
  }

  // Sort longest phrase first so specific phrases win over shorter substrings
  return entries.sort((a, b) => b.phrase.length - a.phrase.length);
}

interface RawMatch {
  readonly start: number;
  readonly end: number;
  readonly text: string;
  readonly meta: EntityMatchMetadata;
}

/**
 * Pure deterministic tokenizer: splits `text` into plain TEXT and structured ENTITY segments.
 * Preserves 100% of original characters with zero overlaps.
 */
export function tokenizeEntityText(
  text: string,
  world: WorldState,
): readonly EntityTextSegment[] {
  if (!text) return [];
  const dict = buildEntityDictionary(world);
  const lower = text.toLowerCase();
  const occupied = new Uint8Array(text.length);
  const matches: RawMatch[] = [];

  const claimIfFree = (start: number, end: number, meta: EntityMatchMetadata) => {
    for (let i = start; i < end; i += 1) {
      if (occupied[i] === 1) return;
    }
    for (let i = start; i < end; i += 1) {
      occupied[i] = 1;
    }
    matches.push({ start, end, text: text.slice(start, end), meta });
  };

  // First match dynamic "Secteur #14" patterns
  const sectorRegex = /Secteur\s*#(\d+)/gi;
  let secMatch: RegExpExecArray | null = sectorRegex.exec(text);
  while (secMatch !== null) {
    const start = secMatch.index;
    const end = start + secMatch[0].length;
    const tileNum = Number(secMatch[1]);
    claimIfFree(start, end, {
      kind: 'PLACE',
      targetType: 'SECTOR',
      targetId: tileNum,
      subtitle: world.capturedTiles.includes(tileNum)
        ? 'Secteur contrôlé'
        : world.rivalTiles.includes(tileNum)
          ? 'Secteur rival'
          : 'Secteur neutre',
    });
    secMatch = sectorRegex.exec(text);
  }

  // Then match dictionary entries (longest first, word-boundary safe)
  for (const entry of dict) {
    let searchFrom = 0;
    while (searchFrom < lower.length) {
      const idx = lower.indexOf(entry.lower, searchFrom);
      if (idx === -1) break;
      const end = idx + entry.lower.length;
      const prevOk = !isWordChar(text[idx - 1]);
      const nextOk = !isWordChar(text[end]);
      if (prevOk && nextOk) {
        claimIfFree(idx, end, {
          kind: entry.kind,
          targetType: entry.targetType,
          targetId: entry.targetId,
          subtitle: entry.subtitle,
        });
      }
      searchFrom = idx + 1;
    }
  }

  if (matches.length === 0) {
    return [{ type: 'TEXT', text }];
  }

  matches.sort((a, b) => a.start - b.start);

  const segments: EntityTextSegment[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start > cursor) {
      segments.push({ type: 'TEXT', text: text.slice(cursor, m.start) });
    }
    segments.push({
      type: 'ENTITY',
      text: m.text,
      ...m.meta,
    });
    cursor = m.end;
  }
  if (cursor < text.length) {
    segments.push({ type: 'TEXT', text: text.slice(cursor) });
  }

  return segments;
}

/**
 * Resolves Astralis-style structured context badges for an Executive Dossier:
 * linked World/Sector, linked District/Building, recommended Advisor, urgency & tension.
 */
export function resolveDossierContext(
  world: WorldState,
  dossier: ExecutiveDossier,
): DossierContextSummary {
  const slot =
    PLANETARY_SLOTS_CATALOG.find((s) => s.slotIndex === dossier.slotIndex) ??
    PLANETARY_SLOTS_CATALOG[0]!;
  const placeLabel = `${slot.name} · Secteur #${dossier.tileIndex}`;

  // Resolve linked building/district
  let matchedDistrict = world.districts.find((d) =>
    dossier.options.some(
      (opt) => opt.actionPayload?.kind === 'GRAFT_MODULE' && opt.actionPayload.districtId === d.id,
    ),
  );
  if (!matchedDistrict) {
    const combinedText = `${dossier.title} ${dossier.briefing}`.toLowerCase();
    matchedDistrict = world.districts.find((d) => combinedText.includes(d.name.toLowerCase()));
  }
  if (!matchedDistrict) {
    const fallbackKindByClass: Record<ExecutiveDossier['dossierClass'], string> = {
      P0: 'ENERGY',
      C1: 'HABITAT',
      C2: 'INDUSTRY',
      C3: 'DATACENTER',
      C4: 'BIOPARK',
      C5: 'COMMAND',
    };
    const desiredKind = fallbackKindByClass[dossier.dossierClass];
    matchedDistrict =
      world.districts.find((d) => d.kind === desiredKind) ?? world.districts[0];
  }

  // Resolve recommended advisor
  const primaryDomain =
    dossier.options.find((o) => o.subPaDomain !== null)?.subPaDomain ??
    (dossier.dossierClass === 'C2'
      ? 'PA_GES'
      : dossier.dossierClass === 'C3' || dossier.dossierClass === 'P0'
        ? 'PA_MNT'
        : dossier.dossierClass === 'C4'
          ? 'PA_BIO'
          : 'PA_POL');
  const matchedAdvisor =
    world.advisors.find((a) => a.domain === primaryDomain) ?? world.advisors[0] ?? null;

  // Urgency & tension score
  const isCritical = dossier.dossierClass === 'P0' || dossier.expiresInCycles <= 1;
  const isHigh = !isCritical && dossier.expiresInCycles <= 2;
  const urgency = isCritical
    ? ({ level: 'CRITICAL', label: 'Urgence critique' } as const)
    : isHigh
      ? ({ level: 'HIGH', label: 'Prioritaire' } as const)
      : ({ level: 'NORMAL', label: 'Suivi courant' } as const);

  const tensionPct = isCritical
    ? 92
    : isHigh
      ? 68
      : dossier.dossierClass === 'C5'
        ? 58
        : 42;

  return {
    placeLabel,
    slotIndex: dossier.slotIndex,
    tileIndex: dossier.tileIndex,
    building: matchedDistrict
      ? {
          id: matchedDistrict.id,
          name: matchedDistrict.name,
          integrity: matchedDistrict.integrity,
          modulesCount: matchedDistrict.modulesCount,
        }
      : null,
    advisor: matchedAdvisor
      ? {
          id: matchedAdvisor.id,
          name: matchedAdvisor.name,
          role: matchedAdvisor.role,
          attributeScore: matchedAdvisor.attributeScore,
        }
      : null,
    urgency,
    entityBadge: dossier.scientificTag ?? null,
    tensionPct,
  };
}
