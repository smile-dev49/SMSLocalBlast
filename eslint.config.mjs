import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const reactPackages = [
  'apps/admin-web/**/*.{ts,tsx}',
  'apps/excel-addin/**/*.{ts,tsx}',
  'packages/ui/**/*.{ts,tsx}',
];

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: [
          './apps/api/tsconfig.json',
          './apps/admin-web/tsconfig.json',
          './apps/excel-addin/tsconfig.json',
          './packages/types/tsconfig.json',
          './packages/constants/tsconfig.json',
          './packages/validation/tsconfig.json',
          './packages/utils/tsconfig.json',
          './packages/ui/tsconfig.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/build/**',
      '**/coverage/**',
      '**/.turbo/**',
      'eslint.config.mjs',
      '**/vitest.config.ts',
      '**/vite.config.ts',
      'apps/admin-web/next-env.d.ts',
    ],
  },
  {
    files: reactPackages,
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['apps/api/test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
  {
    files: ['apps/api/src/modules/**/*.service.ts', 'apps/api/src/modules/**/*.controller.ts'],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
  {
    files: ['apps/api/src/infrastructure/prisma/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
  {
    files: ['apps/api/src/infrastructure/health/health.service.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
  {
    files: ['**/*.module.ts'],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
  eslintConfigPrettier,
);
