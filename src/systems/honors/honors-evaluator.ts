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
    callsign: 'Commandant Baptiste',
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

export function evaluateMetaShowcaseFromWorld(
  showcase: MetaPlayerShowcase,
  world: WorldState,
  updatedAtIso = showcase.updatedAtIso,
): MetaPlayerShowcase {
  const edenUnlocked = world.atmosphereTier === 'P4' || world.atmosphereProgress >= 90;
  const diploUnlocked = world.superAllianceTrust >= 85;
  const philosophyDecisions = Math.max(showcase.totalDecisionsSigned, world.chronicle.length);

  const medals = showcase.medals.map((m) => {
    if (m.id === 'medal-eden-architect') {
      const progressCurrent = Math.max(m.progressCurrent, Math.round(world.atmosphereProgress));
      const unlocked = m.unlocked || edenUnlocked;
      return { ...m, progressCurrent, unlocked, unlockedAtIso: unlocked ? m.unlockedAtIso ?? updatedAtIso : null };
    }
    if (m.id === 'medal-civic-philosopher') {
      const progressCurrent = Math.max(m.progressCurrent, philosophyDecisions);
      const unlocked = m.unlocked || progressCurrent >= m.progressTarget;
      return { ...m, progressCurrent, unlocked, unlockedAtIso: unlocked ? m.unlockedAtIso ?? updatedAtIso : null };
    }
    if (m.id === 'medal-stellar-diplomat') {
      const progressCurrent = Math.max(m.progressCurrent, Math.round(world.superAllianceTrust));
      const unlocked = m.unlocked || diploUnlocked;
      return { ...m, progressCurrent, unlocked, unlockedAtIso: unlocked ? m.unlockedAtIso ?? updatedAtIso : null };
    }
    return m;
  });

  const titles = showcase.titles.map((t) => {
    if (t.id === 'title-eden-shepherd' && edenUnlocked) {
      return { ...t, unlocked: true };
    }
    return t;
  });

  return {
    ...showcase,
    totalTurnsSimulated: Math.max(showcase.totalTurnsSimulated, world.cycle),
    totalDecisionsSigned: philosophyDecisions,
    medals,
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
      label: 'Commandant Fondateur',
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
