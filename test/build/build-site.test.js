const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('buildSite renders static pages, detail pages, assets, and theme files', async () => {
  const { buildSite } = require('../../src/index.js');
  const fixtureRoot = path.join(__dirname, '../fixtures/basic-site');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lydex-build-'));
  fs.cpSync(fixtureRoot, tempRoot, { recursive: true });

  try {
    const result = await buildSite({
      rootDir: tempRoot,
      config: 'lydex-defaults.config.js',
      outDir: 'dist',
    });

    const outDir = path.join(tempRoot, 'dist');
    const homeHtml = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
    const listingHtml = fs.readFileSync(path.join(outDir, 'listing', 'index.html'), 'utf8');
    const detailHtml = fs.readFileSync(path.join(outDir, 'listing', 'example-item', 'index.html'), 'utf8');
    const assetText = fs.readFileSync(path.join(outDir, 'assets', 'example.txt'), 'utf8');
    const themeBaseCss = fs.readFileSync(path.join(outDir, '__lydex', 'theme', 'base.css'), 'utf8');
    const themeComponentsCss = fs.readFileSync(path.join(outDir, '__lydex', 'theme', 'components.css'), 'utf8');

    assert.equal(result.outDir, outDir);
    assert.deepEqual(result.routes.sort(), ['/', '/listing', '/listing/example-item']);
    assert.match(homeHtml, /Welcome/);
    assert.match(listingHtml, /Example/);
    assert.match(detailHtml, /Example Item/);
    assert.match(detailHtml, /Example detail body/);
    assert.match(assetText, /fixture asset/);
    assert.match(themeBaseCss, /line-height/);
    assert.match(themeComponentsCss, /card-grid-item/);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('buildSite creates missing detail markdown files and asset directories from title-derived slugs', async () => {
  const { buildSite } = require('../../src/index.js');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lydex-build-managed-detail-'));

  try {
    fs.mkdirSync(path.join(tempRoot, 'content/news'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/blocks'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/details'), { recursive: true });

    fs.writeFileSync(
      path.join(tempRoot, 'lydex.config.js'),
      `module.exports = {
  pages: {
    news: { route: '/news', source: 'content/news.md' },
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
    fs.writeFileSync(path.join(tempRoot, 'templates/page-shell.html'), '<main>{{{pageHeaderHtml}}}{{{contentHtml}}}</main>', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/blocks/news-card.html'), '<article>{{title}} {{coverImage}}</article>', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/details/news-detail.html'), '<article>{{title}} {{heroImage}} {{{bodyHtml}}}</article>', 'utf8');
    fs.writeFileSync(
      path.join(tempRoot, 'content/news.md'),
      `---
title: News
---

:::news
title: New Paper
summary: Fresh summary
:::
`,
      'utf8',
    );

    const result = await buildSite({
      rootDir: tempRoot,
      outDir: 'dist',
    });

    assert.equal(fs.existsSync(path.join(tempRoot, 'content/news/new-paper.md')), true);
    assert.equal(fs.existsSync(path.join(tempRoot, 'assets/news/new-paper')), true);
    assert.deepEqual(result.routes.sort(), ['/news', '/news/new-paper']);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('buildSite confirms and deletes orphaned detail files and asset directories before rendering', async () => {
  const { buildSite } = require('../../src/index.js');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lydex-build-managed-cleanup-'));
  let cleanupReport = null;

  try {
    fs.mkdirSync(path.join(tempRoot, 'content/news'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'assets/news/old-news'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/blocks'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/details'), { recursive: true });

    fs.writeFileSync(
      path.join(tempRoot, 'lydex.config.js'),
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
title: Current News
:::
`,
      'utf8',
    );
    fs.writeFileSync(path.join(tempRoot, 'content/news/current-news.md'), 'Current body.', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'content/news/old-news.md'), 'Old body.', 'utf8');

    await buildSite({
      rootDir: tempRoot,
      outDir: 'dist',
      confirmCleanup(report) {
        cleanupReport = report;
        return true;
      },
    });

    assert.equal(cleanupReport.orphanedFiles.some((entry) => entry.endsWith(path.join('content', 'news', 'old-news.md'))), true);
    assert.equal(cleanupReport.orphanedDirectories.some((entry) => entry.endsWith(path.join('assets', 'news', 'old-news'))), true);
    assert.equal(fs.existsSync(path.join(tempRoot, 'content/news/old-news.md')), false);
    assert.equal(fs.existsSync(path.join(tempRoot, 'assets/news/old-news')), false);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('buildSite writes generated _id_ fields back to source blocks and detail files', async () => {
  const { buildSite } = require('../../src/index.js');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lydex-build-managed-id-'));

  try {
    fs.mkdirSync(path.join(tempRoot, 'content/news'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/blocks'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/details'), { recursive: true });

    fs.writeFileSync(
      path.join(tempRoot, 'lydex.config.js'),
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
title: Managed News
:::
`,
      'utf8',
    );

    await buildSite({
      rootDir: tempRoot,
      outDir: 'dist',
    });

    const sourcePage = fs.readFileSync(path.join(tempRoot, 'content/news.md'), 'utf8');
    const detailDoc = fs.readFileSync(path.join(tempRoot, 'content/news/managed-news.md'), 'utf8');

    assert.match(sourcePage, /_id_:/);
    assert.match(detailDoc, /_id_:/);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('buildSite renames detail markdown and asset directories when the same _id_ gets a new slug', async () => {
  const { buildSite } = require('../../src/index.js');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lydex-build-managed-rename-'));

  try {
    fs.mkdirSync(path.join(tempRoot, 'content/news'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'assets/news/old-paper'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/blocks'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/details'), { recursive: true });

    fs.writeFileSync(
      path.join(tempRoot, 'lydex.config.js'),
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
    fs.writeFileSync(path.join(tempRoot, 'templates/page-shell.html'), '<main>{{{contentHtml}}}</main>', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/blocks/news-card.html'), '<article>{{title}}</article>', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/details/news-detail.html'), '<article>{{title}} {{{bodyHtml}}}</article>', 'utf8');
    fs.writeFileSync(
      path.join(tempRoot, 'content/news.md'),
      `---
title: News
---

:::news
_id_: news-entry-1
title: New Paper
:::
`,
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'content/news/old-paper.md'),
      `---
_id_: news-entry-1
title: Old Paper
---

Preserved detail body.
`,
      'utf8',
    );
    fs.writeFileSync(path.join(tempRoot, 'assets/news/old-paper/cover.webp'), 'detail-cover', 'utf8');

    await buildSite({
      rootDir: tempRoot,
      outDir: 'dist',
    });

    assert.equal(fs.existsSync(path.join(tempRoot, 'content/news/new-paper.md')), true);
    assert.equal(fs.existsSync(path.join(tempRoot, 'content/news/old-paper.md')), false);
    assert.equal(fs.existsSync(path.join(tempRoot, 'assets/news/new-paper/cover.webp')), true);
    assert.equal(fs.existsSync(path.join(tempRoot, 'assets/news/old-paper')), false);
    assert.match(fs.readFileSync(path.join(tempRoot, 'content/news/new-paper.md'), 'utf8'), /Preserved detail body/);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

