/**
 * [L1] R-50 Strict Scientific Nomenclature Constants.
 * Prohibits the generic forbidden term (pattern assembled dynamically) and prescribes scientific replacements.
 */
export const NOMENCLATURE_CONSTANTS = Object.freeze({
  FORBIDDEN_PATTERN_SOURCE: '\\banomal' + '(?:ie|ies|y)\\b',
  APPROVED_REPLACEMENTS: Object.freeze([
    'Fosse Hydrothermale Active',
    'Faille Magnétique Sub-Croûtale',
    'Poche Microbienne Extrêmophile',
    'Gisement d’Isotopes Piégés',
    'Rupture Thermodynamique',
    'Singularité Géodésique',
  ] as const),
});
