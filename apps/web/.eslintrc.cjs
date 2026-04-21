module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    '@vue/eslint-config-typescript'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: 'tsconfig.json'
  },
  plugins: ['import'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }]
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@req2task/core', '../../packages/core/src'],
          ['@req2task/dto', '../../packages/dto/src']
        ],
        extensions: ['.ts', '.tsx', '.vue']
      }
    }
  },
  ignorePatterns: ['e2e/**', 'vite.config.*', 'vitest.config.*', 'dist/**', 'node_modules/**']
}
