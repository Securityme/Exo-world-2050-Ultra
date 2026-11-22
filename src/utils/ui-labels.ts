import type { SubPaDomain } from '../contracts/pa-dossiers.schema.ts';

/**
 * [L5] Grounded French UI display labels (replaces raw technical codes & fantasy jargon
 * in visible UI while keeping L0/L3 canonical identifiers untouched).
 */
export function formatSubPaDomain(domain: SubPaDomain | null | undefined): string {
  switch (domain) {
    case 'PA_GES':
      return 'Gestion';
    case 'PA_MNT':
      return 'Technique';
    case 'PA_BIO':
      return 'Climat';
    case 'PA_POL':
      return 'Politique';
    default:
      return 'PA Généraux';
  }
}

export function formatDossierCategory(dossierClass: string): string {
  switch (dossierClass) {
    case 'P0':
      return 'Urgent';
    case 'C1':
      return 'Politique';
    case 'C2':
      return 'Économie';
    case 'C3':
      return 'Technique';
    case 'C4':
      return 'Climat';
    case 'C5':
      return 'Sécurité';
    default:
      return 'Événement';
  }
}

export function formatOrientationTag(tag: string): string {
  switch (tag) {
    case 'SOLARPUNK':
      return 'Écologie';
    case 'CORPORATE':
      return 'Économie';
    case 'FEDERAL':
      return 'Public';
    case 'SECURITY':
      return 'Sécurité';
    case 'SCIENTIFIC':
      return 'Recherche';
    default:
      return tag;
  }
}

export function formatSkillAttribute(attr: string): string {
  switch (attr) {
    case 'engineering':
      return 'Ingénierie';
    case 'diplomacy':
      return 'Diplomatie';
    case 'ecology':
      return 'Écologie';
    case 'cyber':
      return 'Informatique';
    case 'strategy':
      return 'Stratégie';
    default:
      return attr;
  }
}

export function formatDistrictKind(kind: string): string {
  switch (kind) {
    case 'COMMAND':
      return 'Administration';
    case 'HABITAT':
      return 'Logements';
    case 'ENERGY':
      return 'Énergie';
    case 'INDUSTRY':
      return 'Industrie';
    case 'DATACENTER':
      return 'Informatique';
    case 'BIOPARK':
      return 'Écologie';
    default:
      return kind;
  }
}
