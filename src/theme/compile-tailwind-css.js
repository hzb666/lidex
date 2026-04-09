const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Worker, isMainThread, workerData } = require('node:worker_threads');

const { LidexError } = require('../utils/errors.js');
const { resolveThemeAssets } = require('./resolve-theme-assets.js');

const WORKER_STATE_PENDING = 0;
const WORKER_STATE_SUCCESS = 1;
const WORKER_STATE_ERROR = 2;
const WORKER_WAIT_TIMEOUT_MS = 30_000;

function requireTailwindCliDependency(packageName) {
  const cliPackagePath = require.resolve('@tailwindcss/cli/package.json');
  const resolvedPath = require.resolve(packageName, {
    paths: [path.dirname(cliPackagePath)],
  });
  return require(resolvedPath);
}

function ensureTailwindDependencyPath() {
  const cliPackagePath = require.resolve('@tailwindcss/cli/package.json');
  const tailwindPackagePath = require.resolve('tailwindcss/package.json', {
    paths: [path.dirname(cliPackagePath)],
  });
  process.env.NODE_PATH = path.dirname(path.dirname(tailwindPackagePath));
}

async function buildTailwindCssInWorker({ inputPath, rootDir }) {
  ensureTailwindDependencyPath();
  const { compile } = requireTailwindCliDependency('@tailwindcss/node');
  const { Scanner } = requireTailwindCliDependency('@tailwindcss/oxide');

  const inputCss = fs.readFileSync(inputPath, 'utf8');
  const compiler = await compile(inputCss, {
    base: path.dirname(inputPath),
    from: inputPath,
    onDependency() {},
  });

  const sources = (compiler.root === 'none'
    ? []
    : compiler.root === null
      ? [{ base: rootDir, pattern: '**/*', negated: false }]
      : [{ ...compiler.root, negated: false }]
  ).concat(compiler.sources);
  const scanner = new Scanner({ sources });
  const candidates = scanner.scan();

  return compiler.build(candidates);
}

if (!isMainThread) {
  const signal = new Int32Array(workerData.signalBuffer);

  buildTailwindCssInWorker(workerData)
    .then((css) => {
      fs.writeFileSync(workerData.resultPath, JSON.stringify({ ok: true, css }), 'utf8');
      Atomics.store(signal, 0, WORKER_STATE_SUCCESS);
      Atomics.notify(signal, 0, 1);
    })
    .catch((error) => {
      fs.writeFileSync(workerData.resultPath, JSON.stringify({
        ok: false,
        message: error && error.message ? error.message : String(error),
      }), 'utf8');
      Atomics.store(signal, 0, WORKER_STATE_ERROR);
      Atomics.notify(signal, 0, 1);
    });
  return;
}

function normalizeTailwindError(output, inputPath) {
  const detail = String(output || '').trim();
  if (!detail) {
    return `Tailwind CSS build failed: ${inputPath}`;
  }

  return `Tailwind CSS build failed: ${inputPath}\n${detail}`;
}

function readWorkerResult(resultPath) {
  if (!fs.existsSync(resultPath) || !fs.statSync(resultPath).isFile()) {
    return null;
  }

  return JSON.parse(fs.readFileSync(resultPath, 'utf8'));
}

function runTailwindWorker(inputPath, rootDir) {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-tailwind-worker-'));
  const resultPath = path.join(tempDirectory, 'result.json');
  const signalBuffer = new SharedArrayBuffer(4);
  const signal = new Int32Array(signalBuffer);
  const worker = new Worker(__filename, {
    workerData: {
      inputPath,
      rootDir,
      resultPath,
      signalBuffer,
    },
  });

  try {
    const waitResult = Atomics.wait(signal, 0, WORKER_STATE_PENDING, WORKER_WAIT_TIMEOUT_MS);
    const state = Atomics.load(signal, 0);
    const result = readWorkerResult(resultPath);

    if (waitResult === 'timed-out' || state === WORKER_STATE_PENDING) {
      throw new LidexError(normalizeTailwindError(
        `Timed out after ${WORKER_WAIT_TIMEOUT_MS}ms`,
        inputPath
      ));
    }

    if (!result || !result.ok) {
      throw new LidexError(normalizeTailwindError(result && result.message, inputPath));
    }

    return result.css;
  } finally {
    worker.terminate().catch(() => {});
    fs.rmSync(tempDirectory, { force: true, recursive: true });
  }
}

function compileTailwindCss(config) {
  if (!config || !config.tailwind) {
    return config;
  }

  const inputPath = config.theme && config.theme.tailwindInputPath;
  const outputPath = config.theme && config.theme.tailwindOutputPath;
  if (!inputPath || !outputPath) {
    return config;
  }

  if (!fs.existsSync(inputPath) || !fs.statSync(inputPath).isFile()) {
    throw new LidexError(`Tailwind input stylesheet not found: ${inputPath}`);
  }

  const nextCss = runTailwindWorker(inputPath, config.rootDir);
  const previousCss = fs.existsSync(outputPath) && fs.statSync(outputPath).isFile()
    ? fs.readFileSync(outputPath, 'utf8')
    : null;

  if (previousCss !== nextCss) {
    fs.writeFileSync(outputPath, nextCss, 'utf8');
  }

  config.theme = resolveThemeAssets(config.theme);
  return config;
}

module.exports = {
  compileTailwindCss,
};
