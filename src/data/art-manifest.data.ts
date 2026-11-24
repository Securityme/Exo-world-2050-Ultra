import advCivicImg from '../assets/images/adv_civic_1795249063132.jpg';
import advMntImg from '../assets/images/adv_mnt_1795249065642.jpg';
import advBioImg from '../assets/images/adv_bio_1795249064029.jpg';
import advPolImg from '../assets/images/adv_pol_1795249064111.jpg';
import appIconImg from '../assets/images/app_icon_2050_1795508404595.jpg';
import appThumbnailImg from '../assets/images/app_thumbnail_card_1795508405972.jpg';
import era1Img from '../assets/images/era_1_pioneers_1795249093342.jpg';
import era2Img from '../assets/images/era_2_federation_1795249063535.jpg';
import era3Img from '../assets/images/era_3_symbiosis_1795249063292.jpg';
import era4Img from '../assets/images/era_4_biosphere_1795249093469.jpg';
import era5Img from '../assets/images/era_5_orbital_1795249093506.jpg';
import era6Img from '../assets/images/era_6_transcendence_1795249095427.jpg';
import emblemUeaImg from '../assets/images/emblem_uea_1795249093578.jpg';
import emblemCpaImg from '../assets/images/emblem_cpa_1795249094182.jpg';
import emblemAasImg from '../assets/images/emblem_aas_1795249093617.jpg';
import emblemFneImg from '../assets/images/emblem_fne_1795249093857.jpg';
import emblemPsaImg from '../assets/images/emblem_psa_1795249093417.jpg';
import colonistNadiaImg from '../assets/images/colonist_nadia_1795326067685.jpg';
import colonistKenjiImg from '../assets/images/colonist_kenji_1795326069207.jpg';
import colonistAminaImg from '../assets/images/colonist_amina_1795326069151.jpg';
import colonistLucasImg from '../assets/images/colonist_lucas_1795326067575.jpg';

/**
 * [L1] EXW.ART.MANIFEST | v4.0.0-rc.1 | SADT A5.1
 * Centralized static ES manifest of the 20 V1 generated concept art assets & portraits.
 */
export const ART_MANIFEST = {
  appIcon: appIconImg,
  appThumbnail: appThumbnailImg,
  menuBackground: appThumbnailImg,
  advisors: {
    'adv-ges': advCivicImg,
    'adv-mnt': advMntImg,
    'adv-bio': advBioImg,
    'adv-pol': advPolImg,
  } as Record<string, string>,
  colonists: {
    'col-1': colonistNadiaImg,
    'col-2': colonistKenjiImg,
    'col-3': colonistAminaImg,
    'col-4': colonistLucasImg,
  } as Record<string, string>,
  eras: {
    1: era1Img,
    2: era2Img,
    3: era3Img,
    4: era4Img,
    5: era5Img,
    6: era6Img,
  } as Record<number, string>,
  emblems: {
    'sp-uea': emblemUeaImg,
    'sp-cpa': emblemCpaImg,
    'sp-aas': emblemAasImg,
    'sp-fne': emblemFneImg,
    'sp-psa': emblemPsaImg,
    // Compatibility mapping with existing world.catalog IDs
    'eurasia-solar': emblemUeaImg,
    'pacifica-nexus': emblemCpaImg,
    'afro-helios': emblemAasImg,
    'nordic-cryo': emblemFneImg,
    'andina-bio': emblemPsaImg,
    'atlantis-fed': emblemUeaImg,
  } as Record<string, string>,
} as const;

export function getAdvisorPortrait(advisorId: string): string {
  return ART_MANIFEST.advisors[advisorId] ?? advCivicImg;
}

export function getColonistPortrait(colonistId: string, specialty?: string): string {
  const direct = ART_MANIFEST.colonists[colonistId];
  if (direct) return direct;
  switch (specialty) {
    case 'ENGINEERING':
      return colonistNadiaImg;
    case 'CYBERNETICS':
    case 'SECURITY':
      return colonistKenjiImg;
    case 'EXOBIOLOGY':
      return colonistAminaImg;
    case 'AGRONOMY':
      return colonistLucasImg;
    default: {
      const pool = [colonistNadiaImg, colonistKenjiImg, colonistAminaImg, colonistLucasImg];
      let hash = 0;
      for (let i = 0; i < colonistId.length; i += 1) {
        hash = (hash * 31 + colonistId.charCodeAt(i)) >>> 0;
      }
      return pool[hash % pool.length] ?? colonistNadiaImg;
    }
  }
}

export function getEraBanner(era: number): string {
  return ART_MANIFEST.eras[Math.max(1, Math.min(6, era))] ?? era1Img;
}

export function getSuperpowerEmblem(superpowerId: string): string {
  return ART_MANIFEST.emblems[superpowerId] ?? emblemUeaImg;
}
