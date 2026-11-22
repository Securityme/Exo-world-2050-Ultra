import { err, ok, type ExwResult } from '../contracts/trigger-bus.schema.ts';
import { getWorkspaceAccessToken } from '../services/firebase/firebase-client.ts';

/**
 * [L5] EXW.L5.GOOGLE_PICKER | v4.0.0-rc.1 | SADT A5.1
 * Strictly client-side Google Picker API loader & file content retriever.
 * Uses OAuth access token in memory + iframe ancestorOrigins handling (zero developer key).
 */

export interface PickedDriveFile {
  readonly id: string;
  readonly name: string;
  readonly mimeType: string;
  readonly url?: string;
  readonly sizeBytes?: number;
}

interface GooglePickerDocument {
  readonly id?: string;
  readonly name?: string;
  readonly mimeType?: string;
  readonly url?: string;
  readonly sizeBytes?: number;
}

interface GooglePickerResponse {
  readonly action?: string;
  readonly docs?: readonly GooglePickerDocument[];
}

interface GooglePickerBuilderInstance {
  addView(view: unknown): GooglePickerBuilderInstance;
  setOAuthToken(token: string): GooglePickerBuilderInstance;
  setOrigin(origin: string): GooglePickerBuilderInstance;
  setTitle(title: string): GooglePickerBuilderInstance;
  setLocale(locale: string): GooglePickerBuilderInstance;
  setCallback(cb: (data: GooglePickerResponse) => void): GooglePickerBuilderInstance;
  build(): { setVisible(visible: boolean): void };
}

interface GoogleDocsViewInstance {
  setMimeTypes(mimeTypes: string): GoogleDocsViewInstance;
  setIncludeFolders(include: boolean): GoogleDocsViewInstance;
}

interface GooglePickerNamespace {
  readonly Action: { readonly PICKED: string; readonly CANCEL: string };
  readonly ViewId: { readonly DOCS: string };
  readonly PickerBuilder: new () => GooglePickerBuilderInstance;
  readonly DocsView: new (viewId?: string) => GoogleDocsViewInstance;
}

interface GapiWindow extends Window {
  gapi?: {
    load(api: string, callback: () => void): void;
  };
  google?: {
    picker?: GooglePickerNamespace;
  };
}

let pickerLoaderPromise: Promise<GooglePickerNamespace> | null = null;

function resolvePickerOrigin(): string {
  const ancestors = window.location.ancestorOrigins;
  if (ancestors && ancestors.length > 0) {
    return ancestors[ancestors.length - 1] ?? window.location.origin;
  }
  return window.location.origin;
}

export function loadGooglePickerApi(): Promise<GooglePickerNamespace> {
  if (pickerLoaderPromise) return pickerLoaderPromise;

  pickerLoaderPromise = new Promise<GooglePickerNamespace>((resolve, reject) => {
    const win = window as GapiWindow;
    if (win.google?.picker) {
      resolve(win.google.picker);
      return;
    }

    const initGapi = () => {
      if (!win.gapi) {
        pickerLoaderPromise = null;
        reject(new Error('Google API (gapi) indisponible après chargement du script.'));
        return;
      }
      win.gapi.load('picker', () => {
        if (win.google?.picker) {
          resolve(win.google.picker);
        } else {
          pickerLoaderPromise = null;
          reject(new Error('Module google.picker introuvable.'));
        }
      });
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://apis.google.com/js/api.js"]',
    );
    if (existing) {
      if (win.gapi) {
        initGapi();
      } else {
        existing.addEventListener('load', initGapi, { once: true });
        existing.addEventListener(
          'error',
          () => {
            pickerLoaderPromise = null;
            reject(new Error('Impossible de charger https://apis.google.com/js/api.js.'));
          },
          { once: true },
        );
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = initGapi;
    script.onerror = () => {
      pickerLoaderPromise = null;
      reject(new Error('Échec de chargement du script Google Picker.'));
    };
    document.head.appendChild(script);
  });

  return pickerLoaderPromise;
}

export interface OpenGooglePickerOptions {
  readonly title?: string;
  readonly mimeTypes?: string;
  readonly accessToken?: string;
}

export async function openGoogleDrivePicker(
  options: OpenGooglePickerOptions = {},
): Promise<ExwResult<PickedDriveFile | null>> {
  const token = options.accessToken ?? getWorkspaceAccessToken();
  if (!token) {
    return err(
      'EXW_ERR_DOC_SYNC',
      'Autorisation Google Drive requise avant d’ouvrir Google Picker.',
    );
  }

  try {
    const pickerApi = await loadGooglePickerApi();
    const origin = resolvePickerOrigin();

    return await new Promise<ExwResult<PickedDriveFile | null>>((resolve) => {
      const builder = new pickerApi.PickerBuilder()
        .setOAuthToken(token)
        .setOrigin(origin)
        .setLocale('fr')
        .setTitle(options.title ?? 'Sélectionner un fichier Google Drive (EXO WORLD : 2050)');

      if (options.mimeTypes && pickerApi.DocsView) {
        const view = new pickerApi.DocsView(pickerApi.ViewId.DOCS)
          .setIncludeFolders(true)
          .setMimeTypes(options.mimeTypes);
        builder.addView(view);
      } else {
        builder.addView(pickerApi.ViewId.DOCS);
      }

      builder.setCallback((data) => {
        if (data.action === pickerApi.Action.PICKED) {
          const picked = data.docs?.[0];
          if (!picked?.id) {
            resolve(ok(null));
            return;
          }
          resolve(
            ok({
              id: picked.id,
              name: picked.name ?? 'Fichier Drive sans titre',
              mimeType: picked.mimeType ?? 'application/octet-stream',
              url: picked.url,
              sizeBytes: typeof picked.sizeBytes === 'number' ? picked.sizeBytes : undefined,
            }),
          );
          return;
        }
        if (data.action === pickerApi.Action.CANCEL) {
          resolve(ok(null));
        }
      });

      const picker = builder.build();
      picker.setVisible(true);
    });
  } catch (error) {
    return err(
      'EXW_ERR_DOC_SYNC',
      error instanceof Error ? error.message : 'Erreur lors de l’ouverture de Google Picker.',
    );
  }
}

export async function downloadPickedDriveFileText(
  file: PickedDriveFile,
  explicitToken?: string,
): Promise<ExwResult<string>> {
  const token = explicitToken ?? getWorkspaceAccessToken();
  if (!token) {
    return err('EXW_ERR_DOC_SYNC', 'Jeton OAuth Google Drive introuvable en mémoire.');
  }

  const isGoogleDoc = file.mimeType === 'application/vnd.google-apps.document';
  const endpoint = isGoogleDoc
    ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export?mimeType=text%2Fplain`
    : `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`;

  try {
    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return err(
        'EXW_ERR_DOC_SYNC',
        `Téléchargement Google Drive impossible (HTTP ${res.status}).`,
      );
    }
    const text = await res.text();
    return ok(text);
  } catch (error) {
    return err(
      'EXW_ERR_DOC_SYNC',
      error instanceof Error ? error.message : 'Erreur réseau lors du téléchargement Drive.',
    );
  }
}
