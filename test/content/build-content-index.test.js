const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('buildContentIndex attaches detail docs to blocks with hasDetailPage', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const { buildContentIndex } = require('../../src/content/build-content-index.js');

  const rootDir = path.join(__dirname, '../fixtures/basic-site');
  const config = loadConfig({ rootDir });
  const index = buildContentIndex(config);
  const item = index.blocks.card[0];

  assert.equal(item.fields.slug, 'example-item');
  assert.equal(item.detail.slug, 'example-item');
  assert.equal(item.detail.meta.title, 'Example Item');
  assert.equal(item.detail.bodyHtml.includes('<p>Example detail body.</p>'), true);
});

test('buildContentIndex throws when a detail document is missing', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const { buildContentIndex } = require('../../src/content/build-content-index.js');

  const rootDir = path.join(__dirname, '../fixtures/basic-site');
  const config = loadConfig({ rootDir });
  config.blocks.card.contentDir = 'content/missing';

  assert.throws(
    () => buildContentIndex(config),
    (error) => {
      assert.match(error.message, /detail document not found/i);
      assert.match(error.message, /content[\\/]listing\.md:6/);
      return true;
    },
  );
});

test('buildContentIndex throws when a detail-enabled block is missing its slug field', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const { buildContentIndex } = require('../../src/content/build-content-index.js');

  const rootDir = path.join(__dirname, '../fixtures/basic-site');
  const config = loadConfig({ rootDir });
  config.blocks.card.slugField = 'missingSlug';

  assert.throws(
    () => buildContentIndex(config),
    (error) => {
      assert.match(error.message, /missing slug field "missingSlug"/i);
      assert.match(error.message, /content[\\/]listing\.md:5/);
      return true;
    },
  );
});

test('buildContentIndex throws when markdown contains an undeclared block type', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const { buildContentIndex } = require('../../src/content/build-content-index.js');

  const rootDir = path.join(__dirname, '../fixtures/basic-site');
  const config = loadConfig({ rootDir });
  delete config.blocks.card;

  assert.throws(
    () => buildContentIndex(config),
    (error) => {
      assert.match(error.message, /undeclared block "card" found/i);
      assert.match(error.message, /content[\\/]listing\.md:5/);
      return true;
    },
  );
});

test('buildContentIndex throws when a block is missing a required field', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const { buildContentIndex } = require('../../src/content/build-content-index.js');

  const rootDir = path.join(__dirname, '../fixtures/basic-site');
  const config = loadConfig({ rootDir });
  config.pages.listing.source = 'content/listing-missing-title.md';

  assert.throws(
    () => buildContentIndex(config),
    (error) => {
      assert.match(error.message, /missing required field "title"/i);
      assert.match(error.message, /content[\\/]listing-missing-title\.md:5/);
      return true;
    },
  );
});

test('buildContentIndex throws when a block contains an undeclared field', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const { buildContentIndex } = require('../../src/content/build-content-index.js');

  const rootDir = path.join(__dirname, '../fixtures/basic-site');
  const config = loadConfig({ rootDir });
  config.pages.listing.source = 'content/listing-unknown-field.md';

  assert.throws(
    () => buildContentIndex(config),
    (error) => {
      assert.match(error.message, /undeclared field "unknownField"/i);
      assert.match(error.message, /content[\\/]listing-unknown-field\.md:8/);
      return true;
    },
  );
});

test('buildContentIndex throws when a query block contains invalid where JSON', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const { buildContentIndex } = require('../../src/content/build-content-index.js');

  const rootDir = path.join(__dirname, '../fixtures/basic-site');
  const config = loadConfig({ rootDir });
  config.pages.home.source = 'content/home-invalid-query.md';

  assert.throws(
    () => buildContentIndex(config),
    (error) => {
      assert.match(error.message, /invalid query where json/i);
      assert.match(error.message, /content[\\/]home-invalid-query\.md:7/);
      return true;
    },
  );
});

test('buildContentIndex escapes raw html in detail bodyHtml', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const { buildContentIndex } = require('../../src/content/build-content-index.js');

  const rootDir = path.join(__dirname, '../fixtures/basic-site');
  const config = loadConfig({ rootDir });
  config.pages.listing.source = 'content/listing-unsafe-detail.md';
  config.blocks.card.contentDir = 'content/listing-unsafe';

  const index = buildContentIndex(config);
  const item = index.blocks.card[0];

  assert.match(item.detail.bodyHtml, /&lt;script&gt;alert/);
  assert.doesNotMatch(item.detail.bodyHtml, /<script>/);
});

test('buildContentIndex keeps markdown callout directives out of the block index', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const { buildContentIndex } = require('../../src/content/build-content-index.js');

  const rootDir = path.join(__dirname, '../fixtures/basic-site');
  const config = loadConfig({ rootDir });
  config.pages.home.source = 'content/home-callout.md';

  const index = buildContentIndex(config);

  assert.equal(index.pages.home.nodes.length, 0);
  assert.match(index.pages.home.body, /:::callout/);
});

test('buildContentIndex rejects detail slug path escape attempts', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const { buildContentIndex } = require('../../src/content/build-content-index.js');

  const rootDir = path.join(__dirname, '../fixtures/basic-site');
  const config = loadConfig({ rootDir });
  config.pages.listing.source = 'content/listing-escape-slug.md';

  assert.throws(
    () => buildContentIndex(config),
    (error) => {
      assert.match(error.message, /must not contain path separators|outside contentdir/i);
      assert.match(error.message, /content[\\/]listing-escape-slug\.md:6/);
      return true;
    },
  );
});

test('buildContentIndex throws when a query block references an unknown query template key', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const { buildContentIndex } = require('../../src/content/build-content-index.js');

  const rootDir = path.join(__dirname, '../fixtures/basic-site');
  const config = loadConfig({ rootDir });
  config.pages.home.source = 'content/home-missing-query-template.md';

  assert.throws(
    () => buildContentIndex(config),
    (error) => {
      assert.match(error.message, /unknown query template key "missingQueryTemplate"/i);
      assert.match(error.message, /content[\\/]home-missing-query-template\.md:7/);
      return true;
    },
  );
});

test('buildContentIndex reports reserved system field errors with field line numbers', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const { buildContentIndex } = require('../../src/content/build-content-index.js');

  const fixtureRoot = path.join(__dirname, '../fixtures/basic-site');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-reserved-field-'));
  fs.cpSync(fixtureRoot, tempRoot, { recursive: true });

  try {
    fs.writeFileSync(
      path.join(tempRoot, 'content/listing.md'),
      `---
title: Listing
---

:::card
slug: example-item
title: Example
category: featured
publishedAt: 2025-03-01
_bad_: value
:::
`,
      'utf8',
    );

    const config = loadConfig({ rootDir: tempRoot });

    assert.throws(
      () => buildContentIndex(config),
      (error) => {
        assert.match(error.message, /unknown reserved system field "_bad_"/i);
        assert.match(error.message, /content[\\/]listing\.md:10/);
        return true;
      },
    );
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('buildContentIndex allows reserved _page_ field when block pagination is enabled', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const { buildContentIndex } = require('../../src/content/build-content-index.js');

  const fixtureRoot = path.join(__dirname, '../fixtures/basic-site');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-pagination-field-'));
  fs.cpSync(fixtureRoot, tempRoot, { recursive: true });

  try {
    fs.writeFileSync(
      path.join(tempRoot, 'content/listing.md'),
      `---
title: Listing
---

:::card
slug: example-item
title: Example
category: featured
publishedAt: 2025-03-01
_page_: 2
:::
`,
      'utf8',
    );

    const config = loadConfig({ rootDir: tempRoot });
    config.blocks.card.enablePagination = true;

    const index = buildContentIndex(config);
    assert.equal(index.blocks.card[0].fields._page_, '2');
    assert.equal(index.blocks.card[0].paginationPage, 2);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('buildContentIndex treats plain page as a normal undeclared field', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const { buildContentIndex } = require('../../src/content/build-content-index.js');

  const fixtureRoot = path.join(__dirname, '../fixtures/basic-site');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-plain-page-field-'));
  fs.cpSync(fixtureRoot, tempRoot, { recursive: true });

  try {
    fs.writeFileSync(
      path.join(tempRoot, 'content/listing.md'),
      `---
title: Listing
---

:::card
slug: example-item
title: Example
category: featured
publishedAt: 2025-03-01
page: 2
:::
`,
      'utf8',
    );

    const config = loadConfig({ rootDir: tempRoot });
    config.blocks.card.enablePagination = true;

    assert.throws(
      () => buildContentIndex(config),
      /undeclared field "page"|contains undeclared field "page"|undeclared field/i,
    );
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('buildContentIndex derives detail slugs from the configured source field', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const { buildContentIndex } = require('../../src/content/build-content-index.js');

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-title-slug-'));

  try {
    fs.mkdirSync(path.join(tempRoot, 'content/news'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'assets/news/lidex-site-launched'), { recursive: true });
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
        publishedAt: { type: 'string', required: true },
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
    fs.writeFileSync(path.join(tempRoot, 'templates/page-shell.html'), '{{{contentHtml}}}', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/blocks/news-card.html'), '{{title}}', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/details/news-detail.html'), '{{title}} {{{bodyHtml}}}', 'utf8');
    fs.writeFileSync(
      path.join(tempRoot, 'content/news.md'),
      `---
title: News
---

:::news
title: Lidex Site Launched
publishedAt: 2026-04-04
:::
`,
      'utf8',
    );
    fs.writeFileSync(path.join(tempRoot, 'content/news/lidex-site-launched.md'), 'Detail body.', 'utf8');

    const config = loadConfig({ rootDir: tempRoot });
    const index = buildContentIndex(config);
    const item = index.blocks.news[0];

    assert.equal(item.detail.slug, 'lidex-site-launched');
    assert.equal(item.detail.path.endsWith(path.join('content', 'news', 'lidex-site-launched.md')), true);
    assert.equal(index.pages.news.nodes[0].detailSlug, 'lidex-site-launched');
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('buildContentIndex rejects duplicate normalized detail slugs within a block type', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const { buildContentIndex } = require('../../src/content/build-content-index.js');

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-duplicate-title-slug-'));

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
    fs.writeFileSync(path.join(tempRoot, 'templates/page-shell.html'), '{{{contentHtml}}}', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/blocks/news-card.html'), '{{title}}', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/details/news-detail.html'), '{{title}} {{{bodyHtml}}}', 'utf8');
    fs.writeFileSync(
      path.join(tempRoot, 'content/news.md'),
      `---
title: News
---

:::news
title: Lab Update
:::

:::news
title: lab update
:::
`,
      'utf8',
    );
    fs.writeFileSync(path.join(tempRoot, 'content/news/lab-update.md'), 'Detail body.', 'utf8');

    const config = loadConfig({ rootDir: tempRoot });

    assert.throws(
      () => buildContentIndex(config),
      (error) => {
        assert.match(error.message, /duplicate detail slug "lab-update" found in block type "news"/i);
        assert.match(error.message, /content[\\/]news\.md:6/);
        assert.match(error.message, /content[\\/]news\.md:10/);
        return true;
      },
    );
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('buildContentIndex prefers explicit _slug_ over generated slugs', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const { buildContentIndex } = require('../../src/content/build-content-index.js');

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-explicit-slug-'));

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
    fs.writeFileSync(path.join(tempRoot, 'templates/page-shell.html'), '{{{contentHtml}}}', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/blocks/news-card.html'), '{{title}}', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/details/news-detail.html'), '{{title}} {{{bodyHtml}}}', 'utf8');
    fs.writeFileSync(
      path.join(tempRoot, 'content/news.md'),
      `---
title: News
---

:::news
_id_: news-entry-1
_slug_: editorial-choice
title: Lidex Site Launched
:::
`,
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'content/news/editorial-choice.md'),
      '---\n_id_: news-entry-1\n---\n\nDetail body.',
      'utf8',
    );

    const config = loadConfig({ rootDir: tempRoot });
    const index = buildContentIndex(config);

    assert.equal(index.blocks.news[0].detail.slug, 'editorial-choice');
    assert.equal(index.blocks.news[0].fields._id_, 'news-entry-1');
    assert.equal(index.blocks.news[0].fields._slug_, 'editorial-choice');
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('buildContentIndex transliterates Chinese source fields in-process', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const { buildContentIndex } = require('../../src/content/build-content-index.js');

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-chinese-slug-'));

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
    fs.writeFileSync(path.join(tempRoot, 'templates/page-shell.html'), '{{{contentHtml}}}', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/blocks/news-card.html'), '{{title}}', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/details/news-detail.html'), '{{title}} {{{bodyHtml}}}', 'utf8');
    fs.writeFileSync(
      path.join(tempRoot, 'content/news.md'),
      `---
title: News
---

:::news
title: 新闻更新
:::
`,
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'content/news/xin-wen-geng-xin.md'),
      'Detail body.',
      'utf8',
    );

    const config = loadConfig({ rootDir: tempRoot });
    const index = buildContentIndex(config);

    assert.equal(index.blocks.news[0].detail.slug, 'xin-wen-geng-xin');
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('buildContentIndex reports detail markdown directive errors with detail file line numbers', () => {
  const { loadConfig } = require('../../src/config/load-config.js');
  const { buildContentIndex } = require('../../src/content/build-content-index.js');

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-detail-callout-error-'));

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
    fs.writeFileSync(path.join(tempRoot, 'templates/page-shell.html'), '{{{contentHtml}}}', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/blocks/news-card.html'), '{{title}}', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/details/news-detail.html'), '{{title}} {{{bodyHtml}}}', 'utf8');
    fs.writeFileSync(
      path.join(tempRoot, 'content/news.md'),
      `---
title: News
---

:::news
title: Broken Detail
:::
`,
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'content/news/broken-detail.md'),
      `---
title: Broken Detail
---
:::callout
type: note
title: Missing body
:::
`,
      'utf8',
    );

    const config = loadConfig({ rootDir: tempRoot });

    assert.throws(
      () => buildContentIndex(config),
      (error) => {
        assert.match(error.message, /missing required field "body"/i);
        assert.match(error.message, /content[\\/]news[\\/]broken-detail\.md:4/);
        return true;
      },
    );
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

