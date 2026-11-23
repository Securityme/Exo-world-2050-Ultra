import avatarSolarisImg from '../assets/images/avatar_solaris_architect_1795389824486.jpg';
import avatarLyraImg from '../assets/images/avatar_lyra_biosphere_1795389825741.jpg';
import avatarKaneImg from '../assets/images/avatar_kane_admiral_1795389824245.jpg';
import avatarNovaImg from '../assets/images/avatar_nova_diplomat_1795389824787.jpg';
import avatarAquinImg from '../assets/images/avatar_aquin_savant_1795389824187.jpg';
import avatarKeplerImg from '../assets/images/avatar_kepler_pioneer_1795389824795.jpg';
import avatarVegaImg from '../assets/images/avatar_vega_quantum_1795389823886.jpg';
import avatarOrionImg from '../assets/images/avatar_orion_explorer_1795389825267.jpg';
import advCivicImg from '../assets/images/adv_civic_1795249063132.jpg';
import advBioImg from '../assets/images/adv_bio_1795249064029.jpg';
import colonistNadiaImg from '../assets/images/colonist_nadia_1795326067685.jpg';
import colonistKenjiImg from '../assets/images/colonist_kenji_1795326069207.jpg';

/**
 * [L1] EXW.L1.AVATAR_PORTRAITS_ASSETS | v5.1.0 | SADT A5.1
 * Browser/Vite image resolver for Profile Portrait Presets (keeps honors.catalog.ts Node-pure).
 */
export const AVATAR_PORTRAIT_MAP: Readonly<Record<string, string>> = Object.freeze({
  'cmd-solaris': avatarSolarisImg,
  'archon-lyra': avatarLyraImg,
  'consul-kane': avatarKaneImg,
  'director-nova': avatarNovaImg,
  'savant-aquin': avatarAquinImg,
  'pioneer-kepler': avatarKeplerImg,
  'engineer-vega': avatarVegaImg,
  'explorer-orion': avatarOrionImg,
  'cabinet-civic': advCivicImg,
  'cabinet-bio': advBioImg,
  'field-nadia': colonistNadiaImg,
  'field-kenji': colonistKenjiImg,
});

export function resolveAvatarPresetImage(presetId: string): string | null {
  return AVATAR_PORTRAIT_MAP[presetId] ?? null;
}
