import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'coverage/'] },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // Plain JavaScript without PropTypes: each component's props are read
      // straight from the domain result object, so runtime prop checks add noise.
      'react/prop-types': 'off',
      // The Spanish copy quotes terms with plain " characters, which JSX renders
      // as-is; keep the rule for the characters that usually signal a typo.
      'react/no-unescaped-entities': ['error', { forbid: ['>', '}'] }],
    },
  },
  {
    files: ['test/**/*.js', '*.config.js'],
    languageOptions: { globals: globals.node },
  },
  // Last, so formatting is left entirely to Prettier.
  prettier,
];
