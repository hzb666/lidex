const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('generateProject scaffolds the default example site with package metadata', async () => {
  const { generateProject } = require('../../packages/create-lydex/src/index.js');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'create-lydex-project-'));

  try {
    const result = await generateProject({
      cwd: tempRoot,
      projectName: 'my-lab-site',
      themeKey: 'default',
      lydexVersion: '0.1.0',
    });

    const projectRoot = path.join(tempRoot, 'my-lab-site');
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    const config = fs.readFileSync(path.join(projectRoot, 'lydex.config.js'), 'utf8');
    const home = fs.readFileSync(path.join(projectRoot, 'content/home.md'), 'utf8');
    const fixedSlugDetail = fs.readFileSync(path.join(projectRoot, 'content/news/release-notes-2026.md'), 'utf8');

    assert.equal(result.projectRoot, projectRoot);
    assert.equal(result.themeKey, 'default');
    assert.equal(packageJson.name, 'my-lab-site');
    assert.equal(packageJson.private, true);
    assert.equal(packageJson.dependencies['@lydex/lydex'], '^0.1.0');
    assert.equal(packageJson.scripts.dev, 'lydex --root . --port 3001');
    assert.match(config, /slugField: '_slug_'/);
    assert.match(home, /title: Lydex/);
    assert.match(fixedSlugDetail, /Fixed URL Demo Entry/);
    assert.equal(fs.existsSync(path.join(projectRoot, 'assets/news/release-notes-2026/cover.webp')), true);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('generateProject rejects existing target directories', async () => {
  const { generateProject } = require('../../packages/create-lydex/src/index.js');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'create-lydex-existing-'));
  const projectRoot = path.join(tempRoot, 'my-lab-site');
  fs.mkdirSync(projectRoot, { recursive: true });

  try {
    await assert.rejects(
      () => generateProject({
        cwd: tempRoot,
        projectName: 'my-lab-site',
        themeKey: 'default',
        lydexVersion: '0.1.0',
      }),
      /already exists/i,
    );
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('runInteractiveCreate asks for project name and theme then scaffolds the site', async () => {
  const { runInteractiveCreate } = require('../../packages/create-lydex/src/index.js');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'create-lydex-interactive-'));
  const prompts = [];
  const outputs = [];

  try {
    const result = await runInteractiveCreate({
      cwd: tempRoot,
      lydexVersion: '0.1.0',
      prompt: async (question) => {
        prompts.push(question);
        if (/project name/i.test(question)) {
          return 'demo-site';
        }

        return '1';
      },
      writeLine(message) {
        outputs.push(String(message));
      },
    });

    assert.equal(result.projectRoot, path.join(tempRoot, 'demo-site'));
    assert.equal(prompts.length, 2);
    assert.equal(prompts[0].includes('project name'), true);
    assert.equal(prompts[1].includes('theme'), true);
    assert.equal(outputs.some((line) => line.includes('Lydex Project Scaffolder')), true);
    assert.equal(outputs.some((line) => line.includes('Project created')), true);
    assert.equal(outputs.some((line) => line.includes('cd demo-site')), true);
    assert.equal(outputs.some((line) => line.includes('pnpm install')), true);
    assert.equal(outputs.filter((line) => line === '').length >= 3, true);
    assert.equal(fs.existsSync(path.join(tempRoot, 'demo-site', 'content', 'home.md')), true);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

