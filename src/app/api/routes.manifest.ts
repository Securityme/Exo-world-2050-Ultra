/**
 * [L8] FUP-010 / FUP-012 | SM-05
 * Canonical API Route Manifest for EXO WORLD : 2050 server endpoints (/api/*) served via server.ts.
 */
export interface ApiRouteContract {
  readonly method: 'GET' | 'POST';
  readonly path: string;
  readonly auth: 'NONE' | 'BEARER_WORKSPACE_OAUTH' | 'FIREBASE_JWT';
  readonly description: string;
}

export const EXO_API_ROUTES: readonly ApiRouteContract[] = Object.freeze([
  {
    method: 'GET',
    path: '/api/health',
    auth: 'NONE',
    description: 'Health check runtime et statut Gemini / Firebase.',
  },
  {
    method: 'POST',
    path: '/api/oracle/dossier',
    auth: 'NONE',
    description: 'Proxy serveur sécurisé Oracle Gemini Dual-Pass + Fallback déterministe (R-68).',
  },
  {
    method: 'POST',
    path: '/api/drive/sync',
    auth: 'BEARER_WORKSPACE_OAUTH',
    description: 'Lecture/écriture des documents SSoT Drive/Docs via jeton Bearer OAuth client.',
  },
]);
