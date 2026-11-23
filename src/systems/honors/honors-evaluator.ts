import type {
  CampaignCommanderProfile,
  CampaignTrait,
  MetaPlayerShowcase,
  TerritorialTitle,
} from '../../contracts/honors.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import {
  INITIAL_META_BADGES,
  INITIAL_META_MEDALS,
  INITIAL_META_TITLES,
} from '../../data/honors.catalog.ts';

/**
 * [L3] EXW.L3.HONORS_EVALUATOR | v5.0.0 | SADT A5.1
 * Pure deterministic evaluators for:
 * - Tier 1: Multi-Campaign Meta Showcase (CoD / Foundation / Humankind)
 * - Tier 2: Active Campaign CK3 Commander Hierarchy (Attributes, Traits, Territorial Titles)
 */
export function createDefaultMetaShowcase(updatedAtIso = '2050-01-01T00:00:00.000Z'): MetaPlayerShowcase {
  return {
    callsign: 'Baptiste',
    avatarPresetId: 'cmd-solaris',
    customAvatarDataUrl: null,
    bannerStyleId: 'ASTRAL_ROSE',
    emblemId: 'FOUNDER_PRISM',
    equippedTitleId: 'title-founder-2050',
    pinnedBadgeIds: [
      'badge-integral-vision',
      'badge-pioneer-2050',
      'badge-thomist-common-good',
      'badge-urban-maglev',
    ],
    campaignsPlayed: 1,
    totalTurnsSimulated: 0,
    totalDecisionsSigned: 0,
    medals: INITIAL_META_MEDALS.map((m) => ({ ...m })),
    badges: INITIAL_META_BADGES.map((b) => ({ ...b })),
    titles: INITIAL_META_TITLES.map((t) => ({ ...t })),
    updatedAtIso,
  };
}

/**
 * Merges newly added catalog medals, badges, and titles into an existing persisted showcase
 * so returning players automatically receive catalog expansions without losing progress.
 */
export function mergeCatalogHonors(saved: MetaPlayerShowcase): MetaPlayerShowcase {
  const savedMedalMap = new Map(saved.medals.map((m) => [m.id, m]));
  const medals = INITIAL_META_MEDALS.map((catalogMedal) => {
    const existing = savedMedalMap.get(catalogMedal.id);
    if (!existing) return { ...catalogMedal };
    return {
      ...catalogMedal,
      unlocked: existing.unlocked || catalogMedal.unlocked,
      progressCurrent: Math.max(existing.progressCurrent, catalogMedal.progressCurrent),
      unlockedAtIso: existing.unlockedAtIso ?? catalogMedal.unlockedAtIso,
    };
  });

  const savedBadgeMap = new Map(saved.badges.map((b) => [b.id, b]));
  const badges = INITIAL_META_BADGES.map((catalogBadge) => {
    const existing = savedBadgeMap.get(catalogBadge.id);
    if (!existing) return { ...catalogBadge };
    return {
      ...catalogBadge,
      unlocked: existing.unlocked || catalogBadge.unlocked,
    };
  });

  const savedTitleMap = new Map(saved.titles.map((t) => [t.id, t]));
  const titles = INITIAL_META_TITLES.map((catalogTitle) => {
    const existing = savedTitleMap.get(catalogTitle.id);
    if (!existing) return { ...catalogTitle };
    return {
      ...catalogTitle,
      unlocked: existing.unlocked || catalogTitle.unlocked,
    };
  });

  return {
    ...saved,
    medals,
    badges,
    titles,
  };
}

export function evaluateMetaShowcaseFromWorld(
  showcase: MetaPlayerShowcase,
  world: WorldState,
  updatedAtIso = showcase.updatedAtIso,
): MetaPlayerShowcase {
  const merged = mergeCatalogHonors(showcase);
  const edenUnlocked = world.atmosphereTier === 'P4' || world.atmosphereProgress >= 90;
  const p2Unlocked = world.atmosphereTier !== 'P1' || world.atmosphereProgress >= 40;
  const diploUnlocked = world.superAllianceTrust >= 85;
  const allianceTop2 = world.superAllianceRank <= 2;
  const philosophyDecisions = Math.max(merged.totalDecisionsSigned, world.chronicle.length);
  const approvalPct = Math.round(world.approval);
  const districtsCount = world.districts.length;
  const creditsCount = Math.round(world.resources.credits);
  const techCount = world.hk?.unlockedTechIds.length ?? 0;
  const fleetCount = world.fleetShips?.length ?? 0;
  const activeTheaters = new Set(
    world.militaryRoster
      .filter((u) => u.count > 0)
      .map((u) => {
        if (u.unitClass === 'ORBITAL_CORVETTE') return 'SPACE';
        if (u.unitClass === 'DRONE_SWARM') return 'AIR';
        if (u.unitClass === 'ARMOR_MECH' || u.unitClass === 'INFANTRY_EXO') return 'GROUND';
        return 'CYBER';
      }),
  ).size;

  const progressByMedalId: Readonly<Record<string, { current: number; forceUnlock?: boolean }>> = {
    'medal-exo-cartographer': { current: world.capturedTiles.length },
    'medal-multiworld-pioneer': { current: world.unlockedSlots },
    'medal-atmosphere-p2': { current: Math.round(world.atmosphereProgress), forceUnlock: p2Unlocked },
    'medal-eden-architect': { current: Math.round(world.atmosphereProgress), forceUnlock: edenUnlocked },
    'medal-civic-philosopher': { current: philosophyDecisions },
    'medal-ethical-beacon': { current: approvalPct, forceUnlock: approvalPct >= 80 },
    'medal-stellar-diplomat': { current: Math.round(world.superAllianceTrust), forceUnlock: diploUnlocked },
    'medal-alliance-primacy': { current: allianceTop2 ? 1 : 0, forceUnlock: allianceTop2 },
    'medal-fleet-vanguard': { current: fleetCount },
    'medal-four-theaters': { current: activeTheaters, forceUnlock: activeTheaters >= 4 },
    'medal-urban-architect': { current: districtsCount },
    'medal-solar-treasury': { current: creditsCount },
    'medal-quantum-compute': { current: world.datacenterTier },
    'medal-era-vanguard': { current: techCount },
  };

  const medals = merged.medals.map((m) => {
    const evalEntry = progressByMedalId[m.id];
    if (!evalEntry) return m;
    const progressCurrent = Math.max(m.progressCurrent, Math.max(0, evalEntry.current));
    const unlocked = m.unlocked || Boolean(evalEntry.forceUnlock) || progressCurrent >= m.progressTarget;
    return {
      ...m,
      progressCurrent,
      unlocked,
      unlockedAtIso: unlocked ? m.unlockedAtIso ?? updatedAtIso : null,
    };
  });

  const badges = merged.badges.map((b) => {
    if (b.unlocked) return b;
    if (b.id === 'badge-quantum-grid' && world.datacenterTier >= 2) return { ...b, unlocked: true };
    if (b.id === 'badge-eden-breath' && edenUnlocked) return { ...b, unlocked: true };
    if (b.id === 'badge-solar-treasurer' && creditsCount >= 2500) return { ...b, unlocked: true };
    if (b.id === 'badge-fleet-admiral' && activeTheaters >= 4) return { ...b, unlocked: true };
    return b;
  });

  const titles = merged.titles.map((t) => {
    if (t.unlocked) return t;
    if (t.id === 'title-open-sky-architect' && districtsCount >= 6) return { ...t, unlocked: true };
    if (t.id === 'title-quantum-savant' && (techCount >= 4 || world.datacenterTier >= 2)) {
      return { ...t, unlocked: true };
    }
    if (t.id === 'title-eden-shepherd' && edenUnlocked) return { ...t, unlocked: true };
    if (t.id === 'title-civic-luminary' && approvalPct >= 80) return { ...t, unlocked: true };
    if (t.id === 'title-federal-envoy' && diploUnlocked) return { ...t, unlocked: true };
    if (t.id === 'title-grand-strategist' && (activeTheaters >= 4 || merged.campaignsPlayed >= 3)) {
      return { ...t, unlocked: true };
    }
    return t;
  });

  return {
    ...merged,
    totalTurnsSimulated: Math.max(merged.totalTurnsSimulated, world.cycle),
    totalDecisionsSigned: philosophyDecisions,
    medals,
    badges,
    titles,
    updatedAtIso,
  };
}

export function evaluateCampaignCommanderProfile(world: WorldState): CampaignCommanderProfile {
  const traits: CampaignTrait[] = [];

  if (world.atmosphereProgress >= 40 || (world.spectra?.ecologyVsIndustry ?? 0) >= 15) {
    traits.push({
      id: 'trait-eden-steward',
      label: "Intendant d'Éden",
      category: 'ECOLOGY',
      bonusSummary: '+2 Érudition · +1 Intendance (biosphère & kits O₂)',
      attributeModifiers: { diplomacy: 0, martial: 0, stewardship: 1, intrigue: 0, learning: 2 },
    });
  }
  if (world.approval >= 68) {
    traits.push({
      id: 'trait-thomist-prudent',
      label: 'Prudence Civique (Bien Commun)',
      category: 'ETHICS',
      bonusSummary: '+2 Diplomatie · +1 Intendance (approbation & promesses)',
      attributeModifiers: { diplomacy: 2, martial: 0, stewardship: 1, intrigue: 0, learning: 0 },
    });
  }
  if (world.combatReports.length > 0 || world.militaryRoster.reduce((a, u) => a + u.count, 0) >= 18) {
    traits.push({
      id: 'trait-orbital-tactician',
      label: 'Tacticien des 4 Théâtres',
      category: 'MILITARY',
      bonusSummary: '+2 Martial · +1 Intrigue (logistique & cyberguerre)',
      attributeModifiers: { diplomacy: 0, martial: 2, stewardship: 0, intrigue: 1, learning: 0 },
    });
  }
  if ((world.hk?.unlockedTechIds.length ?? 0) >= 2) {
    traits.push({
      id: 'trait-architect-2050',
      label: 'Architecte Scientifique 2050',
      category: 'SCIENCE',
      bonusSummary: '+2 Érudition · +1 Intrigue (vitesse recherche)',
      attributeModifiers: { diplomacy: 0, martial: 0, stewardship: 0, intrigue: 1, learning: 2 },
    });
  }
  if (traits.length === 0) {
    traits.push({
      id: 'trait-founding-commander',
      label: 'Architecte Fondateur',
      category: 'GOVERNANCE',
      bonusSummary: '+1 à tous les attributs souverains',
      attributeModifiers: { diplomacy: 1, martial: 1, stewardship: 1, intrigue: 1, learning: 1 },
    });
  }

  const baseDip = 9 + Math.floor(world.superAllianceTrust / 18) + Math.floor(world.xp.alliance / 80);
  const baseMar = 8 + Math.min(8, Math.floor(world.militaryRoster.reduce((a, u) => a + u.count, 0) / 6));
  const baseSte = 10 + Math.min(8, world.districts.length) + Math.floor(world.xp.civilization / 90);
  const baseInt = 8 + Math.min(7, world.datacenterTier + Math.floor(world.drones.recon / 3));
  const baseLea = 10 + Math.min(8, (world.hk?.unlockedTechIds.length ?? 1) * 2);

  const bonus = traits.reduce(
    (acc, tr) => ({
      diplomacy: acc.diplomacy + tr.attributeModifiers.diplomacy,
      martial: acc.martial + tr.attributeModifiers.martial,
      stewardship: acc.stewardship + tr.attributeModifiers.stewardship,
      intrigue: acc.intrigue + tr.attributeModifiers.intrigue,
      learning: acc.learning + tr.attributeModifiers.learning,
    }),
    { diplomacy: 0, martial: 0, stewardship: 0, intrigue: 0, learning: 0 },
  );

  const clampAttr = (v: number) => Math.max(1, Math.min(30, v));

  const territorialTitles: TerritorialTitle[] = [
    {
      id: 'title-sector-12',
      rank: 'SECTOR_WARDEN',
      titleName: 'Gardien du Secteur Fondateur #12',
      territoryLabel: 'Crête d’Atterrissage #12',
      prestigeBonus: 25,
    },
    {
      id: 'title-city-gov',
      rank: 'CITY_GOVERNOR',
      titleName: `Gouverneur de ${world.districts[0]?.name ?? 'Cité Ouverte'}`,
      territoryLabel: `${world.districts.length} quartiers actifs`,
      prestigeBonus: 50,
    },
  ];
  if (world.capturedTiles.length >= 6 || world.era >= 2) {
    territorialTitles.push({
      id: 'title-planetary-archon',
      rank: 'PLANETARY_ARCHON',
      titleName: 'Archonte Planétaire de Kepler-442b',
      territoryLabel: `${world.capturedTiles.length}/72 secteurs souverains`,
      prestigeBonus: 120,
    });
  }
  if (world.unlockedSlots >= 2 || world.era >= 4) {
    territorialTitles.push({
      id: 'title-stellar-consul',
      rank: 'STELLAR_CONSUL',
      titleName: 'Consul Interstellaire des Mondes Unis',
      territoryLabel: `${world.unlockedSlots}/6 mondes débloqués`,
      prestigeBonus: 240,
    });
  }

  return {
    attributes: {
      diplomacy: clampAttr(baseDip + bonus.diplomacy),
      martial: clampAttr(baseMar + bonus.martial),
      stewardship: clampAttr(baseSte + bonus.stewardship),
      intrigue: clampAttr(baseInt + bonus.intrigue),
      learning: clampAttr(baseLea + bonus.learning),
    },
    traits,
    territorialTitles,
    activePrimaryTitleId: territorialTitles[territorialTitles.length - 1]!.id,
  };
}
