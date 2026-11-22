import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyLlmLexicon,
  buildLlmLexiconPromptBlock,
  type CustomLexiconEntry,
} from '../src/utils/llm-lexicon.ts';

test('applyLlmLexicon rewrites archaic/jargon French terms (including mixed-case aFFermer and accents) into clear RPG/Citybuilder vocabulary', () => {
  const raw =
    'Le conseil propose d’aFFermer la centrale sous emphytéose, d’imposer une péréquation stochastique et de subroger le délégataire.';
  const result = applyLlmLexicon(raw);

  assert.ok(result.text.includes('de mettre en concession'));
  assert.ok(result.text.includes('bail longue durée'));
  assert.ok(result.text.includes('une redistribution budgétaire'));
  assert.ok(result.text.includes('aléatoire'));
  assert.ok(result.text.includes('d’assigner un remplaçant'));
  assert.ok(result.text.includes('chef de secteur'));
  assert.equal(result.replacements.length, 6);
});

test('applyLlmLexicon preserves sentence capitalization, ALL CAPS, and honors custom user overrides', () => {
  const custom: CustomLexiconEntry[] = [
    {
      id: 'usr-1',
      source: 'affermage',
      replacement: 'contrat de guilde urbaine',
      category: 'RPG',
    },
  ];

  const sentence = applyLlmLexicon('Affermer le port et activer le FALLBACK. Affermage prêt.', custom);
  assert.ok(sentence.text.startsWith('Mettre en concession le port'));
  assert.ok(sentence.text.includes('PLAN DE SECOURS'));
  assert.ok(sentence.text.includes('Contrat de guilde urbaine prêt.'));
});

test('buildLlmLexiconPromptBlock generates a compact RPG/Citybuilder directive including affermer replacement', () => {
  const prompt = buildLlmLexiconPromptBlock();
  assert.ok(prompt.includes('DICO LEXICAL JEU'));
  assert.ok(prompt.includes('affermer→mettre en concession'));
  assert.ok(prompt.includes('Quartier'));
  assert.ok(prompt.includes('Colon RPG'));
});
