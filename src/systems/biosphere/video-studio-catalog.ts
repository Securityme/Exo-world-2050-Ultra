/**
 * [L1/L3] EXW.L3.VIDEO_STUDIO_CATALOG | v5.0.0 | SADT A4.2/A5.3
 * 12 Climate & Disaster Categories + WebM 3D Camera Shotlists & Storyboards
 * (100% Free-Tier Native WebGL Canvas captureStream(30) + MediaRecorder).
 */
export interface ClimateDisasterVideoSpec {
  readonly id: string;
  readonly label: string;
  readonly category: 'ATMOSPHERIC' | 'GEOPHYSICAL' | 'ORBITAL' | 'ECOLOGICAL';
  readonly severity: 1 | 2 | 3 | 4 | 5;
  readonly targetScale: 1 | 2 | 3;
  readonly weatherPreview: 'CLEAR' | 'DUST_STORM' | 'SOLAR_FLARE' | 'RAIN' | 'CRYO_FRONT';
  readonly durationSec: number;
  readonly cameraBrief: string;
  readonly telemetryTag: string;
}

export const CLIMATE_DISASTER_12_CATALOG: readonly ClimateDisasterVideoSpec[] = Object.freeze([
  { id: 'vid-dust-tempest', label: '1. Tempête de Poussière Continentale', category: 'ATMOSPHERIC', severity: 4, targetScale: 2, weatherPreview: 'DUST_STORM', durationSec: 8, cameraBrief: 'Orbite basse rasant le front de poussière ocre sur les 72 secteurs.', telemetryTag: 'Visibilité -60% · Kits O₂ requis' },
  { id: 'vid-solar-flare', label: '2. Éruption Solaire & Aurores CME', category: 'ORBITAL', severity: 5, targetScale: 1, weatherPreview: 'SOLAR_FLARE', durationSec: 10, cameraBrief: 'Travelling orbital traversant la magnétosphère ionisée.', telemetryTag: 'Blindage Rad · Charge Datacenter' },
  { id: 'vid-cryo-front', label: '3. Front Cryogénique Polaire', category: 'ATMOSPHERIC', severity: 4, targetScale: 2, weatherPreview: 'CRYO_FRONT', durationSec: 8, cameraBrief: 'Survol des calottes givrées et couloirs Maglev dégivrés.', telemetryTag: 'Gel surface · Entretien +18%' },
  { id: 'vid-acid-rain', label: '4. Pluies Acides & Condensation', category: 'ATMOSPHERIC', severity: 3, targetScale: 3, weatherPreview: 'RAIN', durationSec: 8, cameraBrief: 'Plan rasant la cité 24-Hex sous précipitations filtrées.', telemetryTag: 'Corrosion matériaux · Récolte eau' },
  { id: 'vid-seismic-rift', label: '5. Séisme de Faille Tectonique', category: 'GEOPHYSICAL', severity: 5, targetScale: 3, weatherPreview: 'DUST_STORM', durationSec: 9, cameraBrief: 'Caméra épaule sur les fondations parasismiques des ministères.', telemetryTag: 'Intégrité quartiers · Drones S.O.S.' },
  { id: 'vid-cryo-volcano', label: '6. Panache Cryo-Volcanique', category: 'GEOPHYSICAL', severity: 4, targetScale: 2, weatherPreview: 'CRYO_FRONT', durationSec: 9, cameraBrief: 'Plongée verticale sur l’évent minéral et son panache stratosphérique.', telemetryTag: 'Aérosols · Albédo planétaire' },
  { id: 'vid-meteor-shower', label: '7. Pluie de Micrométéorites', category: 'ORBITAL', severity: 4, targetScale: 1, weatherPreview: 'SOLAR_FLARE', durationSec: 8, cameraBrief: 'Suivi cinématique des batteries d’interception orbitales.', telemetryTag: 'Défense Ciel · Bouclier orbital' },
  { id: 'vid-hydro-surge', label: '8. Crue Hydro-Océanique', category: 'ECOLOGICAL', severity: 3, targetScale: 3, weatherPreview: 'RAIN', durationSec: 8, cameraBrief: 'Survol des digues maritimes et des bassins de rétention.', telemetryTag: 'Théâtre Maritime · Réserves Eau' },
  { id: 'vid-pollen-bloom', label: '9. Efflorescence Bio-Spore', category: 'ECOLOGICAL', severity: 2, targetScale: 3, weatherPreview: 'CLEAR', durationSec: 8, cameraBrief: 'Travelling lent au-dessus des fermes hydroponiques lumineuses.', telemetryTag: 'Biosphère +4% · Filtration air' },
  { id: 'vid-jetstream-shear', label: '10. Cisaillement Jet-Stream', category: 'ATMOSPHERIC', severity: 3, targetScale: 2, weatherPreview: 'DUST_STORM', durationSec: 8, cameraBrief: 'Vue haute altitude des courants-jets et turbines éoliennes.', telemetryTag: 'Surproduction énergie · Vol restreint' },
  { id: 'vid-magnetic-drift', label: '11. Dérive Magnétique Polaire', category: 'ORBITAL', severity: 4, targetScale: 1, weatherPreview: 'SOLAR_FLARE', durationSec: 9, cameraBrief: 'Panorama spatial des arcs lumineux polaires autour de Kepler-442b.', telemetryTag: 'Recalibration GPS & Maglev' },
  { id: 'vid-eden-dawn', label: '12. Aube Atmosphère Éden (Air Pur)', category: 'ECOLOGICAL', severity: 1, targetScale: 3, weatherPreview: 'CLEAR', durationSec: 10, cameraBrief: 'Lever de soleil doré sur la cité ouverte respirable et le Maglev civil.', telemetryTag: 'Stade Éden · Vitesse citoyenne +40%' },
]);
