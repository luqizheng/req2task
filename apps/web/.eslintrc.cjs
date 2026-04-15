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
    ecmaVersion: 'latest'
  },
  plugins: ['import'],
  rules: {
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          {
            target: './',
            from: null,
            restrictGraph: true,
            except: ['@req2task/dto']
          }
        ]
      }
    ]
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [['@req2task/core', './FORBIDDEN_PATH']],
        extensions: ['.ts', '.tsx', '.vue']
      }
    }
  }
}
