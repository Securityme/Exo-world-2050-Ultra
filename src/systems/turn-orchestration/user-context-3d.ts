import type {
  ContextEventLogEntry,
  DisplaySettingsProfile,
  TraceabilityMatrixEntry,
  UserContext3D,
} from '../../contracts/user-context.schema.ts';

/**
 * [L3] EXW.L3.USER_CONTEXT_3D | v5.0.0 | SADT A5.1
 * Pure immutable reducers & exporters for the 3-Dimension User Context.
 * Zero I/O, zero Date.now(), zero Math.random(), zero React/DOM.
 */
export function createDefaultUserContext3D(updatedAtIso = '2050-01-01T00:00:00.000Z'): UserContext3D {
  return {
    contextId: 'primary',
    shellUxHabits: {
      accordionStates: {
        'dev.theme': true,
        'dev.safari': true,
        'dev.context': false,
        'world.stats': true,
        'world.managers': true,
      },
      preferredHudTab: 'WORLDS_HUB',
      preferredOverlayMode: 'STANDARD',
      preferredScenarioComplexity: 'STANDARD',
      devDrawerPinned: false,
    },
    displaySettingsProfile: {
      presetId: 'ROSE_ASTRAL',
      colorScheme: 'DARK',
      hudOpacity: 96,
      saturationPct: 100,
      glowIntensity: 62,
      uiDensity: 'STANDARD',
      fontScalePct: 100,
      safariTextSync: true,
      tactileTargetBoost: true,
    },
    simulationTraceabilityProfile: {
      traceabilityMatrix: [],
      eventLogs: [],
    },
    updatedAtIso,
  };
}

export function setRememberedAccordion(
  ctx: UserContext3D,
  accordionKey: string,
  isOpen: boolean,
  updatedAtIso = ctx.updatedAtIso,
): UserContext3D {
  return {
    ...ctx,
    shellUxHabits: {
      ...ctx.shellUxHabits,
      accordionStates: {
        ...ctx.shellUxHabits.accordionStates,
        [accordionKey]: isOpen,
      },
    },
    updatedAtIso,
  };
}

export function updateDisplayProfileInContext(
  ctx: UserContext3D,
  patch: Partial<DisplaySettingsProfile>,
  updatedAtIso = ctx.updatedAtIso,
): UserContext3D {
  return {
    ...ctx,
    displaySettingsProfile: {
      ...ctx.displaySettingsProfile,
      ...patch,
    },
    updatedAtIso,
  };
}

export function appendTraceabilityRecord(
  ctx: UserContext3D,
  entry: TraceabilityMatrixEntry,
  updatedAtIso = ctx.updatedAtIso,
): UserContext3D {
  const deduped = ctx.simulationTraceabilityProfile.traceabilityMatrix.filter(
    (item) => item.id !== entry.id,
  );
  return {
    ...ctx,
    simulationTraceabilityProfile: {
      ...ctx.simulationTraceabilityProfile,
      traceabilityMatrix: [entry, ...deduped].slice(0, 120),
    },
    updatedAtIso,
  };
}

export function appendContextEventLog(
  ctx: UserContext3D,
  entry: ContextEventLogEntry,
  updatedAtIso = ctx.updatedAtIso,
): UserContext3D {
  const deduped = ctx.simulationTraceabilityProfile.eventLogs.filter(
    (item) => item.id !== entry.id,
  );
  return {
    ...ctx,
    simulationTraceabilityProfile: {
      ...ctx.simulationTraceabilityProfile,
      eventLogs: [entry, ...deduped].slice(0, 160),
    },
    updatedAtIso,
  };
}

export function serializeUserContextJson(ctx: UserContext3D): string {
  return JSON.stringify(ctx, null, 2);
}

export function serializeUserContextMarkdown(ctx: UserContext3D): string {
  const accordions = Object.entries(ctx.shellUxHabits.accordionStates)
    .map(([k, v]) => `- \`${k}\`: ${v ? 'ouvert' : 'replié'}`)
    .join('\n');
  const traces = ctx.simulationTraceabilityProfile.traceabilityMatrix
    .slice(0, 20)
    .map(
      (t) =>
        `| T${t.turn} | ${t.actionType} | ${t.sourceChannel} | ${t.philosophyPole} | ${t.paSpent} PA | ${t.deltaSummary} |`,
    )
    .join('\n');

  return [
    '# EXO WORLD : 2050 — Contexte Utilisateur 3D',
    `Horodatage : ${ctx.updatedAtIso}`,
    '',
    '## 1. Habitudes UX Shell (shellUxHabits)',
    `- Onglet favori : ${ctx.shellUxHabits.preferredHudTab}`,
    `- Filtre 3D favori : ${ctx.shellUxHabits.preferredOverlayMode}`,
    `- Mode générateur scénario : ${ctx.shellUxHabits.preferredScenarioComplexity}`,
    accordions || '- Aucun accordéon mémorisé',
    '',
    '## 2. Profil Affichage & Safari (displaySettingsProfile)',
    `- Thème : ${ctx.displaySettingsProfile.presetId} (${ctx.displaySettingsProfile.colorScheme})`,
    `- Opacité HUD : ${ctx.displaySettingsProfile.hudOpacity}% · Saturation : ${ctx.displaySettingsProfile.saturationPct}% · Lueur : ${ctx.displaySettingsProfile.glowIntensity}%`,
    `- Texte : ${ctx.displaySettingsProfile.fontScalePct}% (Synchro Safari OS: ${ctx.displaySettingsProfile.safariTextSync ? 'ON' : 'OFF'})`,
    '',
    '## 3. Matrice de Traçabilité & Journal (simulationTraceabilityProfile)',
    `Total entrées matrice : ${ctx.simulationTraceabilityProfile.traceabilityMatrix.length} · Logs campagne : ${ctx.simulationTraceabilityProfile.eventLogs.length}`,
    '',
    '| Tour | Action | Canal IA | Pôle Éthique | Coût | Synthèse |',
    '|---|---|---|---|---|---|',
    traces || '| - | Aucune trace enregistrée | - | - | - | - |',
    '',
  ].join('\n');
}
