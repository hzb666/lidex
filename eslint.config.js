const commonGlobals = {
  Buffer: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  clearImmediate: 'readonly',
  clearInterval: 'readonly',
  clearTimeout: 'readonly',
  console: 'readonly',
  exports: 'writable',
  module: 'readonly',
  process: 'readonly',
  queueMicrotask: 'readonly',
  require: 'readonly',
  setImmediate: 'readonly',
  setInterval: 'readonly',
  setTimeout: 'readonly',
};

module.exports = [
  {
    ignores: [
      '**/node_modules/**',
      'packages/create-lidex/templates/**',
      'dist/**',
      'published/**',
      '.npm-cache/**',
      '.playwright-mcp/**',
      'vision/**',
    ],
  },
  {
    files: [
      'bin/**/*.js',
      'src/**/*.js',
      'test/**/*.js',
      'packages/create-lidex/bin/**/*.js',
      'packages/create-lidex/src/**/*.js',
      'example/assets/public/app.js',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: commonGlobals,
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
    rules: {
      'no-const-assign': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-dupe-keys': 'error',
      'no-redeclare': 'error',
      'no-unexpected-multiline': 'error',
      'no-unreachable': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];

