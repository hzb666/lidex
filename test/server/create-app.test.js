const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const express = require('express');
const request = require('supertest');

test('createApp returns an express-compatible app', () => {
  const { createApp } = require('../../src/index.js');
  const app = createApp({ rootDir: path.join(__dirname, '../fixtures/basic-site') });

  assert.equal(typeof app.use, 'function');
  assert.equal(typeof app.get, 'function');
});

test('startServer uses default host and port', () => {
  const originalListen = express.application.listen;
  let captured = null;

  express.application.listen = function listen(port, host) {
    captured = { port, host };
    return { close() {} };
  };

  try {
    const { startServer } = require('../../src/index.js');
    startServer({ rootDir: path.join(__dirname, '../fixtures/basic-site') });

    assert.deepEqual(captured, { port: 3001, host: '127.0.0.1' });
  } finally {
    express.application.listen = originalListen;
  }
});

test('startServer forwards explicit host and port', () => {
  const originalListen = express.application.listen;
  let captured = null;

  express.application.listen = function listen(port, host) {
    captured = { port, host };
    return { close() {} };
  };

  try {
    const { startServer } = require('../../src/index.js');
    startServer({
      rootDir: path.join(__dirname, '../fixtures/basic-site'),
      port: 4010,
      host: '127.0.0.1',
    });

    assert.deepEqual(captured, { port: 4010, host: '127.0.0.1' });
  } finally {
    express.application.listen = originalListen;
  }
});

test('startServer preserves port 0 for ephemeral port binding', () => {
  const originalListen = express.application.listen;
  let captured = null;

  express.application.listen = function listen(port, host) {
    captured = { port, host };
    return { close() {} };
  };

  try {
    const { startServer } = require('../../src/index.js');
    startServer({
      rootDir: path.join(__dirname, '../fixtures/basic-site'),
      port: 0,
    });

    assert.deepEqual(captured, { port: 0, host: '127.0.0.1' });
  } finally {
    express.application.listen = originalListen;
  }
});

test('startServer logs the listening urls and config path', () => {
  const originalListen = express.application.listen;
  const originalConsoleLog = console.log;
  const logs = [];

  express.application.listen = function listen(port, host, callback) {
    callback();
    return { close() {} };
  };
  console.log = function log(message) {
    logs.push(String(message));
  };

  try {
    const { startServer } = require('../../src/index.js');
    startServer({
      rootDir: path.join(__dirname, '../fixtures/basic-site'),
      port: 4010,
      host: '0.0.0.0',
      adminPassword: 'secret',
      adminPath: '/manage',
    });

    assert.equal(logs.some((line) => line.includes('[lidex] root:')), true);
    assert.equal(logs.some((line) => line.includes('fixtures\\basic-site')), true);
    assert.equal(logs.some((line) => line.includes('[lidex] config:')), true);
    assert.equal(logs.some((line) => line.includes('lidex.config.js')), true);
    assert.equal(logs.some((line) => line.includes('[lidex] listening: http://127.0.0.1:4010/')), true);
    assert.equal(logs.some((line) => line.includes('[lidex] admin: http://127.0.0.1:4010/manage')), true);
  } finally {
    console.log = originalConsoleLog;
    express.application.listen = originalListen;
  }
});

test('startServer forwards app options into createApp context', () => {
  const originalListen = express.application.listen;
  let captured = null;
  const rootDir = path.resolve(__dirname, '../../example');

  express.application.listen = function listen(port, host) {
    captured = {
      port,
      host,
      rootDir: this.locals.__lidex.options.rootDir,
    };
    return { close() {} };
  };

  try {
    const { startServer } = require('../../src/index.js');
    startServer({ port: 4010, host: '127.0.0.1', rootDir });

    assert.deepEqual(captured, {
      port: 4010,
      host: '127.0.0.1',
      rootDir,
    });
  } finally {
    express.application.listen = originalListen;
  }
});

test('CLI entry invokes startServer', () => {
  const cliPath = path.resolve(__dirname, '../../bin/lidex.js');
  const runCliPath = path.resolve(__dirname, '../../src/cli/run-cli.js');
  const originalRunCliModule = require.cache[runCliPath];
  const originalCliModule = require.cache[cliPath];
  const originalArgv = process.argv.slice();
  let called = false;
  let receivedOptions = null;

  process.argv = [
    process.argv[0],
    cliPath,
    '--root',
    './example',
    '--port',
    '4010',
    '--host',
    '0.0.0.0',
    '--config',
    'custom.config.js',
  ];

  require.cache[runCliPath] = {
    id: runCliPath,
    filename: runCliPath,
    loaded: true,
    exports: {
      runCli(argv) {
        called = true;
        receivedOptions = argv;
      },
    },
  };

  delete require.cache[cliPath];

  try {
    require(cliPath);
    assert.equal(called, true);
    assert.deepEqual(receivedOptions, process.argv.slice(2));
  } finally {
    process.argv = originalArgv;
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

test('createApp serves pages and detail routes from rootDir', async () => {
  const { createApp } = require('../../src/index.js');
  const app = createApp({ rootDir: path.join(__dirname, '../fixtures/basic-site') });

  const home = await request(app).get('/');
  const detail = await request(app).get('/listing/example-item');

  assert.equal(home.status, 200);
  assert.equal(detail.status, 200);
  assert.match(detail.text, /Example Item/);
});

test('createApp writes managed metadata json during preview bootstrap', () => {
  const { createApp } = require('../../src/index.js');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-preview-managed-metadata-'));

  try {
    fs.mkdirSync(path.join(tempRoot, 'content/news'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/blocks'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/details'), { recursive: true });

    fs.writeFileSync(
      path.join(tempRoot, 'lidex.config.js'),
      `module.exports = {
  pages: {
    news: { route: '/news', source: 'content/news.md' },
  },
  blocks: {
    news: {
      template: 'newsCard',
      fields: {
        title: { type: 'string', required: true },
      },
      hasDetailPage: true,
      enablePagination: true,
      contentDir: 'content/news',
      slugField: '_slug_',
      slugSourceField: 'title',
      route: '/news/:slug',
      detailTemplate: 'newsDetail',
    },
  },
  templates: {
    pageShell: 'templates/page-shell.html',
    newsCard: 'templates/blocks/news-card.html',
    newsDetail: 'templates/details/news-detail.html',
  },
};
`,
      'utf8',
    );
    fs.writeFileSync(path.join(tempRoot, 'templates/page-shell.html'), '<main>{{{contentHtml}}}</main>', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/blocks/news-card.html'), '<article>{{title}}</article>', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/details/news-detail.html'), '<article>{{title}} {{{bodyHtml}}}</article>', 'utf8');
    fs.writeFileSync(
      path.join(tempRoot, 'content/news.md'),
      `---
title: News
---

:::news
title: Preview News
_page_: 5
:::
`,
      'utf8',
    );

    createApp({ rootDir: tempRoot });

    const metadata = JSON.parse(fs.readFileSync(path.join(tempRoot, '.lidex', 'managed-content.json'), 'utf8'));
    const entry = metadata.entries.find((item) => item.block === 'news');

    assert.equal(metadata.mode, 'preview');
    assert.equal(entry.reservedFields._slug_, 'preview-news');
    assert.equal(entry.reservedFields._page_, '5');
    assert.equal(entry.resolved.slug, 'preview-news');
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('admin routes require auth and can read content files safely', async () => {
  const { createApp } = require('../../src/index.js');
  const app = createApp({
    rootDir: path.join(__dirname, '../fixtures/basic-site'),
    adminUser: 'admin',
    adminPassword: 'secret',
    adminPath: '/manage',
  });

  const unauthenticatedAdmin = await request(app).get('/manage');
  const authenticatedFile = await request(app)
    .get('/manage/api/file/content/listing.md')
    .auth('admin', 'secret');
  const pathTraversal = await request(app)
    .get('/manage/api/file')
    .query({ path: '../package.json' })
    .auth('admin', 'secret');
  const configRead = await request(app)
    .get('/manage/api/file')
    .query({ path: 'lidex.config.js' })
    .auth('admin', 'secret');

  assert.equal(unauthenticatedAdmin.status, 401);
  assert.equal(authenticatedFile.status, 200);
  assert.match(authenticatedFile.text, /:::card/);
  assert.equal(pathTraversal.status, 400);
  assert.equal(configRead.status, 403);
});

test('createApp serves built-in templates, theme assets, and site assets', async () => {
  const { createApp } = require('../../src/index.js');
  const app = createApp({
    rootDir: path.join(__dirname, '../fixtures/basic-site'),
    config: 'lidex-defaults.config.js',
  });

  const home = await request(app).get('/');
  const themeBaseCss = await request(app).get('/__lidex/theme/base.css');
  const themeComponentsCss = await request(app).get('/__lidex/theme/components.css');
  const themeCss = await request(app).get('/__lidex/theme/site.css');
  const themeJs = await request(app).get('/__lidex/theme/app.js');
  const asset = await request(app).get('/assets/example.txt');

  assert.equal(home.status, 200);
  assert.match(home.text, /__lidex\/theme\/base\.css/);
  assert.match(home.text, /__lidex\/theme\/components\.css/);
  assert.equal(themeBaseCss.status, 200);
  assert.match(themeBaseCss.text, /line-height/);
  assert.equal(themeComponentsCss.status, 200);
  assert.match(themeComponentsCss.text, /card-grid-item/);
  assert.equal(themeCss.status, 200);
  assert.match(themeCss.text, /base\.css/);
  assert.equal(themeJs.status, 200);
  assert.match(themeJs.text, /lidex theme loaded/);
  assert.equal(asset.status, 200);
  assert.match(asset.text, /fixture asset/);
});

test('createApp injects theme assets declared by theme.json manifest', async () => {
  const { createApp } = require('../../src/index.js');
  const fixtureRoot = path.join(__dirname, '../fixtures/basic-site');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-theme-manifest-app-'));

  try {
    fs.cpSync(fixtureRoot, tempRoot, { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'shared-theme'), { recursive: true });
    fs.writeFileSync(
      path.join(tempRoot, 'shared-theme/theme.json'),
      JSON.stringify({
        baseCss: 'foundation.css',
        componentsCss: 'blocks.css',
        appJs: 'theme.js',
      }, null, 2),
      'utf8',
    );
    fs.writeFileSync(path.join(tempRoot, 'shared-theme/foundation.css'), 'body { color: #222; }', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'shared-theme/blocks.css'), '.card-grid-item { padding: 2rem; }', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'shared-theme/theme.js'), 'console.log("manifest theme");', 'utf8');
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
        category: { type: 'string', required: false },
        publishedAt: { type: 'string', required: false },
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

    const app = createApp({ rootDir: tempRoot });

    const home = await request(app).get('/');
    const themeBaseCss = await request(app).get('/__lidex/theme/foundation.css');
    const themeComponentsCss = await request(app).get('/__lidex/theme/blocks.css');
    const themeJs = await request(app).get('/__lidex/theme/theme.js');

    assert.equal(home.status, 200);
    assert.match(home.text, /__lidex\/theme\/foundation\.css/);
    assert.match(home.text, /__lidex\/theme\/blocks\.css/);
    assert.match(home.text, /__lidex\/theme\/theme\.js/);
    assert.equal(themeBaseCss.status, 200);
    assert.equal(themeComponentsCss.status, 200);
    assert.equal(themeJs.status, 200);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('createApp compiles Tailwind CSS into a generated theme stylesheet when enabled', async () => {
  const { createApp } = require('../../src/index.js');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-tailwind-preview-'));

  try {
    fs.mkdirSync(path.join(tempRoot, 'content'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'theme'), { recursive: true });

    fs.writeFileSync(
      path.join(tempRoot, 'lidex.config.js'),
      `module.exports = {
  tailwind: true,
  theme: {
    directory: 'theme',
  },
  pages: {
    home: { route: '/', source: 'content/home.md' },
  },
  blocks: {},
  templates: {
    pageShell: 'templates/page-shell.html',
  },
};`,
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'templates/page-shell.html'),
      '<!doctype html><html><head>{{{themeStylesheetsHtml}}}<title>{{title}}</title></head><body><main class="text-fuchsia-500">{{{contentHtml}}}</main></body></html>',
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'theme/tailwind.css'),
      '@import "tailwindcss";',
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'content/home.md'),
      `---
title: Home
---

Preview body.`,
      'utf8',
    );

    const app = createApp({ rootDir: tempRoot });
    const home = await request(app).get('/');
    const generatedCss = await request(app).get('/__lidex/theme/tailwind.generated.css');

    assert.equal(home.status, 200);
    assert.match(home.text, /__lidex\/theme\/tailwind\.generated\.css/);
    assert.equal(generatedCss.status, 200);
    assert.match(generatedCss.text, /text-fuchsia-500/);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('createApp validates Tailwind before writing managed content', () => {
  const { createApp } = require('../../src/index.js');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-tailwind-preview-fail-'));

  try {
    fs.mkdirSync(path.join(tempRoot, 'content/news'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/blocks'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/details'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'theme'), { recursive: true });

    const homePath = path.join(tempRoot, 'content/home.md');
    const originalHome = `---
title: Home
---

:::news
title: Broken
:::`;

    fs.writeFileSync(
      path.join(tempRoot, 'lidex.config.js'),
      `module.exports = {
  tailwind: true,
  theme: {
    directory: 'theme',
  },
  pages: {
    home: { route: '/', source: 'content/home.md' },
  },
  blocks: {
    news: {
      template: 'newsCard',
      fields: {
        title: { type: 'string', required: true },
      },
      hasDetailPage: true,
      contentDir: 'content/news',
      slugField: '_slug_',
      slugSourceField: 'title',
      route: '/news/:slug',
      detailTemplate: 'newsDetail',
    },
  },
  templates: {
    pageShell: 'templates/page-shell.html',
    newsCard: 'templates/blocks/news-card.html',
    newsDetail: 'templates/details/news-detail.html',
  },
};`,
      'utf8',
    );
    fs.writeFileSync(path.join(tempRoot, 'templates/page-shell.html'), '{{{contentHtml}}}', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/blocks/news-card.html'), '{{title}}', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/details/news-detail.html'), '{{title}} {{{bodyHtml}}}', 'utf8');
    fs.writeFileSync(homePath, originalHome, 'utf8');

    assert.throws(
      () => createApp({ rootDir: tempRoot }),
      /Tailwind input stylesheet not found/i,
    );

    assert.equal(fs.readFileSync(homePath, 'utf8'), originalHome);
    assert.equal(fs.existsSync(path.join(tempRoot, 'content/news/broken.md')), false);
    assert.equal(fs.existsSync(path.join(tempRoot, '.lidex/managed-content.json')), false);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('admin routes list files, list assets, and can save files inside rootDir', async () => {
  const { createApp } = require('../../src/index.js');
  const fixtureRoot = path.join(__dirname, '../fixtures/basic-site');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-admin-'));
  fs.cpSync(fixtureRoot, tempRoot, { recursive: true });

  const app = createApp({
    rootDir: tempRoot,
    adminUser: 'admin',
    adminPassword: 'secret',
    adminPath: '/manage',
  });

  try {
    const files = await request(app)
      .get('/manage/api/files')
      .query({ dir: 'content' })
      .auth('admin', 'secret');
    const assets = await request(app)
      .get('/manage/api/assets')
      .auth('admin', 'secret');
    const saved = await request(app)
      .put('/manage/api/file')
      .query({ path: 'content/admin-created.md' })
      .set('Content-Type', 'text/plain')
      .send('# Admin Saved')
      .auth('admin', 'secret');
    const loaded = await request(app)
      .get('/manage/api/file')
      .query({ path: 'content/admin-created.md' })
      .auth('admin', 'secret');

    assert.equal(files.status, 200);
    assert.equal(Array.isArray(files.body.entries), true);
    assert.equal(files.body.entries.some((entry) => entry.path === 'content/listing.md'), true);
    assert.equal(assets.status, 200);
    assert.equal(assets.body.entries.some((entry) => entry.path === 'assets/example.txt'), true);
    assert.equal(saved.status, 200);
    assert.deepEqual(saved.body, {
      path: 'content/admin-created.md',
      saved: true,
    });
    assert.equal(loaded.status, 200);
    assert.equal(loaded.text, '# Admin Saved');
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('admin content writes refresh the in-memory site index', async () => {
  const { createApp } = require('../../src/index.js');
  const fixtureRoot = path.join(__dirname, '../fixtures/basic-site');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-admin-refresh-'));
  fs.cpSync(fixtureRoot, tempRoot, { recursive: true });

  const app = createApp({
    rootDir: tempRoot,
    adminUser: 'admin',
    adminPassword: 'secret',
    adminPath: '/manage',
  });

  try {
    const before = await request(app).get('/listing/example-item');
    const saved = await request(app)
      .put('/manage/api/file')
      .query({ path: 'content/listing/example-item.md' })
      .set('Content-Type', 'text/plain')
      .send('---\ntitle: Changed Detail\n---\n\nChanged detail body.')
      .auth('admin', 'secret');
    const after = await request(app).get('/listing/example-item');

    assert.equal(before.status, 200);
    assert.match(before.text, /Example Item/);
    assert.equal(saved.status, 200);
    assert.equal(after.status, 200);
    assert.match(after.text, /Changed Detail/);
    assert.doesNotMatch(after.text, /Example Item/);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('createApp fails fast when the config file is missing', () => {
  const { createApp } = require('../../src/index.js');

  assert.throws(
    () => createApp({
      rootDir: path.join(__dirname, '../fixtures/basic-site'),
      config: 'missing.config.js',
    }),
    /config file not found/i,
  );
});

test('createApp rejects duplicate page routes', () => {
  const { createApp } = require('../../src/index.js');

  assert.throws(
    () => createApp({
      rootDir: path.join(__dirname, '../fixtures/basic-site'),
      config: 'lidex-duplicate-page-routes.config.js',
    }),
    /duplicate route/i,
  );
});

test('createApp rejects duplicate detail routes', () => {
  const { createApp } = require('../../src/index.js');

  assert.throws(
    () => createApp({
      rootDir: path.join(__dirname, '../fixtures/basic-site'),
      config: 'lidex-duplicate-detail-routes.config.js',
    }),
    /duplicate route/i,
  );
});

test('createApp rejects semantic route collisions between pages and detail routes', () => {
  const { createApp } = require('../../src/index.js');

  assert.throws(
    () => createApp({
      rootDir: path.join(__dirname, '../fixtures/basic-site'),
      config: 'lidex-route-shadow.config.js',
    }),
    /conflicting routes/i,
  );
});

test('page rendering escapes raw html from markdown content', async () => {
  const { createApp } = require('../../src/index.js');
  const app = createApp({
    rootDir: path.join(__dirname, '../fixtures/basic-site'),
    config: 'lidex-unsafe.config.js',
  });

  const home = await request(app).get('/');

  assert.equal(home.status, 200);
  assert.match(home.text, /&lt;script&gt;alert/);
  assert.doesNotMatch(home.text, /<script>alert/);
});

test('page rendering preserves fenced code examples and does not treat them as real blocks', async () => {
  const { createApp } = require('../../src/index.js');
  const fixtureRoot = path.join(__dirname, '../fixtures/basic-site');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-page-code-'));
  fs.cpSync(fixtureRoot, tempRoot, { recursive: true });

  try {
    fs.writeFileSync(
      path.join(tempRoot, 'content/home.md'),
      `---
title: Home
---

Example block syntax:

\`\`\`md
:::card
slug: example-in-code
title: Example In Code
:::
\`\`\`

:::card
slug: real-listing
title: Real Listing
:::`,
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'content/listing/real-listing.md'),
      '---\ntitle: Real Listing\n---\n\nReal listing detail body.',
      'utf8',
    );

    const app = createApp({ rootDir: tempRoot });
    const response = await request(app).get('/');

    assert.equal(response.status, 200);
    assert.match(response.text, /<pre class="markdown-code-block"><code class="language-md">:::card/);
    assert.match(response.text, /Example In Code/);
    assert.match(response.text, /Real Listing/);
    assert.equal((response.text.match(/<article><h2>/g) || []).length, 1);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('detail pagination merges matching block types across pages and renders previous/next links', async () => {
  const { createApp } = require('../../src/index.js');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-detail-pagination-'));

  try {
    fs.mkdirSync(path.join(tempRoot, 'content/entries'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/blocks'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/details'), { recursive: true });

    fs.writeFileSync(
      path.join(tempRoot, 'lidex.config.js'),
      `module.exports = {
  pages: {
    alpha: { route: '/alpha', source: 'content/alpha.md' },
    beta: { route: '/beta', source: 'content/beta.md' },
  },
  blocks: {
    entry: {
      template: 'entryCard',
      fields: {
        slug: { type: 'string', required: true },
        title: { type: 'string', required: true },
      },
      hasDetailPage: true,
      enablePagination: true,
      contentDir: 'content/entries',
      slugField: 'slug',
      route: '/entries/:slug',
      detailTemplate: 'entryDetail',
    },
  },
  templates: {
    pageShell: 'templates/page-shell.html',
    entryCard: 'templates/blocks/entry-card.html',
    entryDetail: 'templates/details/entry-detail.html',
  },
};`,
      'utf8',
    );

    fs.writeFileSync(
      path.join(tempRoot, 'templates/page-shell.html'),
      '<main>{{{pageHeaderHtml}}}{{{contentHtml}}}</main>',
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'templates/blocks/entry-card.html'),
      '<a href="{{detailRoute}}">{{title}}</a>',
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'templates/details/entry-detail.html'),
      `<article>
  <h1>{{title}}</h1>
  {{#paginationPrev}}<a class="detail-prev" href="{{route}}">{{label}} {{title}}</a>{{/paginationPrev}}
  {{#paginationNext}}<a class="detail-next" href="{{route}}">{{label}} {{title}}</a>{{/paginationNext}}
  <div>{{{bodyHtml}}}</div>
</article>`,
      'utf8',
    );

    fs.writeFileSync(
      path.join(tempRoot, 'content/alpha.md'),
      `---
title: Alpha
eyebrow: Alpha
---

:::entry
slug: alpha-one
title: Alpha One
_page_: 1
:::

:::entry
slug: alpha-two
title: Alpha Two
_page_: 2
:::

:::entry
slug: alpha-four
title: Alpha Four
_page_: 4
:::
`,
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'content/beta.md'),
      `---
title: Beta
eyebrow: Beta
---

:::entry
slug: beta-one
title: Beta One
_page_: 1
:::

:::entry
slug: beta-two
title: Beta Two
_page_: 2
:::

:::entry
slug: beta-three
title: Beta Three
_page_: 3
:::
`,
      'utf8',
    );

    for (const [slug, title] of [
      ['alpha-one', 'Alpha One'],
      ['alpha-two', 'Alpha Two'],
      ['alpha-four', 'Alpha Four'],
      ['beta-one', 'Beta One'],
      ['beta-two', 'Beta Two'],
      ['beta-three', 'Beta Three'],
    ]) {
      fs.writeFileSync(
        path.join(tempRoot, `content/entries/${slug}.md`),
        `---\ntitle: ${title}\n---\n\n${title} detail body.`,
        'utf8',
      );
    }

    const app = createApp({ rootDir: tempRoot });

    const alphaTwo = await request(app).get('/entries/alpha-two');
    const betaThree = await request(app).get('/entries/beta-three');
    const alphaFour = await request(app).get('/entries/alpha-four');

    assert.equal(alphaTwo.status, 200);
    assert.match(alphaTwo.text, /detail-prev[^>]+\/entries\/alpha-one/);
    assert.match(alphaTwo.text, /Previous Alpha One/);
    assert.match(alphaTwo.text, /detail-next[^>]+\/entries\/beta-one/);
    assert.match(alphaTwo.text, /Next Beta One/);
    assert.match(alphaTwo.text, /detail-pagination-control/);

    assert.equal(betaThree.status, 200);
    assert.match(betaThree.text, /detail-prev[^>]+\/entries\/beta-two/);
    assert.match(betaThree.text, /detail-next[^>]+\/entries\/alpha-four/);

    assert.equal(alphaFour.status, 200);
    assert.match(alphaFour.text, /detail-prev[^>]+\/entries\/beta-three/);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('default ultra-minimal example site renders shared shell, latest news query, and detail routes', async () => {
  const { createApp } = require('../../src/index.js');
  const app = createApp({ rootDir: path.resolve(__dirname, '../../example') });

  const home = await request(app).get('/');
  const members = await request(app).get('/blocks');
  const memberDetail = await request(app).get('/blocks/query-driven');
  const news = await request(app).get('/queries');
  const newsDetail = await request(app).get('/queries/declarative-query-examples-expanded');
  const fixedSlugDetail = await request(app).get('/queries/release-notes-2026');

  assert.equal(home.status, 200);
  assert.match(home.text, /Lidex/);
  assert.match(home.text, /rel="icon" type="image\/svg\+xml" href="\/assets\/public\/favicon-static\.svg"/);
  assert.match(home.text, /__lidex\/theme\/base\.css/);
  assert.match(home.text, /__lidex\/theme\/components\.css/);
  assert.match(home.text, /__lidex\/theme\/app\.js/);
  assert.doesNotMatch(home.text, /cdn\.tailwindcss\.com/);
  assert.doesNotMatch(home.text, /\/assets\/public\/styles\.css/);
  assert.match(home.text, /class="brand-logo loaded" src="\/assets\/public\/favicon\.svg"/);
  assert.match(home.text, /Markdown First/);
  assert.match(home.text, /Query Driven/);
  assert.match(home.text, /Template Override Notes Refined/);
  assert.match(home.text, /\/queries\/declarative-query-examples-expanded/);
  assert.match(home.text, /latest-news__item/);
  assert.match(home.text, /hero hero--home hero--text-only/);
  assert.match(home.text, /hero-meta/);
  assert.match(home.text, /feature-grid-wrapper/);
  assert.match(home.text, /feature-grid-list/);
  assert.match(home.text, /query-block/);
  assert.doesNotMatch(home.text, /hero-image-full/);
  assert.equal(members.status, 200);
  assert.match(members.text, /Design Freedom/);
  assert.match(members.text, /hero hero--blocks/);
  assert.match(members.text, /\/blocks\/design-freedom/);
  assert.equal(memberDetail.status, 200);
  assert.match(memberDetail.text, /Query Driven/);
  assert.match(memberDetail.text, /hero hero--feature/);
  assert.match(memberDetail.text, /Previous/);
  assert.match(memberDetail.text, /Next/);
  assert.equal(news.status, 200);
  assert.match(news.text, /Detail Route Walkthrough Added/);
  assert.equal(newsDetail.status, 200);
  assert.match(newsDetail.text, /Declarative Query Examples Expanded/);
  assert.equal(fixedSlugDetail.status, 200);
  assert.match(fixedSlugDetail.text, /Fixed URL Demo Entry/);
  assert.match(fixedSlugDetail.text, /release-notes-2026/);
  assert.match(members.text, /accordion-list/);
  assert.match(members.text, /accordion-item__trigger/);
  assert.match(members.text, /What Makes A Good Block Contract\?/);
  assert.match(members.text, /aria-expanded="false"/);
});

test('example theme app includes accordion interaction bootstrap', async () => {
  const { createApp } = require('../../src/index.js');
  const app = createApp({ rootDir: path.resolve(__dirname, '../../example') });

  const themeJs = await request(app).get('/__lidex/theme/app.js');

  assert.equal(themeJs.status, 200);
  assert.match(themeJs.text, /accordion/i);
  assert.match(themeJs.text, /aria-expanded/);
});

test('createApp resolves page and detail cover images from managed asset directories', async () => {
  const { createApp } = require('../../src/index.js');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-managed-cover-'));

  try {
    fs.mkdirSync(path.join(tempRoot, 'content/news'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'assets/_pages_/home'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'assets/news/new-paper'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/blocks'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/details'), { recursive: true });

    fs.writeFileSync(
      path.join(tempRoot, 'lidex.config.js'),
      `module.exports = {
  pages: {
    home: { route: '/', source: 'content/home.md' },
  },
  blocks: {
    news: {
      template: 'newsCard',
      fields: {
        title: { type: 'string', required: true },
        summary: { type: 'string', required: false },
      },
      hasDetailPage: true,
      contentDir: 'content/news',
      slugField: 'slug',
      slugSourceField: 'title',
      route: '/news/:slug',
      detailTemplate: 'newsDetail',
    },
  },
  templates: {
    pageShell: 'templates/page-shell.html',
    newsCard: 'templates/blocks/news-card.html',
    newsDetail: 'templates/details/news-detail.html',
  },
};
`,
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'templates/page-shell.html'),
      '<main>{{{pageHeaderHtml}}}{{{contentHtml}}}</main>',
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'templates/blocks/news-card.html'),
      '<article><img src="{{coverImage}}" alt=""><a href="{{detailRoute}}">{{title}}</a></article>',
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'templates/details/news-detail.html'),
      '<article><h1>{{title}}</h1><img src="{{heroImage}}" alt=""><div>{{{bodyHtml}}}</div></article>',
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'content/home.md'),
      `---
title: Home
lead: Intro
---

:::news
title: New Paper
summary: Summary
:::
`,
      'utf8',
    );
    fs.writeFileSync(path.join(tempRoot, 'content/news/new-paper.md'), 'Body content.', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'assets/_pages_/home/cover.webp'), 'page-cover', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'assets/news/new-paper/cover.webp'), 'detail-cover', 'utf8');

    const app = createApp({ rootDir: tempRoot });
    const home = await request(app).get('/');
    const detail = await request(app).get('/news/new-paper');

    assert.equal(home.status, 200);
    assert.match(home.text, /\/assets\/_pages_\/home\/cover\.webp/);
    assert.match(home.text, /\/assets\/news\/new-paper\/cover\.webp/);
    assert.equal(detail.status, 200);
    assert.match(detail.text, /\/assets\/news\/new-paper\/cover\.webp/);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('detail frontmatter coverImage overrides the managed detail cover image', async () => {
  const { createApp } = require('../../src/index.js');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-detail-cover-override-'));

  try {
    fs.mkdirSync(path.join(tempRoot, 'content/news'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'assets/news/new-paper'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/blocks'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/details'), { recursive: true });

    fs.writeFileSync(
      path.join(tempRoot, 'lidex.config.js'),
      `module.exports = {
  pages: {
    home: { route: '/', source: 'content/home.md' },
  },
  blocks: {
    news: {
      template: 'newsCard',
      fields: {
        title: { type: 'string', required: true },
      },
      hasDetailPage: true,
      contentDir: 'content/news',
      slugField: 'slug',
      slugSourceField: 'title',
      route: '/news/:slug',
      detailTemplate: 'newsDetail',
    },
  },
  templates: {
    pageShell: 'templates/page-shell.html',
    newsCard: 'templates/blocks/news-card.html',
    newsDetail: 'templates/details/news-detail.html',
  },
};
`,
      'utf8',
    );
    fs.writeFileSync(path.join(tempRoot, 'templates/page-shell.html'), '<main>{{{pageHeaderHtml}}}{{{contentHtml}}}</main>', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/blocks/news-card.html'), '<article>{{title}}</article>', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/details/news-detail.html'), '<article><img src="{{coverImage}}" alt=""><img src="{{heroImage}}" alt=""></article>', 'utf8');
    fs.writeFileSync(
      path.join(tempRoot, 'content/home.md'),
      `---
title: Home
---

:::news
_id_: news-entry-1
title: New Paper
:::
`,
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'content/news/new-paper.md'),
      `---
_id_: news-entry-1
coverImage: /assets/custom/manual-cover.webp
---

Body.
`,
      'utf8',
    );
    fs.writeFileSync(path.join(tempRoot, 'assets/news/new-paper/cover.webp'), 'managed-cover', 'utf8');

    const app = createApp({ rootDir: tempRoot });
    const detail = await request(app).get('/news/new-paper');

    assert.equal(detail.status, 200);
    assert.match(detail.text, /\/assets\/custom\/manual-cover\.webp/);
    assert.doesNotMatch(detail.text, /\/assets\/news\/new-paper\/cover\.webp/);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('createApp serves seo metadata plus sitemap and robots routes', async () => {
  const { createApp } = require('../../src/index.js');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-preview-seo-'));

  try {
    fs.mkdirSync(path.join(tempRoot, 'content/news'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/blocks'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/details'), { recursive: true });

    fs.writeFileSync(
      path.join(tempRoot, 'lidex.config.js'),
      `module.exports = {
  site: {
    siteName: 'SEO Site',
    siteUrl: 'https://example.com',
  },
  pages: {
    home: { route: '/', source: 'content/home.md' },
  },
  blocks: {
    news: {
      template: 'newsCard',
      fields: {
        title: { type: 'string', required: true },
      },
      hasDetailPage: true,
      contentDir: 'content/news',
      slugField: '_slug_',
      slugSourceField: 'title',
      route: '/news/:slug',
      detailTemplate: 'newsDetail',
    },
  },
  templates: {
    pageShell: 'templates/page-shell.html',
    newsCard: 'templates/blocks/news-card.html',
    newsDetail: 'templates/details/news-detail.html',
  },
};
`,
      'utf8',
    );
    fs.writeFileSync(path.join(tempRoot, 'templates/page-shell.html'), '<!doctype html><html><head><title>{{title}}</title><meta name="description" content="{{description}}"></head><body>{{{contentHtml}}}</body></html>', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/blocks/news-card.html'), '<article><a href="{{detailRoute}}">{{title}}</a></article>', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/details/news-detail.html'), '<article><h1>{{title}}</h1>{{{bodyHtml}}}</article>', 'utf8');
    fs.writeFileSync(
      path.join(tempRoot, 'content/home.md'),
      `---
title: Preview Home
lead: Preview lead
seo.description: Preview SEO description
---

:::news
title: Preview Item
:::
`,
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'content/news/preview-item.md'),
      `---
title: Preview Item Detail
seo.title: Preview Detail SEO
---

Preview body.
`,
      'utf8',
    );

    const app = createApp({
      rootDir: tempRoot,
      adminPath: '/manage',
    });

    const home = await request(app).get('/');
    const detail = await request(app).get('/news/preview-item');
    const sitemap = await request(app).get('/sitemap.xml');
    const robots = await request(app).get('/robots.txt');

    assert.equal(home.status, 200);
    assert.match(home.text, /<meta name="description" content="Preview SEO description">/);
    assert.match(home.text, /<link rel="canonical" href="https:\/\/example\.com\/">/);
    assert.match(home.text, /<meta property="og:title" content="Preview Home">/);

    assert.equal(detail.status, 200);
    assert.match(detail.text, /<title>Preview Detail SEO<\/title>/);
    assert.match(detail.text, /<link rel="canonical" href="https:\/\/example\.com\/news\/preview-item">/);

    assert.equal(sitemap.status, 200);
    assert.match(sitemap.text, /https:\/\/example\.com\/news\/preview-item/);
    assert.equal(robots.status, 200);
    assert.match(robots.text, /Disallow: \/manage/);
    assert.match(robots.text, /Sitemap: https:\/\/example\.com\/sitemap\.xml/);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});


