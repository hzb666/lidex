const { renderMarkdownBody } = require('../content/render-markdown-body.js');
const { executeQuery } = require('../query/execute-query.js');
const { renderBlock } = require('../render/render-block.js');
const { loadTemplate } = require('../render/load-template.js');
const { renderPage } = require('../render/render-page.js');
const { renderQuery } = require('../render/render-query.js');
const { escapeHtml } = require('../render/render-template.js');
const { resolvePageSeo } = require('../seo/resolve-seo.js');
const { buildThemeContext } = require('../theme/build-theme-context.js');

function stripBlockSections(markdown = '', nodes = []) {
  const lines = String(markdown).replace(/\r/g, '').split('\n');
  const hiddenLineNumbers = new Set();

  for (const node of nodes) {
    for (let lineNumber = node.source.startLine; lineNumber <= node.source.endLine; lineNumber += 1) {
      hiddenLineNumbers.add(lineNumber);
    }
  }

  return lines
    .filter((line, index) => !hiddenLineNumbers.has(index + 1))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseSort(value) {
  if (!value) {
    return undefined;
  }

  const [field, order = 'asc'] = String(value).split(':');
  return [{ field, order }];
}

function parseWhere(value) {
  if (!value) {
    return undefined;
  }

  return JSON.parse(value);
}

function buildQueryDatasets(index) {
  const datasets = {};

  for (const [blockName, items] of Object.entries(index.blocks)) {
    datasets[blockName] = items.map((item) => ({
      ...item.fields,
      coverImage: item.fields.coverImage || (item.detail ? item.detail.coverImage : ''),
      heroImage: item.fields.heroImage || (item.detail ? item.detail.coverImage : ''),
      assetDirectory: item.detail ? item.detail.assetDirectory : undefined,
      assetDirectoryUrl: item.detail ? item.detail.assetDirectoryUrl : undefined,
      ...(item.detail ? item.detail.meta : {}),
      slug: item.detail ? item.detail.slug : undefined,
      detailRoute: item.detail ? item.detailRouteTemplate.replace(':slug', item.detail.slug) : undefined,
      bodyHtml: item.detail ? item.detail.bodyHtml : undefined,
    }));
  }

  return datasets;
}

function buildBlockContext(node, blockConfig) {
  const context = {
    ...node.fields,
    sourceLine: node.source.startLine,
    slug: node.detailSlug || node.fields[blockConfig.slugField],
    coverImage: node.fields.coverImage || node.coverImage || '',
    heroImage: node.fields.heroImage || node.heroImage || '',
    assetDirectory: node.assetDirectory,
    assetDirectoryUrl: node.assetDirectoryUrl,
  };

  if (blockConfig.hasDetailPage) {
    const slug = node.detailSlug || node.fields[blockConfig.slugField];
    context.detailRoute = blockConfig.route.replace(':slug', slug);
  }

  return context;
}

function buildPageHeaderHtml({ pageKey, pageRoute, title, eyebrow, lead, heroImage, heroAlt, showHero, eyebrowActionsHtml }) {
  const eyebrowContent = [
    eyebrow ? `<span class="eyebrow">${escapeHtml(eyebrow || '')}</span>` : '',
    eyebrowActionsHtml || '',
  ].filter(Boolean).join('');
  const eyebrowRowHtml = eyebrowContent
    ? `<div class="hero-eyebrow-row">${eyebrowContent}</div>`
    : '';

  if (pageRoute === '/') {
    return `<section class="hero hero--home">
  <div class="hero-copy">
    ${eyebrowRowHtml}
    <h1 class="hero-title">${escapeHtml(title || '')}</h1>
    <p class="hero-lead">${escapeHtml(lead || '')}</p>
    <div class="hero-meta"></div>
  </div>
</section>
<div class="hero-image-full">
  <img src="${escapeHtml(heroImage || '')}" alt="${escapeHtml(heroAlt || '')}">
</div>`;
  }

  const renderVisualHero = Boolean(heroImage) && String(showHero || '').toLowerCase() !== 'false';
  if (!renderVisualHero) {
    if (!title && !eyebrow && !lead) {
      return '';
    }

    return `<section class="page-intro page-intro--${escapeHtml(pageKey || '')}">
  <div class="hero-copy">
    ${eyebrowRowHtml}
    <h1 class="hero-title">${escapeHtml(title || '')}</h1>
    <p class="hero-lead">${escapeHtml(lead || '')}</p>
  </div>
</section>`;
  }

  return `<section class="hero hero--${escapeHtml(pageKey || '')}">
  <div class="hero-copy">
    ${eyebrowRowHtml}
    <h1 class="hero-title">${escapeHtml(title || '')}</h1>
    <p class="hero-lead">${escapeHtml(lead || '')}</p>
  </div>
  <div class="hero-visual">
    <img src="${escapeHtml(heroImage || '')}" alt="${escapeHtml(heroAlt || '')}">
  </div>
</section>`;
}

const BLOCK_WRAPPERS = {
  accordionItem: 'accordion-list',
  feature: 'member-grid',
  photo: 'photo-grid',
};

function renderPageNodes(page, runtime) {
  const fragments = [];
  let openWrapperClass = null;

  function flushWrapper() {
    if (!openWrapperClass) {
      return;
    }

    fragments.push('</div>');
    openWrapperClass = null;
  }

  for (const node of page.nodes) {
    if (node.type === 'block') {
      const blockConfig = runtime.config.blocks[node.name];
      const template = loadTemplate(runtime.config.templates[blockConfig.template]);
      const wrapperClass = BLOCK_WRAPPERS[node.name] || null;

      if (wrapperClass !== openWrapperClass) {
        flushWrapper();
        if (wrapperClass) {
          fragments.push(`<div class="${wrapperClass}">`);
          openWrapperClass = wrapperClass;
        }
      }

      fragments.push(renderBlock({
        template,
        context: buildBlockContext(node, blockConfig),
      }));
      continue;
    }

    flushWrapper();

    const queryConfig = {
      from: node.params.from,
      where: parseWhere(node.params.where),
      limit: node.params.limit,
      offset: node.params.offset,
      sort: parseSort(node.params.sort),
    };
    const items = executeQuery(queryConfig, buildQueryDatasets(runtime.index));
    const template = loadTemplate(runtime.config.queryTemplates[node.params.template]);
    fragments.push(renderQuery({
      template,
      context: { items },
    }));
  }

  flushWrapper();
  return fragments.join('');
}

function registerPageRoutes(app, runtime) {
  const shellTemplate = loadTemplate(runtime.config.templates.pageShell);

  for (const page of Object.values(runtime.index.pages)) {
    app.get(page.route, (req, res) => {
      const bodyHtml = renderMarkdownBody(stripBlockSections(page.body, page.nodes));
      const nodesHtml = renderPageNodes(page, runtime);
      const baseUrl = runtime.config.site && runtime.config.site.siteUrl
        ? runtime.config.site.siteUrl
        : `${req.protocol}://${req.get('host')}`;
      const seo = resolvePageSeo(page, runtime.config, { baseUrl });
      const html = renderPage({
        shellTemplate,
        context: {
          ...(runtime.config.site || {}),
          ...page.meta,
          description: page.meta.description || page.meta.lead || page.meta.title || page.key,
          title: page.meta.title || page.key,
          pageKey: page.key,
          pageRoute: page.route,
          __seo: seo,
          ...buildThemeContext(runtime.config.theme),
          pageHeaderHtml: buildPageHeaderHtml({
            pageKey: page.key,
            pageRoute: page.route,
            title: page.meta.title || page.key,
            eyebrow: page.meta.eyebrow,
            lead: page.meta.lead,
            heroImage: page.meta.heroImage,
            heroAlt: page.meta.heroAlt,
            showHero: page.meta.showHero,
          }),
          contentHtml: `${bodyHtml}${nodesHtml}`,
        },
      });

      res.type('html').send(html);
    });
  }
}

module.exports = {
  buildBlockContext,
  buildPageHeaderHtml,
  buildQueryDatasets,
  registerPageRoutes,
  renderPageNodes,
  stripBlockSections,
};
