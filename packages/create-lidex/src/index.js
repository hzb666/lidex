const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline/promises');

const THEMES = [
  {
    key: 'default',
    label: 'Default',
    description: 'The bundled Lidex example site.',
    templateDir: path.resolve(__dirname, '../templates/default'),
  },
];

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  dim: '\x1b[2m',
};

function toPackageName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-._/]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'lidex-site';
}

function ensureEmptyTarget(projectRoot) {
  if (fs.existsSync(projectRoot)) {
    throw new Error(`Target directory already exists: ${projectRoot}`);
  }
}

function getTemplate(themeKey) {
  const theme = THEMES.find((candidate) => candidate.key === themeKey);
  if (!theme) {
    throw new Error(`Unknown theme preset: ${themeKey}`);
  }

  return theme;
}

function writeProjectPackageJson(projectRoot, projectName, lidexVersion) {
  const packageJson = {
    name: toPackageName(projectName),
    private: true,
    version: '0.1.0',
    scripts: {
      dev: 'lidex --root . --port 3001',
      build: 'lidex --build --root . --out ./dist',
    },
    dependencies: {
      '@lidex/lidex': `^${lidexVersion || '0.1.0'}`,
    },
  };

  fs.writeFileSync(
    path.join(projectRoot, 'package.json'),
    `${JSON.stringify(packageJson, null, 2)}\n`,
    'utf8',
  );
}

function writeGitIgnore(projectRoot) {
  fs.writeFileSync(
    path.join(projectRoot, '.gitignore'),
    'node_modules/\ndist/\n.pnpm-store/\n',
    'utf8',
  );
}

async function generateProject(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const projectName = String(options.projectName || '').trim();
  const themeKey = options.themeKey || 'default';

  if (!projectName) {
    throw new Error('Project name is required.');
  }

  const theme = getTemplate(themeKey);
  const projectRoot = path.join(cwd, projectName);
  ensureEmptyTarget(projectRoot);

  fs.mkdirSync(projectRoot, { recursive: true });
  fs.cpSync(theme.templateDir, projectRoot, { recursive: true });
  writeProjectPackageJson(projectRoot, projectName, options.lidexVersion);
  writeGitIgnore(projectRoot);

  return {
    projectName,
    projectRoot,
    themeKey: theme.key,
  };
}

function createPromptAdapter(rl) {
  return async function prompt(question) {
    return rl.question(question);
  };
}

function createColorFormatter(options = {}) {
  const enabled = options.colorsEnabled !== false && Boolean(process.stdout && process.stdout.isTTY);

  return function colorize(text, ...styles) {
    if (!enabled || !styles.length) {
      return text;
    }

    return `${styles.join('')}${text}${ANSI.reset}`;
  };
}

function writeBanner(writeLine, colorize) {
  writeLine('');
  writeLine(colorize('Lidex Project Scaffolder', ANSI.bold, ANSI.cyan));
  writeLine(colorize('Create a new Lidex site from the bundled example.', ANSI.dim));
  writeLine('');
}

function writeSummary(writeLine, colorize, result) {
  writeLine('');
  writeLine(colorize('Project created', ANSI.bold, ANSI.green));
  writeLine(`  ${colorize('Name:', ANSI.yellow)} ${result.projectName}`);
  writeLine(`  ${colorize('Path:', ANSI.yellow)} ${result.projectRoot}`);
  writeLine(`  ${colorize('Theme:', ANSI.yellow)} ${result.themeKey}`);
  writeLine('');
  writeLine(colorize('Next steps', ANSI.bold));
  writeLine(`  ${colorize(`cd ${result.projectName}`, ANSI.yellow)}`);
  writeLine(`  ${colorize('npm install', ANSI.yellow)}`);
  writeLine(`  ${colorize('npm run dev', ANSI.yellow)}`);
  writeLine('');
  writeLine(colorize('Or with pnpm', ANSI.bold));
  writeLine(`  ${colorize('pnpm install', ANSI.yellow)}`);
  writeLine(`  ${colorize('pnpm run dev', ANSI.yellow)}`);
}

async function resolveThemeSelection(prompt, colorize) {
  const lines = [
    colorize('Select a theme preset:', ANSI.bold),
    ...THEMES.map((theme, index) => `  ${colorize(`${index + 1}) ${theme.label}`, ANSI.yellow)} - ${theme.description}`),
  ];
  const answer = String(await prompt(`${lines.join('\n')}\n${colorize('theme [1]: ', ANSI.cyan)}`)).trim();
  if (!answer) {
    return THEMES[0].key;
  }

  const numericIndex = Number(answer);
  if (!Number.isInteger(numericIndex) || numericIndex < 1 || numericIndex > THEMES.length) {
    throw new Error(`Invalid theme selection: ${answer}`);
  }

  return THEMES[numericIndex - 1].key;
}

async function runInteractiveCreate(options = {}) {
  const writeLine = options.writeLine || ((message) => console.log(message));
  const colorize = createColorFormatter(options);
  let rl = null;
  let prompt = options.prompt;

  if (!prompt) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    prompt = createPromptAdapter(rl);
  }

  try {
    writeBanner(writeLine, colorize);
    const projectName = String(await prompt(colorize('project name: ', ANSI.cyan))).trim();
    if (!projectName) {
      throw new Error('Project name is required.');
    }
    writeLine('');

    const themeKey = await resolveThemeSelection(prompt, colorize);
    writeLine('');
    const result = await generateProject({
      cwd: options.cwd,
      projectName,
      themeKey,
      lidexVersion: options.lidexVersion,
    });

    writeSummary(writeLine, colorize, result);

    return result;
  } finally {
    if (rl) {
      rl.close();
    }
  }
}

module.exports = {
  THEMES,
  generateProject,
  runInteractiveCreate,
};

