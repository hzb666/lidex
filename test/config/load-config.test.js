const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

test('package root exports buildSite createApp and startServer', () => {
  const mod = require('../../');

  assert.equal(typeof mod.buildSite, 'function');
  assert.equal(typeof mod.createApp, 'function');
  assert.equal(typeof mod.startServer, 'function');
});

test('loadConfig resolves pages, blocks, templates, and query templates from rootDir', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const config = loadConfig({
    rootDir: path.join(__dirname, '../fixtures/basic-site'),
  });

  assert.equal(config.rootDir, path.join(__dirname, '../fixtures/basic-site'));
  assert.equal(config.pages.home.route, '/');
  assert.equal(config.blocks.card.hasDetailPage, true);
  assert.equal(config.blocks.card.route, '/listing/:slug');
  assert.equal(config.queryTemplates.compactList.endsWith('compact-list.html'), true);
});

test('loadConfig falls back to built-in templates and theme assets', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const config = loadConfig({
    rootDir: path.join(__dirname, '../fixtures/basic-site'),
    config: 'lidex-defaults.config.js',
  });

  assert.equal(config.templates.pageShell.endsWith(path.join('templates', 'page-shell.html')), true);
  assert.equal(config.templates.cardGrid.endsWith(path.join('templates', 'blocks', 'card-grid.html')), true);
  assert.equal(config.queryTemplates.compactList.endsWith(path.join('templates', 'query', 'compact-list.html')), true);
  assert.equal(config.theme.directory.endsWith('theme'), true);
  assert.equal(config.theme.mountPath, '/__lidex/theme');
  assert.equal(config.theme.stylesheetPaths.length, 2);
  assert.equal(config.theme.stylesheetPaths[0].endsWith(path.join('theme', 'base.css')), true);
  assert.equal(config.theme.stylesheetPaths[1].endsWith(path.join('theme', 'components.css')), true);
  assert.equal(config.theme.appJsPath.endsWith(path.join('theme', 'app.js')), true);
});

test('loadConfig falls back to legacy theme site.css when split theme files are absent', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const fixtureRoot = path.join(__dirname, '../fixtures/basic-site');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-theme-legacy-'));

  try {
    fs.cpSync(fixtureRoot, tempRoot, { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'legacy-theme'), { recursive: true });
    fs.writeFileSync(path.join(tempRoot, 'legacy-theme/site.css'), 'body { color: rebeccapurple; }', 'utf8');
    fs.writeFileSync(
      path.join(tempRoot, 'lidex.config.js'),
      `module.exports = {
  pages: {
    home: { route: '/', source: 'content/home.md' },
    listing: { route: '/listing', source: 'content/listing.md' },
  },
  blocks: {
    card: {
      template: 'cardGrid',
      fields: {
        slug: { type: 'string', required: true },
        title: { type: 'string', required: true },
      },
      hasDetailPage: true,
      contentDir: 'content/listing',
      slugField: 'slug',
      route: '/listing/:slug',
      detailTemplate: 'standardDetail',
    },
  },
  theme: {
    directory: 'legacy-theme',
  },
};`,
      'utf8',
    );

    const config = loadConfig({ rootDir: tempRoot });

    assert.equal(config.theme.stylesheetPaths.length, 1);
    assert.equal(config.theme.stylesheetPaths[0].endsWith(path.join('legacy-theme', 'site.css')), true);
    assert.equal(config.theme.appJsPath, null);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('loadConfig reads theme defaults from theme.json manifest', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const fixtureRoot = path.join(__dirname, '../fixtures/basic-site');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-theme-manifest-'));

  try {
    fs.cpSync(fixtureRoot, tempRoot, { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'shared-theme'), { recursive: true });
    fs.writeFileSync(
      path.join(tempRoot, 'shared-theme/theme.json'),
      JSON.stringify({
        name: 'Shared Theme',
        author: 'Theme Author',
        version: '1.2.3',
        baseCss: 'foundation.css',
        componentsCss: 'blocks.css',
        appJs: 'theme-behavior.js',
      }, null, 2),
      'utf8',
    );
    fs.writeFileSync(path.join(tempRoot, 'shared-theme/foundation.css'), 'body { line-height: 1.7; }', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'shared-theme/blocks.css'), '.card-grid-item { padding: 2rem; }', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'shared-theme/theme-behavior.js'), 'console.log("theme manifest");', 'utf8');
    fs.writeFileSync(
      path.join(tempRoot, 'lidex.config.js'),
      `module.exports = {
  pages: {
    home: { route: '/', source: 'content/home.md' },
    listing: { route: '/listing', source: 'content/listing.md' },
  },
  blocks: {
    card: {
      template: 'cardGrid',
      fields: {
        slug: { type: 'string', required: true },
        title: { type: 'string', required: true },
      },
      hasDetailPage: true,
      contentDir: 'content/listing',
      slugField: 'slug',
      route: '/listing/:slug',
      detailTemplate: 'standardDetail',
    },
  },
  theme: {
    directory: 'shared-theme',
  },
};`,
      'utf8',
    );

    const config = loadConfig({ rootDir: tempRoot });

    assert.equal(config.theme.name, 'Shared Theme');
    assert.equal(config.theme.author, 'Theme Author');
    assert.equal(config.theme.version, '1.2.3');
    assert.equal(config.theme.manifestPath.endsWith(path.join('shared-theme', 'theme.json')), true);
    assert.equal(config.theme.stylesheetPaths[0].endsWith(path.join('shared-theme', 'foundation.css')), true);
    assert.equal(config.theme.stylesheetPaths[1].endsWith(path.join('shared-theme', 'blocks.css')), true);
    assert.equal(config.theme.appJsPath.endsWith(path.join('shared-theme', 'theme-behavior.js')), true);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('loadConfig lets project theme config override theme.json entries', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const fixtureRoot = path.join(__dirname, '../fixtures/basic-site');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-theme-override-'));

  try {
    fs.cpSync(fixtureRoot, tempRoot, { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'shared-theme'), { recursive: true });
    fs.writeFileSync(
      path.join(tempRoot, 'shared-theme/theme.json'),
      JSON.stringify({
        name: 'Shared Theme',
        baseCss: 'foundation.css',
        componentsCss: 'blocks.css',
      }, null, 2),
      'utf8',
    );
    fs.writeFileSync(path.join(tempRoot, 'shared-theme/foundation.css'), 'body { color: #222; }', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'shared-theme/blocks.css'), '.card-grid-item { padding: 2rem; }', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'shared-theme/override-components.css'), '.card-grid-item { padding: 3rem; }', 'utf8');
    fs.writeFileSync(
      path.join(tempRoot, 'lidex.config.js'),
      `module.exports = {
  pages: {
    home: { route: '/', source: 'content/home.md' },
    listing: { route: '/listing', source: 'content/listing.md' },
  },
  blocks: {
    card: {
      template: 'cardGrid',
      fields: {
        slug: { type: 'string', required: true },
        title: { type: 'string', required: true },
      },
      hasDetailPage: true,
      contentDir: 'content/listing',
      slugField: 'slug',
      route: '/listing/:slug',
      detailTemplate: 'standardDetail',
    },
  },
  theme: {
    directory: 'shared-theme',
    name: 'Project Override',
    componentsCss: 'override-components.css',
  },
};`,
      'utf8',
    );

    const config = loadConfig({ rootDir: tempRoot });

    assert.equal(config.theme.name, 'Project Override');
    assert.equal(config.theme.stylesheetPaths[0].endsWith(path.join('shared-theme', 'foundation.css')), true);
    assert.equal(config.theme.stylesheetPaths[1].endsWith(path.join('shared-theme', 'override-components.css')), true);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('loadConfig keeps tailwind enabled and resolves generated Tailwind theme paths', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-tailwind-config-'));

  try {
    fs.mkdirSync(path.join(tempRoot, 'content'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'theme'), { recursive: true });
    fs.writeFileSync(path.join(tempRoot, 'theme/tailwind.css'), '@import "tailwindcss";', 'utf8');
    fs.writeFileSync(
      path.join(tempRoot, 'lidex.config.js'),
      `module.exports = {
  tailwind: true,
  head: {
    stylesheets: ['https://cdn.example.com/site.css'],
  },
  theme: {
    directory: 'theme',
  },
  pages: {
    home: { route: '/', source: 'content/home.md' },
  },
  blocks: {},
};`,
      'utf8',
    );
    fs.writeFileSync(path.join(tempRoot, 'content/home.md'), '# Home', 'utf8');

    const config = loadConfig({ rootDir: tempRoot });

    assert.equal(config.tailwind, true);
    assert.deepEqual(config.head.stylesheets, ['https://cdn.example.com/site.css']);
    assert.deepEqual(config.head.scripts, []);
    assert.equal(config.theme.tailwindInputPath.endsWith(path.join('theme', 'tailwind.css')), true);
    assert.equal(config.theme.tailwindOutputPath.endsWith(path.join('theme', 'tailwind.generated.css')), true);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('loadConfig throws when theme.json contains invalid JSON', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const fixtureRoot = path.join(__dirname, '../fixtures/basic-site');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-theme-invalid-json-'));

  try {
    fs.cpSync(fixtureRoot, tempRoot, { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'shared-theme'), { recursive: true });
    fs.writeFileSync(path.join(tempRoot, 'shared-theme/theme.json'), '{ invalid json', 'utf8');
    fs.writeFileSync(
      path.join(tempRoot, 'lidex.config.js'),
      `module.exports = {
  pages: {
    home: { route: '/', source: 'content/home.md' },
    listing: { route: '/listing', source: 'content/listing.md' },
  },
  blocks: {
    card: {
      template: 'cardGrid',
      fields: {
        slug: { type: 'string', required: true },
        title: { type: 'string', required: true },
      },
      hasDetailPage: true,
      contentDir: 'content/listing',
      slugField: 'slug',
      route: '/listing/:slug',
      detailTemplate: 'standardDetail',
    },
  },
  theme: {
    directory: 'shared-theme',
  },
};`,
      'utf8',
    );

    assert.throws(
      () => loadConfig({ rootDir: tempRoot }),
      /theme manifest contains invalid json/i,
    );
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('loadConfig throws when theme.json fields are not strings', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const fixtureRoot = path.join(__dirname, '../fixtures/basic-site');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-theme-invalid-field-'));

  try {
    fs.cpSync(fixtureRoot, tempRoot, { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'shared-theme'), { recursive: true });
    fs.writeFileSync(
      path.join(tempRoot, 'shared-theme/theme.json'),
      JSON.stringify({
        name: 'Shared Theme',
        baseCss: ['foundation.css'],
      }, null, 2),
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'lidex.config.js'),
      `module.exports = {
  pages: {
    home: { route: '/', source: 'content/home.md' },
    listing: { route: '/listing', source: 'content/listing.md' },
  },
  blocks: {
    card: {
      template: 'cardGrid',
      fields: {
        slug: { type: 'string', required: true },
        title: { type: 'string', required: true },
      },
      hasDetailPage: true,
      contentDir: 'content/listing',
      slugField: 'slug',
      route: '/listing/:slug',
      detailTemplate: 'standardDetail',
    },
  },
  theme: {
    directory: 'shared-theme',
  },
};`,
      'utf8',
    );

    assert.throws(
      () => loadConfig({ rootDir: tempRoot }),
      /theme manifest field "baseCss" must be a string/i,
    );
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('loadConfig throws when a declared template file does not exist', () => {
  const { loadConfig } = require('../../src/config/load-config.js');

  assert.throws(
    () => loadConfig({
      rootDir: path.join(__dirname, '../fixtures/basic-site'),
      config: 'lidex-missing-template.config.js',
    }),
    /template "cardGrid" not found/i,
  );
});

test('loadConfig throws when a block template key is not declared', () => {
  const { loadConfig } = require('../../src/config/load-config.js');

  assert.throws(
    () => loadConfig({
      rootDir: path.join(__dirname, '../fixtures/basic-site'),
      config: 'lidex-missing-template-key.config.js',
    }),
    /unknown template key/i,
  );
});

test('loadConfig throws when a detail template key is not declared', () => {
  const { loadConfig } = require('../../src/config/load-config.js');

  assert.throws(
    () => loadConfig({
      rootDir: path.join(__dirname, '../fixtures/basic-site'),
      config: 'lidex-missing-detail-template-key.config.js',
    }),
    /unknown detail template key/i,
  );
});

test('validateConfig requires detail page blocks to declare contentDir slugField and detailTemplate', () => {
  const { validateConfig } = require('../../src/config/validate-config.js');

  assert.throws(
    () => validateConfig({
      pages: {
        home: { route: '/', source: 'content/home.md' },
      },
      blocks: {
        card: {
          template: 'cardGrid',
          fields: {
            slug: { type: 'string', required: true },
          },
          hasDetailPage: true,
          route: '/listing/:slug',
          slugField: 'slug',
        },
      },
    }),
    /contentDir/i,
  );
});

test('validateConfig requires detail page blocks to declare a route with :slug', () => {
  const { validateConfig } = require('../../src/config/validate-config.js');

  assert.throws(
    () => validateConfig({
      pages: {
        home: { route: '/', source: 'content/home.md' },
      },
      blocks: {
        card: {
          template: 'cardGrid',
          fields: {
            slug: { type: 'string', required: true },
          },
          hasDetailPage: true,
          contentDir: 'content/listing',
          slugField: 'slug',
          detailTemplate: 'standardDetail',
          route: '/listing',
        },
      },
    }),
    /route.*:slug/i,
  );
});

test('validateConfig rejects reserved _pages_ block names', () => {
  const { validateConfig } = require('../../src/config/validate-config.js');

  assert.throws(
    () => validateConfig({
      pages: {
        home: { route: '/', source: 'content/home.md' },
      },
      blocks: {
        _pages_: {
          template: 'cardGrid',
          fields: {},
        },
      },
    }),
    /reserved/i,
  );
});

test('validateConfig requires slugSourceField to be a string when provided', () => {
  const { validateConfig } = require('../../src/config/validate-config.js');

  assert.throws(
    () => validateConfig({
      pages: {
        home: { route: '/', source: 'content/home.md' },
      },
      blocks: {
        card: {
          template: 'cardGrid',
          fields: {
            title: { type: 'string', required: true },
          },
          hasDetailPage: true,
          contentDir: 'content/listing',
          slugField: 'slug',
          slugSourceField: ['title'],
          detailTemplate: 'standardDetail',
          route: '/listing/:slug',
        },
      },
    }),
    /slugsourcefield/i,
  );
});

test('validateConfig rejects reserved system fields inside block declarations', () => {
  const { validateConfig } = require('../../src/config/validate-config.js');

  assert.throws(
    () => validateConfig({
      pages: {
        home: { route: '/', source: 'content/home.md' },
      },
      blocks: {
        card: {
          template: 'cardGrid',
          fields: {
            _id_: { type: 'string', required: false },
            title: { type: 'string', required: true },
          },
        },
      },
    }),
    /reserved system field/i,
  );
});

test('validateConfig requires tailwind to be a boolean when provided', () => {
  const { validateConfig } = require('../../src/config/validate-config.js');

  assert.throws(
    () => validateConfig({
      tailwind: 'yes',
      pages: {
        home: { route: '/', source: 'content/home.md' },
      },
      blocks: {},
    }),
    /config\.tailwind/i,
  );
});

