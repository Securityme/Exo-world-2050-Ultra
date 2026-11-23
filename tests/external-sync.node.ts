import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateGithubParity,
  parseNotebookImportText,
} from '../src/doc-sync/external-sync.service.ts';
import {
  EXTERNAL_SSOT_SURFACES,
  GEMINI_NOTEBOOK_URL,
  GITHUB_REPO_URL,
  GITHUB_SYNC_BASELINE_SHA,
} from '../src/doc-sync/sot-manifest.ts';

test('EXTERNAL_SSOT_SURFACES registers both GitHub Ultra and Gemini Notebook URLs', () => {
  const gh = EXTERNAL_SSOT_SURFACES.find((s) => s.id === 'GITHUB_REPO');
  const nb = EXTERNAL_SSOT_SURFACES.find((s) => s.id === 'GEMINI_NOTEBOOK');
  assert.ok(gh, 'GITHUB_REPO surface must be registered');
  assert.ok(nb, 'GEMINI_NOTEBOOK surface must be registered');
  assert.equal(gh.url, GITHUB_REPO_URL);
  assert.equal(gh.syncBaselineRef, GITHUB_SYNC_BASELINE_SHA);
  assert.equal(nb.url, GEMINI_NOTEBOOK_URL);
});

test('evaluateGithubParity detects SYNCED, REMOTE_AHEAD, and UNREACHABLE accurately', () => {
  assert.equal(evaluateGithubParity(GITHUB_SYNC_BASELINE_SHA, GITHUB_SYNC_BASELINE_SHA), 'SYNCED');
  assert.equal(evaluateGithubParity(GITHUB_SYNC_BASELINE_SHA, '7541243'), 'SYNCED');
  assert.equal(
    evaluateGithubParity(GITHUB_SYNC_BASELINE_SHA, 'abcdef1234567890abcdef1234567890abcdef12'),
    'REMOTE_AHEAD',
  );
  assert.equal(evaluateGithubParity(GITHUB_SYNC_BASELINE_SHA, null), 'UNREACHABLE');
  assert.equal(evaluateGithubParity(GITHUB_SYNC_BASELINE_SHA, '   '), 'UNREACHABLE');
});

test('parseNotebookImportText rejects empty or too-short notes and parses valid excerpts', () => {
  const [errEmpty, dataEmpty] = parseNotebookImportText('Test', '   ');
  assert.ok(errEmpty instanceof Error);
  assert.equal(dataEmpty, null);

  const [errShort] = parseNotebookImportText('Court', '12345');
  assert.ok(errShort instanceof Error);

  const [errOk, note] = parseNotebookImportText(
    '  Synthèse V5.1  ',
    '  Décision du Notebook : conserver la parité GitHub Ultra sur main.  ',
    '2026-11-22T16:00:00Z',
  );
  assert.equal(errOk, null);
  assert.ok(note);
  assert.equal(note.title, 'Synthèse V5.1');
  assert.equal(note.sourceUrl, GEMINI_NOTEBOOK_URL);
  assert.equal(note.importedAtIso, '2026-11-22T16:00:00Z');
  assert.ok(note.charCount >= 10);
});
