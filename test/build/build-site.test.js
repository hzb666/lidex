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

test('buildSite writes managed metadata json with reserved fields and resolved slug details', async () => {
  const { buildSite } = require('../../src/index.js');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lydex-build-managed-metadata-'));

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
title: Managed News
_page_: 2
:::
`,
      'utf8',
    );

    await buildSite({
      rootDir: tempRoot,
      outDir: 'dist',
    });

    const metadata = JSON.parse(fs.readFileSync(path.join(tempRoot, '.lydex', 'managed-content.json'), 'utf8'));
    const entry = metadata.entries.find((item) => item.block === 'news');

    assert.equal(metadata.mode, 'build');
    assert.equal(Array.isArray(metadata.entries), true);
    assert.equal(entry.sourcePageKey, 'news');
    assert.equal(entry.sourcePath, 'content/news.md');
    assert.match(entry.reservedFields._id_, /^id-/);
    assert.equal(entry.reservedFields._slug_, 'managed-news');
    assert.equal(entry.reservedFields._page_, '2');
    assert.equal(entry.resolved.slug, 'managed-news');
    assert.equal(entry.resolved.slugField, '_slug_');
    assert.equal(entry.resolved.slugSourceField, 'title');
    assert.equal(entry.resolved.slugSourceValue, 'Managed News');
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

test('buildSite writes seo metadata plus sitemap and robots outputs', async () => {
  const { buildSite } = require('../../src/index.js');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lydex-build-seo-'));

  try {
    fs.mkdirSync(path.join(tempRoot, 'content/news'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/blocks'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/details'), { recursive: true });

    fs.writeFileSync(
      path.join(tempRoot, 'lydex.config.js'),
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
    fs.writeFileSync(path.join(tempRoot, 'templates/page-shell.html'), '<!doctype html><html><head><title>{{title}}</title><meta name="description" content="{{description}}"></head><body>{{{contentHtml}}}</body></html>', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/blocks/news-card.html'), '<article><a href="{{detailRoute}}">{{title}}</a></article>', 'utf8');
    fs.writeFileSync(path.join(tempRoot, 'templates/details/news-detail.html'), '<article><h1>{{title}}</h1>{{{bodyHtml}}}</article>', 'utf8');
    fs.writeFileSync(
      path.join(tempRoot, 'content/home.md'),
      `---
title: Home
description: Home description
heroImage: /assets/public/home.webp
heroAlt: Home hero alt
seo.title: Home SEO Title
seo.keywords: alpha, beta
---

:::news
title: New Paper
summary: Build summary
:::
`,
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'content/news/new-paper.md'),
      `---
title: New Paper Detail
description: Detail description
heroImage: /assets/news/new-paper/cover.webp
heroAlt: Detail hero alt
seo.title: Detail SEO Title
seo.noindex: true
---

Detail body.
`,
      'utf8',
    );

    await buildSite({
      rootDir: tempRoot,
      outDir: 'dist',
      adminPath: '/manage',
    });

    const homeHtml = fs.readFileSync(path.join(tempRoot, 'dist/index.html'), 'utf8');
    const detailHtml = fs.readFileSync(path.join(tempRoot, 'dist/news/new-paper/index.html'), 'utf8');
    const sitemapXml = fs.readFileSync(path.join(tempRoot, 'dist/sitemap.xml'), 'utf8');
    const robotsTxt = fs.readFileSync(path.join(tempRoot, 'dist/robots.txt'), 'utf8');

    assert.match(homeHtml, /<title>Home SEO Title<\/title>/);
    assert.match(homeHtml, /<link rel="canonical" href="https:\/\/example\.com\/">/);
    assert.match(homeHtml, /<meta property="og:title" content="Home SEO Title">/);
    assert.match(homeHtml, /<meta property="og:image" content="https:\/\/example\.com\/assets\/public\/home\.webp">/);
    assert.doesNotMatch(homeHtml, /<meta name="keywords"/);

    assert.match(detailHtml, /<title>Detail SEO Title<\/title>/);
    assert.match(detailHtml, /<meta name="robots" content="noindex">/);
    assert.match(detailHtml, /<link rel="canonical" href="https:\/\/example\.com\/news\/new-paper">/);

    assert.match(sitemapXml, /https:\/\/example\.com\//);
    assert.doesNotMatch(sitemapXml, /https:\/\/example\.com\/news\/new-paper/);
    assert.match(robotsTxt, /Disallow: \/manage/);
    assert.match(robotsTxt, /Sitemap: https:\/\/example\.com\/sitemap\.xml/);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('buildSite skips canonical sitemap and robots outputs when siteUrl is missing', async () => {
  const { buildSite } = require('../../src/index.js');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lydex-build-seo-no-site-url-'));

  try {
    fs.mkdirSync(path.join(tempRoot, 'content/news'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/blocks'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/details'), { recursive: true });

    fs.writeFileSync(
      path.join(tempRoot, 'lydex.config.js'),
      `module.exports = {
  site: {
    siteName: 'SEO Site',
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
title: Home
description: Home description
heroImage: /assets/public/home.webp
---

:::news
title: New Paper
:::
`,
      'utf8',
    );
    fs.writeFileSync(path.join(tempRoot, 'content/news/new-paper.md'), 'Detail body.', 'utf8');

    await buildSite({
      rootDir: tempRoot,
      outDir: 'dist',
      adminPath: '/manage',
    });

    const homeHtml = fs.readFileSync(path.join(tempRoot, 'dist/index.html'), 'utf8');

    assert.doesNotMatch(homeHtml, /<link rel="canonical"/);
    assert.doesNotMatch(homeHtml, /<meta property="og:url"/);
    assert.doesNotMatch(homeHtml, /<meta property="og:image"/);
    assert.equal(fs.existsSync(path.join(tempRoot, 'dist/sitemap.xml')), false);
    assert.equal(fs.existsSync(path.join(tempRoot, 'dist/robots.txt')), false);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

