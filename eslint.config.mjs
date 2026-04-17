import { createConfig } from '@hypandra/lint';

export default [
  ...createConfig({
    next: true,
    ignores: ['.next/**', 'postcss.config.mjs', 'eslint.config.mjs'],
  }),
  {
    rules: {
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      '@next/next/no-assign-module-variable': 'off',
    },
  },
];
