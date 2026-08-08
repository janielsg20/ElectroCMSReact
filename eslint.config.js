import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

const nodeGlobals = {
  Buffer: 'readonly',
  console: 'readonly',
  global: 'readonly',
  globalThis: 'readonly',
  process: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  URL: 'readonly',
};

export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'playwright-report', 'test-results'],
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...js.configs.recommended,
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      globals: nodeGlobals,
    },
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
    },
  },
  {
    // These are registry modules: they intentionally co-locate widget contracts,
    // factories and internal React preview renderers. They are not component
    // module boundaries and are rebuilt through the registry during development.
    files: [
      'src/app/widgets/core-basic-content-widgets.tsx',
      'src/app/widgets/core-dynamic-contract-widgets.tsx',
      'src/app/widgets/core-structural-widgets.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
);
