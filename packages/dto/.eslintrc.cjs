module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-debugger': 'error'
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [['@req2task/core', './FORBIDDEN_PATH']],
        extensions: ['.ts']
      }
    }
  }
}
