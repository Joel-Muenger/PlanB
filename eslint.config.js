import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist', '**/node_modules', '**/.wrangler'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['client/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    extends: [reactHooks.configs.flat['recommended-latest'], reactRefresh.configs.vite],
  },
  {
    files: ['fare-proxy/**/*.ts'],
    languageOptions: { globals: globals.serviceworker },
  },
  {
    files: ['*.js', 'client/*.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
