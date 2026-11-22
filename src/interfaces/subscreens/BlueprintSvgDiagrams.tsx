/**
 * [L7 — ATLAS STRATÉGIQUE]
 * Schémas vectoriels SVG : Actigramme, Datagramme des flux, Carte en étoile,
 * Pyramide temporelle et Plan orbital & combat.
 */
export type BlueprintDiagramId = 'SADT_ACTIGRAM' | 'ICOM_DATAGRAM' | 'STAR_MATRIX' | 'CYCLE_PYRAMID' | 'ORBITAL_PLAN';

export function BlueprintSvgDiagram({ activeId }: { readonly activeId: BlueprintDiagramId }) {
  if (activeId === 'SADT_ACTIGRAM') {
    const nodes = [
      { id: 'A1', x: 86, y: 120, title: 'A1 · Horloge Temps', sub: 'Cadence & Empreinte', color: '#E11D48', ctrl: 'C: Graine du Monde', mech: 'M: Simulation Pur' },
      { id: 'A2', x: 280, y: 120, title: 'A2 · Dossiers & PA', sub: 'Arbitrage & Conseillers', color: '#D97706', ctrl: 'C: Budget PA', mech: 'M: Validation Stricte' },
      { id: 'A3', x: 474, y: 120, title: 'A3 · Mondes & Biomes', sub: 'Paliers P1..P4 & Cités', color: '#059669', ctrl: 'C: Ciel Ouvert', mech: 'M: Modèle Urbain' },
      { id: 'A4', x: 668, y: 120, title: 'A4 · Crises & Combats', sub: 'Événements & 4 Phases', color: '#9333EA', ctrl: 'C: Équilibrage ±15%', mech: 'M: Moteur Tactique' },
      { id: 'A5', x: 862, y: 120, title: 'A5 · Scène 3D & Audio', sub: '3 Échelles & Radio', color: '#BE123C', ctrl: 'C: Lecture Seule', mech: 'M: Moteur Spatial 3D' },
    ];
    return (
      <svg viewBox="0 0 1070 375" className="h-auto w-full rounded-xl border border-rose-200 bg-[#fff9fb]">
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#9D174D" />
          </marker>
          <marker id="arrRose" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#E11D48" />
          </marker>
        </defs>
        <text x="20" y="28" fill="#881337" fontSize="12" fontWeight="bold" fontFamily="monospace">
          ACTIGRAMME OPÉRATIONNEL — PILOTER LA CIVILISATION MULTI-MONDES
        </text>

        <line x1="14" y1="168" x2="82" y2="168" stroke="#E11D48" strokeWidth="2" markerEnd="url(#arrRose)" />
        <text x="14" y="154" fill="#BE123C" fontSize="10" fontFamily="monospace">I: Décision</text>

        {nodes.map((n, i) => {
          const cx = n.x + 84;
          return (
            <g key={n.id}>
              <line x1={cx} y1="68" x2={cx} y2="118" stroke="#D97706" strokeWidth="1.5" markerEnd="url(#arr)" />
              <text x={cx} y="58" textAnchor="middle" fill="#B45309" fontSize="10" fontFamily="monospace">
                {n.ctrl}
              </text>

              <rect x={n.x} y={n.y} width="168" height="96" rx="8" fill="#FFFFFF" stroke={n.color} strokeWidth="2" />
              <text x={n.x + 12} y={n.y + 28} fill={n.color} fontSize="10.5" fontWeight="bold" fontFamily="monospace">
                {n.title}
              </text>
              <text x={n.x + 12} y={n.y + 52} fill="#1F1224" fontSize="10.5">
                {n.sub}
              </text>
              <text x={n.x + 140} y={n.y + 84} fill="#9F1239" fillOpacity="0.45" fontSize="10.5" fontFamily="monospace">
                {n.id}
              </text>

              {i < nodes.length - 1 && (
                <line
                  x1={n.x + 168}
                  y1={n.y + 48}
                  x2={n.x + 192}
                  y2={n.y + 48}
                  stroke="#E11D48"
                  strokeWidth="2"
                  markerEnd="url(#arrRose)"
                />
              )}

              <line x1={cx} y1="296" x2={cx} y2="218" stroke="#059669" strokeWidth="1.5" markerEnd="url(#arr)" />
              <text x={cx} y="314" textAnchor="middle" fill="#047857" fontSize="10" fontFamily="monospace">
                {n.mech}
              </text>
            </g>
          );
        })}

        <path
          d="M 1030 168 L 1052 168 L 1052 355 L 48 355 L 48 184 L 82 184"
          fill="none"
          stroke="#FB7185"
          strokeDasharray="5 5"
          strokeWidth="1.5"
          markerEnd="url(#arr)"
        />
        <text x="535" y="347" textAnchor="middle" fill="#881337" fontSize="10" fontFamily="monospace">
          O: État du Monde Certifié + Sauvegarde Cloud + Retours Scène 3D (boucle fermée)
        </text>
      </svg>
    );
  }

  if (activeId === 'ICOM_DATAGRAM') {
    return (
      <svg viewBox="0 0 980 370" className="h-auto w-full rounded-xl border border-rose-200 bg-[#fff9fb]">
        <text x="20" y="28" fill="#881337" fontSize="12" fontWeight="bold" fontFamily="monospace">
          DATAGRAMME DES FLUX — ÉTAT DU MONDE, BUS D’ORDRES &amp; ENCLAVE DOCUMENTAIRE
        </text>
        <rect x="40" y="65" width="230" height="90" rx="8" fill="#FFFFFF" stroke="#E11D48" strokeWidth="2" />
        <text x="56" y="92" fill="#E11D48" fontSize="12" fontWeight="bold" fontFamily="monospace">État du Monde</text>
        <text x="56" y="114" fill="#1F1224" fontSize="11">Graine · PA · Quartiers · Rivaux</text>
        <text x="56" y="134" fill="#9F1239" fillOpacity="0.7" fontSize="10" fontFamily="monospace">Empreinte vérifiée / cycle</text>

        <rect x="375" y="65" width="230" height="90" rx="8" fill="#FFFFFF" stroke="#D97706" strokeWidth="2" />
        <text x="391" y="92" fill="#B45309" fontSize="12" fontWeight="bold" fontFamily="monospace">Bus de Décrets</text>
        <text x="391" y="114" fill="#1F1224" fontSize="11">Contrôle strict · Max 2 urgences</text>
        <text x="391" y="134" fill="#9F1239" fillOpacity="0.7" fontSize="10" fontFamily="monospace">Gestion d’erreurs sûre</text>

        <rect x="710" y="65" width="230" height="90" rx="8" fill="#FFFFFF" stroke="#9333EA" strokeWidth="2" />
        <text x="726" y="92" fill="#7E22CE" fontSize="12" fontWeight="bold" fontFamily="monospace">Générateur Événements</text>
        <text x="726" y="114" fill="#1F1224" fontSize="11">Graphe narratif contrôlé</text>
        <text x="726" y="134" fill="#9F1239" fillOpacity="0.7" fontSize="10" fontFamily="monospace">Repli local instantané</text>

        <rect x="40" y="230" width="270" height="95" rx="8" fill="#FFFFFF" stroke="#BE123C" strokeWidth="2" />
        <text x="56" y="257" fill="#BE123C" fontSize="12" fontWeight="bold" fontFamily="monospace">Flux Scène 3D</text>
        <text x="56" y="279" fill="#1F1224" fontSize="11">Échelles 1/2/3 · 72 tuiles · P1..P4</text>
        <text x="56" y="299" fill="#9F1239" fillOpacity="0.7" fontSize="10" fontFamily="monospace">Adaptateur spatial découplé</text>

        <rect x="355" y="230" width="270" height="95" rx="8" fill="#FFFFFF" stroke="#059669" strokeWidth="2" />
        <text x="371" y="257" fill="#047857" fontSize="12" fontWeight="bold" fontFamily="monospace">Sauvegarde Cloud</text>
        <text x="371" y="279" fill="#1F1224" fontSize="11">Compte Commandant · Campagnes</text>
        <text x="371" y="299" fill="#9F1239" fillOpacity="0.7" fontSize="10" fontFamily="monospace">Archives locales + Cloud privé</text>

        <rect x="670" y="230" width="270" height="95" rx="8" fill="#FFF1F2" stroke="#E11D48" strokeWidth="2" strokeDasharray="6 4" />
        <text x="686" y="257" fill="#BE123C" fontSize="12" fontWeight="bold" fontFamily="monospace">ENCLAVE DOCUMENTAIRE</text>
        <text x="686" y="279" fill="#1F1224" fontSize="11">Lecture dossier + Google Docs</text>
        <text x="686" y="299" fill="#9F1239" fontSize="10" fontFamily="monospace">0 couplage avec la simulation</text>

        <line x1="270" y1="110" x2="375" y2="110" stroke="#E11D48" strokeWidth="2" />
        <line x1="605" y1="110" x2="710" y2="110" stroke="#9333EA" strokeWidth="2" />
        <line x1="155" y1="155" x2="155" y2="230" stroke="#BE123C" strokeWidth="2" />
        <line x1="220" y1="155" x2="450" y2="230" stroke="#059669" strokeWidth="2" />
      </svg>
    );
  }

  if (activeId === 'STAR_MATRIX') {
    const branches = [
      { code: 'PILIER I', label: 'Boucle & Points d’Action', x: 165, y: 80, color: '#E11D48' },
      { code: 'PILIER II', label: 'Biomes P1..P4 & Colons', x: 785, y: 80, color: '#059669' },
      { code: 'PILIER III', label: 'Villes Ciel Ouvert & Finance', x: 145, y: 290, color: '#D97706' },
      { code: 'PILIER IV', label: 'Combats 4P · Rivaux · Crises', x: 785, y: 290, color: '#9333EA' },
      { code: 'PILIER V', label: 'Scène 3D · Audio · UI', x: 490, y: 315, color: '#BE123C' },
    ];
    return (
      <svg viewBox="0 0 980 370" className="h-auto w-full rounded-xl border border-rose-200 bg-[#fff9fb]">
        <text x="20" y="28" fill="#881337" fontSize="12" fontWeight="bold" fontFamily="monospace">
          CARTE EN ÉTOILE — NOYAU CENTRAL &amp; 5 PILIERS DE JEU
        </text>
        {branches.map((b) => (
          <g key={b.code}>
            <line x1="490" y1="168" x2={b.x} y2={b.y} stroke={b.color} strokeWidth="2" strokeOpacity="0.65" />
            <rect x={b.x - 115} y={b.y - 30} width="230" height="58" rx="8" fill="#FFFFFF" stroke={b.color} strokeWidth="2" />
            <text x={b.x - 100} y={b.y - 6} fill={b.color} fontSize="12" fontWeight="bold" fontFamily="monospace">
              {b.code}
            </text>
            <text x={b.x - 100} y={b.y + 14} fill="#1F1224" fontSize="11">
              {b.label}
            </text>
          </g>
        ))}
        <circle cx="490" cy="168" r="58" fill="#FFF1F2" stroke="#E11D48" strokeWidth="3" />
        <text x="454" y="162" fill="#881337" fontSize="13" fontWeight="bold" fontFamily="monospace">NOYAU</text>
        <text x="438" y="182" fill="#E11D48" fontSize="10" fontFamily="monospace">Simulation Pure</text>
      </svg>
    );
  }

  if (activeId === 'CYCLE_PYRAMID') {
    const levels = [
      { n: 'N5', w: 240, y: 52, text: 'N5 · Campagne (40-60 cycles) → Infini', color: '#9333EA' },
      { n: 'N4', w: 360, y: 102, text: 'N4 · Paliers P1..P4 & Ères I..VI', color: '#E11D48' },
      { n: 'N3', w: 480, y: 152, text: 'N3 · Année Fédérale (360 instants / 24 cycles)', color: '#059669' },
      { n: 'N2', w: 600, y: 202, text: 'N2 · Mois & Saison planétaire', color: '#D97706' },
      { n: 'N1', w: 720, y: 252, text: 'N1 · Cycle Décisionnel (15 instants · PA & Chronique)', color: '#BE123C' },
      { n: 'N0', w: 840, y: 302, text: 'N0 · Instant Atomique & Animation Scène 3D', color: '#64748B' },
    ];
    return (
      <svg viewBox="0 0 980 370" className="h-auto w-full rounded-xl border border-rose-200 bg-[#fff9fb]">
        <text x="20" y="28" fill="#881337" fontSize="12" fontWeight="bold" fontFamily="monospace">
          PYRAMIDE TEMPORELLE MULTI-CYCLES — DE L’INSTANT 3D À LA CAMPAGNE
        </text>
        {levels.map((lv) => (
          <g key={lv.n}>
            <rect
              x={490 - lv.w / 2}
              y={lv.y}
              width={lv.w}
              height="40"
              rx="6"
              fill="#FFFFFF"
              stroke={lv.color}
              strokeWidth="2"
            />
            <text x="490" y={lv.y + 25} textAnchor="middle" fill="#1F1224" fontSize="12" fontFamily="monospace">
              {lv.text}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 980 370" className="h-auto w-full rounded-xl border border-rose-200 bg-[#fff9fb]">
      <text x="20" y="28" fill="#881337" fontSize="12" fontWeight="bold" fontFamily="monospace">
        PLAN ORBITAL (6 MONDES) &amp; RÉSOLUTION TACTIQUE EN 4 PHASES
      </text>
      <g transform="translate(230, 195)">
        <circle cx="0" cy="0" r="135" fill="none" stroke="#FECDD3" strokeDasharray="4 4" />
        <circle cx="0" cy="0" r="95" fill="none" stroke="#FDA4AF" strokeDasharray="4 4" />
        <circle cx="0" cy="0" r="55" fill="none" stroke="#E11D48" strokeOpacity="0.45" />
        <circle cx="0" cy="0" r="24" fill="#FFE4E6" stroke="#E11D48" strokeWidth="2" />
        <text x="0" y="4" textAnchor="middle" fill="#881337" fontSize="10" fontWeight="bold" fontFamily="monospace">MONDE 1</text>
        {[
          { label: 'M2 Lune', x: 52, y: -18, c: '#64748B' },
          { label: 'M3 Mars', x: -78, y: -55, c: '#D97706' },
          { label: 'M4 Europe', x: 92, y: 34, c: '#E11D48' },
          { label: 'M5 Ceinture', x: -118, y: 65, c: '#BE123C' },
          { label: 'M6 Exo', x: 118, y: -74, c: '#9333EA' },
        ].map((p) => (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r="9" fill={p.c} />
            <text x={p.x + 13} y={p.y + 4} fill="#1F1224" fontSize="10" fontFamily="monospace">{p.label}</text>
          </g>
        ))}
      </g>
      <g transform="translate(475, 72)">
        {[
          { p: 'Phase 1 · Cyber & Drones', d: 'Supériorité de calcul → Paralysie 2 cycles (-40% Déf.)', c: '#9333EA' },
          { p: 'Phase 2 · Bombardement', d: 'Frappe d’artillerie & soutien orbital préliminaire', c: '#D97706' },
          { p: 'Phase 3 · Assaut Combiné', d: 'Infanterie · Blindés · Drones · Corvettes', c: '#E11D48' },
          { p: 'Phase 4 · Capture & Archive', d: 'Contrôle du secteur géodésique & mise à jour chronique', c: '#059669' },
        ].map((step, i) => (
          <g key={step.p} transform={`translate(0, ${i * 68})`}>
            <rect x="0" y="0" width="460" height="54" rx="8" fill="#FFFFFF" stroke={step.c} strokeWidth="1.8" />
            <text x="14" y="22" fill={step.c} fontSize="12" fontWeight="bold" fontFamily="monospace">{step.p}</text>
            <text x="14" y="40" fill="#1F1224" fontSize="11">{step.d}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}
