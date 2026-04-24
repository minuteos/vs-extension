import eslint from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import jsdoc from 'eslint-plugin-jsdoc'
import perfectionist from 'eslint-plugin-perfectionist'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist/**', 'out/**', 'node_modules/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  jsdoc.configs['flat/recommended-typescript'],
  stylistic.configs.customize({
    quotes: 'single',
    semi: false,
    braceStyle: '1tbs',
    indent: 2,
  }),
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      perfectionist,
    },
    rules: {
      'perfectionist/sort-exports': ['error', {
        partitionByNewLine: true,
      }],
      'perfectionist/sort-imports': ['error', {
        type: 'alphabetical',
      }],
    },
  },
  {
    files: ['**/*.{js,mjs}'],
    ...tseslint.configs.disableTypeChecked,
  },
)
