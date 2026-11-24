import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  DocVcsStoreStateSchema,
  type DocVcsEntry,
  type DocVcsRevision,
  type DocVcsStoreState,
  type ModularSkillSpec,
} from '../../contracts/skills-vcs.schema.ts';
import {
  createInitialDocVcsStoreState,
  type SemverBumpKind,
} from '../../systems/governance/skills-vcs.engine.ts';
import {
  auth,
  db,
  FirestoreOperationType,
  handleFirestoreError,
} from '../firebase/firebase-client.ts';

/**
 * [L5] EXW.L5.DOCS_VCS_SERVICE | v5.1.0 | SADT A4.3
 * Client orchestration service for the isolated Documentation VCS & Modular Skills Registry.
 * Synchronizes local Express BFF (/api/docs-vcs) with authenticated Firestore collections
 * (/docEntries, /docEntries/{docId}/revisions, /skillRegistry).
 */

export async function fetchDocsVcsState(): Promise<DocVcsStoreState> {
  try {
    const resp = await fetch('/api/docs-vcs/state');
    if (resp.ok) {
      const json = (await resp.json()) as unknown;
      const parsed = DocVcsStoreStateSchema.safeParse(json);
      if (parsed.success) {
        return parsed.data;
      }
    }
  } catch {
    // Fallback cleanly when running pure static preview
  }
  return createInitialDocVcsStoreState();
}

export async function createDocsVcsDocument(input: {
  readonly title: string;
  readonly category: DocVcsEntry['category'];
  readonly domain: DocVcsEntry['domain'];
  readonly content: string;
  readonly author: string;
  readonly tags?: readonly string[];
}): Promise<{ readonly ok: boolean; readonly state?: DocVcsStoreState; readonly error?: string }> {
  try {
    const resp = await fetch('/api/docs-vcs/docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = (await resp.json()) as { doc?: DocVcsEntry; state?: DocVcsStoreState; error?: string };
    if (!resp.ok || !data.state) {
      return { ok: false, error: data.error ?? `Erreur HTTP ${resp.status}` };
    }
    if (data.doc) {
      const rev = data.state.revisions.find((r) => r.revisionId === data.doc?.currentRevisionId);
      void mirrorDocEntryToFirestore(data.doc, rev);
    }
    return { ok: true, state: data.state };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur réseau création document.' };
  }
}

export async function createDocsVcsRevision(
  docId: string,
  input: {
    readonly nextContent: string;
    readonly nextTitle?: string;
    readonly summary: string;
    readonly author: string;
    readonly bumpKind: SemverBumpKind;
    readonly source?: 'LOCAL' | 'REVERT' | 'DRIVE_IMPORT';
    readonly driveFileId?: string | null;
    readonly driveUrl?: string | null;
  },
): Promise<{ readonly ok: boolean; readonly state?: DocVcsStoreState; readonly error?: string }> {
  try {
    const resp = await fetch(`/api/docs-vcs/docs/${encodeURIComponent(docId)}/revisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = (await resp.json()) as {
      revision?: DocVcsRevision;
      state?: DocVcsStoreState;
      error?: string;
    };
    if (!resp.ok || !data.state) {
      return { ok: false, error: data.error ?? `Erreur HTTP ${resp.status}` };
    }
    const updatedDoc = data.state.docs.find((d) => d.docId === docId);
    if (updatedDoc) {
      void mirrorDocEntryToFirestore(updatedDoc, data.revision);
    }
    return { ok: true, state: data.state };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur réseau révision document.' };
  }
}

export async function revertDocsVcsRevision(
  docId: string,
  targetRevisionId: string,
  author: string,
): Promise<{ readonly ok: boolean; readonly state?: DocVcsStoreState; readonly error?: string }> {
  try {
    const resp = await fetch(`/api/docs-vcs/docs/${encodeURIComponent(docId)}/revert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetRevisionId, author }),
    });
    const data = (await resp.json()) as {
      revision?: DocVcsRevision;
      state?: DocVcsStoreState;
      error?: string;
    };
    if (!resp.ok || !data.state) {
      return { ok: false, error: data.error ?? `Erreur HTTP ${resp.status}` };
    }
    const updatedDoc = data.state.docs.find((d) => d.docId === docId);
    if (updatedDoc) {
      void mirrorDocEntryToFirestore(updatedDoc, data.revision);
    }
    return { ok: true, state: data.state };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur réseau revert document.' };
  }
}

export async function updateModularSkillRegistry(
  skillId: string,
  patch: {
    readonly toggleEnabled?: boolean;
    readonly bumpSemver?: SemverBumpKind;
    readonly config?: ModularSkillSpec['config'];
  },
): Promise<{ readonly ok: boolean; readonly state?: DocVcsStoreState; readonly error?: string }> {
  try {
    const resp = await fetch(`/api/docs-vcs/skills/${encodeURIComponent(skillId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = (await resp.json()) as {
      skill?: ModularSkillSpec;
      state?: DocVcsStoreState;
      error?: string;
    };
    if (!resp.ok || !data.state) {
      return { ok: false, error: data.error ?? `Erreur HTTP ${resp.status}` };
    }
    if (data.skill) {
      void mirrorSkillToFirestore(data.skill);
    }
    return { ok: true, state: data.state };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur réseau mise à jour skill.' };
  }
}

export async function mirrorDocEntryToFirestore(
  entry: DocVcsEntry,
  revision?: DocVcsRevision,
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const safeDocId = entry.docId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  try {
    await setDoc(doc(db, 'docEntries', safeDocId), {
      docId: safeDocId,
      ownerId: user.uid,
      title: entry.title.slice(0, 140),
      category: entry.category,
      domain: entry.domain,
      linkedSkillId: entry.linkedSkillId ?? '',
      driveFileId: entry.driveFileId ?? '',
      driveUrl: entry.driveUrl ?? '',
      currentSemver: entry.currentSemver,
      currentRevisionId: entry.currentRevisionId,
      currentContentHash: entry.currentContentHash,
      updatedAt: serverTimestamp(),
    });
    if (revision) {
      const safeRevId = revision.revisionId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 96);
      await setDoc(doc(db, 'docEntries', safeDocId, 'revisions', safeRevId), {
        revisionId: safeRevId,
        docId: safeDocId,
        ownerId: user.uid,
        semver: revision.semver,
        contentHash: revision.contentHash,
        author: revision.author.slice(0, 80),
        summary: revision.summary.slice(0, 240),
        parentRevisionId: revision.parentRevisionId ?? '',
        source: revision.source,
        content: revision.content.slice(0, 64_000),
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, FirestoreOperationType.WRITE, `docEntries/${safeDocId}`);
  }
}

export async function mirrorSkillToFirestore(skill: ModularSkillSpec): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const safeSkillId = skill.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  try {
    await setDoc(doc(db, 'skillRegistry', safeSkillId), {
      skillId: safeSkillId,
      ownerId: user.uid,
      code: skill.code,
      name: skill.name.slice(0, 100),
      domain: skill.domain,
      hookKind: skill.hookKind,
      semver: skill.semver,
      enabled: skill.enabled,
      entryModule: skill.entryModule.slice(0, 140),
      docId: skill.docId,
      config: skill.config,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, FirestoreOperationType.WRITE, `skillRegistry/${safeSkillId}`);
  }
}

export async function loadFirestoreDocSyncStatus(): Promise<{
  readonly syncedDocsCount: number;
  readonly syncedSkillsCount: number;
}> {
  const user = auth.currentUser;
  if (!user) return { syncedDocsCount: 0, syncedSkillsCount: 0 };
  try {
    const [docsSnap, skillsSnap] = await Promise.all([
      getDocs(query(collection(db, 'docEntries'), where('ownerId', '==', user.uid))),
      getDocs(query(collection(db, 'skillRegistry'), where('ownerId', '==', user.uid))),
    ]);
    return {
      syncedDocsCount: docsSnap.size,
      syncedSkillsCount: skillsSnap.size,
    };
  } catch {
    return { syncedDocsCount: 0, syncedSkillsCount: 0 };
  }
}
