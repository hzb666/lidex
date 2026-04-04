const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

test('parseCliArgs parses supported Lydex CLI options', () => {
  const { parseCliArgs } = require('../../src/cli/parse-cli-args.js');

  assert.deepEqual(parseCliArgs([
    '--build',
    '--publish',
    '--list-history',
    '--root',
    './example',
    '--out',
    './dist',
    '--target',
    './published',
    '--history-dir',
    './history',
    '--port',
    '4010',
    '--host',
    '0.0.0.0',
    '--config',
    'custom.config.js',
    '--admin-path',
    '/manage',
  ]), {
    build: true,
    publish: true,
    listHistory: true,
    rootDir: './example',
    outDir: './dist',
    targetDir: './published',
    historyDir: './history',
    port: 4010,
    host: '0.0.0.0',
    config: 'custom.config.js',
    adminPath: '/manage',
  });
});

test('runCli invokes buildSite when --build is set', () => {
  const runCliPath = path.resolve(__dirname, '../../src/cli/run-cli.js');
  const indexPath = path.resolve(__dirname, '../../src/index.js');
  const originalRunCliModule = require.cache[runCliPath];
  const originalIndexModule = require.cache[indexPath];

  let buildOptions = null;
  let serverOptions = null;

  delete require.cache[runCliPath];
  require.cache[indexPath] = {
    id: indexPath,
    filename: indexPath,
    loaded: true,
    exports: {
      buildSite(options) {
        buildOptions = options;
        return { outDir: options.outDir };
      },
      startServer(options) {
        serverOptions = options;
        return null;
      },
    },
  };

  try {
    const { runCli } = require(runCliPath);
    const result = runCli(['--build', '--root', './example', '--out', './dist']);

    assert.deepEqual(buildOptions, {
      build: true,
      rootDir: './example',
      outDir: './dist',
    });
    assert.equal(serverOptions, null);
    assert.deepEqual(result, { outDir: './dist' });
  } finally {
    delete require.cache[runCliPath];
    if (originalRunCliModule) {
      require.cache[runCliPath] = originalRunCliModule;
    }

    if (originalIndexModule) {
      require.cache[indexPath] = originalIndexModule;
    } else {
      delete require.cache[indexPath];
    }
  }
});

test('runCli invokes listPublishHistory when --list-history is set', () => {
  const runCliPath = path.resolve(__dirname, '../../src/cli/run-cli.js');
  const indexPath = path.resolve(__dirname, '../../src/index.js');
  const originalRunCliModule = require.cache[runCliPath];
  const originalIndexModule = require.cache[indexPath];

  let historyOptions = null;
  let serverOptions = null;

  delete require.cache[runCliPath];
  require.cache[indexPath] = {
    id: indexPath,
    filename: indexPath,
    loaded: true,
    exports: {
      buildSite() {
        throw new Error('buildSite should not be called');
      },
      publishSite() {
        throw new Error('publishSite should not be called');
      },
      rollbackSite() {
        throw new Error('rollbackSite should not be called');
      },
      listPublishHistory(options) {
        historyOptions = options;
        return { entries: [] };
      },
      startServer(options) {
        serverOptions = options;
        return null;
      },
    },
  };

  try {
    const { runCli } = require(runCliPath);
    const result = runCli(['--list-history', '--root', './example', '--target', './published']);

    assert.deepEqual(historyOptions, {
      listHistory: true,
      rootDir: './example',
      targetDir: './published',
    });
    assert.equal(serverOptions, null);
    assert.deepEqual(result, { entries: [] });
  } finally {
    delete require.cache[runCliPath];
    if (originalRunCliModule) {
      require.cache[runCliPath] = originalRunCliModule;
    }

    if (originalIndexModule) {
      require.cache[indexPath] = originalIndexModule;
    } else {
      delete require.cache[indexPath];
    }
  }
});

test('runCli invokes publishSite when --publish is set', () => {
  const runCliPath = path.resolve(__dirname, '../../src/cli/run-cli.js');
  const indexPath = path.resolve(__dirname, '../../src/index.js');
  const originalRunCliModule = require.cache[runCliPath];
  const originalIndexModule = require.cache[indexPath];

  let publishOptions = null;
  let rollbackOptions = null;
  let serverOptions = null;

  delete require.cache[runCliPath];
  require.cache[indexPath] = {
    id: indexPath,
    filename: indexPath,
    loaded: true,
    exports: {
      buildSite() {
        throw new Error('buildSite should not be called');
      },
      publishSite(options) {
        publishOptions = options;
        return { publishId: 'pub-1' };
      },
      rollbackSite(options) {
        rollbackOptions = options;
        return { rollbackId: options.rollbackId };
      },
      startServer(options) {
        serverOptions = options;
        return null;
      },
    },
  };

  try {
    const { runCli } = require(runCliPath);
    const result = runCli(['--publish', '--root', './example', '--target', './published']);

    assert.deepEqual(publishOptions, {
      publish: true,
      rootDir: './example',
      targetDir: './published',
    });
    assert.equal(rollbackOptions, null);
    assert.equal(serverOptions, null);
    assert.deepEqual(result, { publishId: 'pub-1' });
  } finally {
    delete require.cache[runCliPath];
    if (originalRunCliModule) {
      require.cache[runCliPath] = originalRunCliModule;
    }

    if (originalIndexModule) {
      require.cache[indexPath] = originalIndexModule;
    } else {
      delete require.cache[indexPath];
    }
  }
});

test('runCli invokes rollbackSite when --rollback is set', () => {
  const runCliPath = path.resolve(__dirname, '../../src/cli/run-cli.js');
  const indexPath = path.resolve(__dirname, '../../src/index.js');
  const originalRunCliModule = require.cache[runCliPath];
  const originalIndexModule = require.cache[indexPath];

  let publishOptions = null;
  let rollbackOptions = null;
  let serverOptions = null;

  delete require.cache[runCliPath];
  require.cache[indexPath] = {
    id: indexPath,
    filename: indexPath,
    loaded: true,
    exports: {
      buildSite() {
        throw new Error('buildSite should not be called');
      },
      publishSite(options) {
        publishOptions = options;
        return { publishId: 'pub-1' };
      },
      rollbackSite(options) {
        rollbackOptions = options;
        return { rollbackId: options.rollbackId };
      },
      startServer(options) {
        serverOptions = options;
        return null;
      },
    },
  };

  try {
    const { runCli } = require(runCliPath);
    const result = runCli(['--rollback', 'pub-1', '--root', './example', '--target', './published']);

    assert.equal(publishOptions, null);
    assert.deepEqual(rollbackOptions, {
      rollbackId: 'pub-1',
      rootDir: './example',
      targetDir: './published',
    });
    assert.equal(serverOptions, null);
    assert.deepEqual(result, { rollbackId: 'pub-1' });
  } finally {
    delete require.cache[runCliPath];
    if (originalRunCliModule) {
      require.cache[runCliPath] = originalRunCliModule;
    }

    if (originalIndexModule) {
      require.cache[indexPath] = originalIndexModule;
    } else {
      delete require.cache[indexPath];
    }
  }
});

test('parseCliArgs rejects invalid port values', () => {
  const { parseCliArgs } = require('../../src/cli/parse-cli-args.js');

  assert.throws(
    () => parseCliArgs(['--port', 'abc']),
    /invalid value for --port/i,
  );
});

test('CLI entry reports argument errors without starting the server', () => {
  const cliPath = path.resolve(__dirname, '../../bin/lydex.js');
  const runCliPath = path.resolve(__dirname, '../../src/cli/run-cli.js');
  const originalRunCliModule = require.cache[runCliPath];
  const originalCliModule = require.cache[cliPath];
  const originalArgv = process.argv.slice();
  const originalConsoleError = console.error;
  const originalExitCode = process.exitCode;
  const errors = [];

  process.argv = [process.argv[0], cliPath, '--port', 'abc'];
  process.exitCode = 0;
  console.error = (message) => {
    errors.push(String(message));
  };

  require.cache[runCliPath] = {
    id: runCliPath,
    filename: runCliPath,
    loaded: true,
    exports: {
      runCli() {
        throw new Error('Invalid value for --port: abc');
      },
    },
  };

  delete require.cache[cliPath];

  try {
    require(cliPath);
    assert.equal(process.exitCode, 1);
    assert.equal(errors.some((message) => /invalid value for --port/i.test(message)), true);
  } finally {
    process.argv = originalArgv;
    process.exitCode = originalExitCode;
    console.error = originalConsoleError;
    delete require.cache[cliPath];
    if (originalCliModule) {
      require.cache[cliPath] = originalCliModule;
    }

    if (originalRunCliModule) {
      require.cache[runCliPath] = originalRunCliModule;
    } else {
      delete require.cache[runCliPath];
    }
  }
});

test('CLI entry prints JSON results returned from runCli', () => {
  const cliPath = path.resolve(__dirname, '../../bin/lydex.js');
  const runCliPath = path.resolve(__dirname, '../../src/cli/run-cli.js');
  const originalRunCliModule = require.cache[runCliPath];
  const originalCliModule = require.cache[cliPath];
  const originalArgv = process.argv.slice();
  const originalConsoleLog = console.log;
  const originalExitCode = process.exitCode;
  const logs = [];

  process.argv = [process.argv[0], cliPath, '--list-history'];
  process.exitCode = 0;
  console.log = (message) => {
    logs.push(String(message));
  };

  require.cache[runCliPath] = {
    id: runCliPath,
    filename: runCliPath,
    loaded: true,
    exports: {
      runCli() {
        return { entries: [{ publishId: 'pub-1', reason: 'publish' }] };
      },
    },
  };

  delete require.cache[cliPath];

  try {
    require(cliPath);
    assert.equal(process.exitCode, 0);
    assert.equal(logs.length, 1);
    assert.match(logs[0], /"publishId": "pub-1"/);
    assert.match(logs[0], /"reason": "publish"/);
  } finally {
    process.argv = originalArgv;
    process.exitCode = originalExitCode;
    console.log = originalConsoleLog;
    delete require.cache[cliPath];
    if (originalCliModule) {
      require.cache[cliPath] = originalCliModule;
    }

    if (originalRunCliModule) {
      require.cache[runCliPath] = originalRunCliModule;
    } else {
      delete require.cache[runCliPath];
    }
  }
});

