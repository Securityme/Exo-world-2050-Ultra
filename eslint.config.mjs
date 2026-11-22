import esbuild from 'esbuild';
import * as espree from 'espree';
import firebaseSecurityRules from '@firebase/eslint-plugin-security-rules';

/**
 * EXO WORLD : 2050 — ESLint v10 Flat Config for TypeScript 7.0+
 * Uses esbuild (JSX preserve) + espree so ESLint runs natively on TS 7.0 without legacy typescript-eslint blocks,
 * enforcing L0..L8 layer boundaries, zero `any`/`@ts-ignore`, and strict L2/L3 purity (R-02, R-13, R-66).
 */
const tsEsbuildParser = {
  meta: { name: 'exo-esbuild-ts-parser', version: '1.0.0' },
  parseForESLint(code, options = {}) {
    const transformed = esbuild.transformSync(code, {
      loader: 'tsx',
      jsx: 'preserve',
      format: 'esm',
      target: 'esnext',
      sourcemap: false,
    });
    const ast = espree.parse(transformed.code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      loc: true,
      range: true,
      tokens: true,
      comment: true,
      ecmaFeatures: { jsx: true },
      ...options.parserOptions,
    });
    return {
      ast,
      services: { rawSource: code },
      visitorKeys: espree.VisitorKeys,
    };
  },
};

const exoStrictPlugin = {
  rules: {
    'no-explicit-any': {
      meta: { type: 'problem', schema: [] },
      create(context) {
        return {
          Program(node) {
            const raw = context.sourceCode.text;
            if (/:\s*any\b|\bas\s+any\b|<any>/.test(raw)) {
              context.report({ node, message: 'R-01: Type `any` interdit en TypeScript strict.' });
            }
          },
        };
      },
    },
    'no-ts-ignore': {
      meta: { type: 'problem', schema: [] },
      create(context) {
        return {
          Program(node) {
            const raw = context.sourceCode.text;
            if (/@ts-ignore|@ts-nocheck/.test(raw)) {
              context.report({ node, message: 'R-01: @ts-ignore / @ts-nocheck interdit.' });
            }
          },
        };
      },
    },
  },
};

const PURE_RESTRICTED_PROPERTIES = [
  {
    object: 'Math',
    property: 'random',
    message: 'R-13/R-66 : Math.random() interdit en L2/L3. Utiliser Pcg32.',
  },
  {
    object: 'Date',
    property: 'now',
    message: 'R-13/R-66 : Date.now() interdit en L2/L3. Utiliser state.tick / state.cycle.',
  },
  {
    object: 'performance',
    property: 'now',
    message: 'R-13/R-66 : performance.now() interdit en L2/L3.',
  },
];

const PURE_RESTRICTED_GLOBALS = [
  { name: 'fetch', message: 'R-13/R-66 : fetch() interdit en L2/L3 (zéro I/O).' },
  { name: 'window', message: 'R-13/R-66 : window interdit en L2/L3.' },
  { name: 'document', message: 'R-13/R-66 : document interdit en L2/L3.' },
];

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '.playwright-cli/**'],
  },
  firebaseSecurityRules.configs['flat/recommended'],
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsEsbuildParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      exo: exoStrictPlugin,
    },
    rules: {
      'exo/no-explicit-any': 'error',
      'exo/no-ts-ignore': 'error',
    },
  },
  {
    files: ['src/contracts/**/*.ts', 'src/parsers/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/config/**',
                '**/data/**',
                '**/core/**',
                '**/guardrails/**',
                '**/systems/**',
                '**/engine3d/**',
                '**/adapters/**',
                '**/bridges/**',
                '**/retrievers/**',
                '**/stores/**',
                '**/services/**',
                '**/pipelines/**',
                '**/hooks/**',
                '**/handlers/**',
                '**/components/**',
                '**/interfaces/**',
                '**/features/**',
                '**/app/**',
              ],
              message: 'R-02 : Couche L0 (contracts/parsers) ne peut importer aucune couche L1..L8.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/config/**/*.ts', 'src/data/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/core/**',
                '**/guardrails/**',
                '**/systems/**',
                '**/engine3d/**',
                '**/adapters/**',
                '**/bridges/**',
                '**/retrievers/**',
                '**/stores/**',
                '**/services/**',
                '**/pipelines/**',
                '**/hooks/**',
                '**/handlers/**',
                '**/components/**',
                '**/interfaces/**',
                '**/features/**',
                '**/app/**',
              ],
              message: 'R-02 : Couche L1 (config/data) ne peut importer aucune couche L2..L8.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/core/**/*.ts', 'src/systems/**/*.ts', 'src/guardrails/**/*.ts'],
    rules: {
      'no-restricted-properties': ['error', ...PURE_RESTRICTED_PROPERTIES],
      'no-restricted-globals': ['error', ...PURE_RESTRICTED_GLOBALS],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/engine3d/**',
                '**/adapters/**',
                '**/bridges/**',
                '**/retrievers/**',
                '**/stores/**',
                '**/services/**',
                '**/pipelines/**',
                '**/hooks/**',
                '**/handlers/**',
                '**/components/**',
                '**/interfaces/**',
                '**/features/**',
                '**/app/**',
              ],
              message: 'R-02/R-13 : L2/L3 purs ne peuvent pas importer L4..L8.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/engine3d/**/*.ts', 'src/adapters/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/stores/**',
                '**/services/**',
                '**/pipelines/**',
                '**/hooks/**',
                '**/handlers/**',
                '**/components/**',
                '**/interfaces/**',
                '**/features/**',
                '**/app/**',
              ],
              message: 'R-02 : Couche L4 (engine3d/adapters) ne peut pas importer L5..L8.',
            },
          ],
        },
      ],
    },
  },
];
