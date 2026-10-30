import { createRequire } from 'node:module';
const require = createRequire(new URL('./backend/package.json', import.meta.url));
const js = require('@eslint/js');
const globals = require('globals');
const react = require('eslint-plugin-react');
const hooks = require('eslint-plugin-react-hooks');

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', 'backend/.artifacts/**', 'backend/generated/**'],
  },
  js.configs.recommended,
  {
    files: ['frontend/src/**/*.{js,jsx}'],
    languageOptions: { globals: globals.browser, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { react, 'react-hooks': hooks },
    rules: {
      'react/jsx-uses-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['backend/**/*.{js,mjs}', 'scripts/**/*.mjs', '*.js', 'frontend/vite.config.js'],
    languageOptions: { globals: globals.node },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['backend/tests/e2e/*.mjs'],
    languageOptions: { globals: { document: 'readonly', innerWidth: 'readonly' } },
  },
];
