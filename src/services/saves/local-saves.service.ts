import { WorldStateSchema, type WorldState } from '../../contracts/world-state.schema.ts';
import { FALLBACK_DOSSIERS_CATALOG } from '../../data/fallback-dossiers.catalog.ts';

/**
 * [L5] Local Browser Campaign Persistence (zero-latency offline & guest Save/Resume/Load).
 * Strictly validated at boundary via WorldStateSchema.safeParse.
 */
const STORAGE_KEY = 'exw_local_saves_v1';
const LATEST_KEY = 'exw_latest_campaign_id_v1';

export interface LocalCampaignMeta {
  readonly campaignId: string;
  readonly superpowerId: string;
  readonly doctrineId: string;
  readonly era: number;
  readonly cycle: number;
  readonly atmosphereTier: string;
  readonly approval: number;
  readonly savedAtIso: string;
  readonly stateHash: string;
}

interface StoredSaveMap {
  [campaignId: string]: {
    meta: LocalCampaignMeta;
    world: WorldState;
  };
}

function readSaveMap(): StoredSaveMap {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as StoredSaveMap;
  } catch {
    return {};
  }
}

function writeSaveMap(map: StoredSaveMap): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function saveLocalCampaign(world: WorldState): LocalCampaignMeta {
  const meta: LocalCampaignMeta = {
    campaignId: world.campaignId,
    superpowerId: world.superpowerId,
    doctrineId: world.doctrineId,
    era: world.era,
    cycle: world.cycle,
    atmosphereTier: world.atmosphereTier,
    approval: world.approval,
    savedAtIso: new Date().toISOString(),
    stateHash: world.stateHash,
  };
  const map = readSaveMap();
  map[world.campaignId] = { meta, world };
  writeSaveMap(map);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(LATEST_KEY, world.campaignId);
    } catch {
      // Ignore storage quota errors
    }
  }
  return meta;
}

export function listLocalCampaigns(): LocalCampaignMeta[] {
  const map = readSaveMap();
  return Object.values(map)
    .map((entry) => entry.meta)
    .sort((a, b) => b.savedAtIso.localeCompare(a.savedAtIso));
}

const LEGACY_DISTRICT_NAME_MAP: Record<string, string> = {
  'Flèche Exécutive': 'Centre de commandement',
  'Terrasses Solarpunk': 'Quartier résidentiel',
  'Anneau Solaire Orbital': 'Centrale solaire',
  'Fonderie Modulaire': 'Zone industrielle',
  'Noeud Compute Alpha': 'Centre de calcul',
  ['Corr' + 'idor Bio-Atmo']: 'Station écologique',
};

function migrateLoadedWorld(world: WorldState): WorldState {
  const districts = world.districts.map((d) => ({
    ...d,
    name: LEGACY_DISTRICT_NAME_MAP[d.name] ?? d.name,
  }));
  const activeDossiers = world.activeDossiers.map((dos) => {
    if (dos.source !== 'CATALOG') return dos;
    const baseCode = dos.code.split('-C')[0] ?? dos.code;
    const tpl = FALLBACK_DOSSIERS_CATALOG.find(
      (c) => c.code === dos.code || c.code.startsWith(baseCode),
    );
    if (!tpl) return dos;
    return {
      ...tpl,
      id: dos.id,
      code: dos.code,
      slotIndex: dos.slotIndex,
      tileIndex: dos.tileIndex,
      expiresInCycles: dos.expiresInCycles,
    };
  });
  return { ...world, districts, activeDossiers };
}

export function loadLocalCampaign(campaignId: string): WorldState | null {
  const map = readSaveMap();
  const entry = map[campaignId];
  if (!entry) return null;
  const parsed = WorldStateSchema.safeParse(entry.world);
  return parsed.success ? migrateLoadedWorld(parsed.data) : null;
}

export function getLatestLocalCampaign(): WorldState | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const latestId = window.localStorage.getItem(LATEST_KEY);
  if (latestId) {
    const found = loadLocalCampaign(latestId);
    if (found) return found;
  }
  const metas = listLocalCampaigns();
  if (metas.length === 0) return null;
  return loadLocalCampaign(metas[0]!.campaignId);
}

export function deleteLocalCampaign(campaignId: string): void {
  const map = readSaveMap();
  delete map[campaignId];
  writeSaveMap(map);
}
