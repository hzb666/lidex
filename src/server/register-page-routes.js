const { renderMarkdownBody } = require('../content/render-markdown-body.js');
const { executeQuery } = require('../query/execute-query.js');
const { renderBlock } = require('../render/render-block.js');
const { loadTemplate } = require('../render/load-template.js');
const { renderPage } = require('../render/render-page.js');
const { renderQuery } = require('../render/render-query.js');
const { escapeHtml, renderTemplate } = require('../render/render-template.js');
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
    .map((line, index) => (hiddenLineNumbers.has(index + 1) ? '' : line))
    .join('\n');
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
      detailLinks: item.detail ? [{ href: item.detailRouteTemplate.replace(':slug', item.detail.slug) }] : [],
      bodyHtml: item.detail ? item.detail.bodyHtml : undefined,
    }));
  }

  return datasets;
}

function resolveSiteName(site = {}) {
  return site.siteName || site.title || 'Lidex';
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
    detailLinks: [],
  };

  if (blockConfig.hasDetailPage) {
    const slug = node.detailSlug || node.fields[blockConfig.slugField];
    context.detailRoute = blockConfig.route.replace(':slug', slug);
    context.detailLinks = [{ href: context.detailRoute }];
  }

  return context;
}

function buildHeroActionsHtml({ heroPrimaryLabel, heroPrimaryHref, heroCommand, heroCommandCopyText, heroCommandPrefix }) {
  const fragments = [];

  if (heroPrimaryLabel && heroPrimaryHref) {
    fragments.push(`<a class="hero-action hero-action--primary" href="${escapeHtml(heroPrimaryHref)}">${escapeHtml(heroPrimaryLabel)}</a>`);
  }

  if (heroCommand) {
    const copyText = heroCommandCopyText || heroCommand;
    const prefix = heroCommandPrefix || '>';
    fragments.push(`<div class="hero-command" id="hero-install-command" data-copy-text="${escapeHtml(copyText)}">
      <span class="hero-command__label">${escapeHtml(prefix)}</span>
      <code class="hero-command__code">${escapeHtml(heroCommand)}</code>
      <button class="hero-command__copy" type="button" data-copy-command>Copy</button>
    </div>`);
  }

  return fragments.length ? `<div class="hero-meta">${fragments.join('')}</div>` : '';
}

function buildPageHeaderHtml({
  pageKey,
  pageRoute,
  title,
  eyebrow,
  lead,
  heroImage,
  heroAlt,
  showHero,
  eyebrowActionsHtml,
  heroPrimaryLabel,
  heroPrimaryHref,
  heroCommand,
  heroCommandCopyText,
  heroCommandPrefix,
}) {
  const eyebrowContent = [
    eyebrow ? `<span class="eyebrow">${escapeHtml(eyebrow || '')}</span>` : '',
    eyebrowActionsHtml || '',
  ].filter(Boolean).join('');
  const eyebrowRowHtml = eyebrowContent
    ? `<div class="hero-eyebrow-row">${eyebrowContent}</div>`
    : '';
  const heroActionsHtml = buildHeroActionsHtml({
    heroPrimaryLabel,
    heroPrimaryHref,
    heroCommand,
    heroCommandCopyText,
    heroCommandPrefix,
  });
  const renderVisualHero = Boolean(heroImage) && String(showHero || '').toLowerCase() !== 'false';

  if (!title && !eyebrow && !lead && !heroActionsHtml && !renderVisualHero) {
    return '';
  }

  const heroClasses = [
    'hero',
    `hero--${escapeHtml(pageKey || '')}`,
    renderVisualHero ? 'hero--has-visual' : 'hero--text-only',
  ].join(' ');
  const visualClasses = [
    'hero-visual',
    pageRoute === '/' ? 'hero-visual--home' : '',
  ].filter(Boolean).join(' ');

  const heroHtml = `<section class="${heroClasses}">
  <div class="hero-copy">
    ${eyebrowRowHtml}
    <h1 class="hero-title">${escapeHtml(title || '')}</h1>
    ${lead ? `<p class="hero-lead">${escapeHtml(lead || '')}</p>` : ''}
    ${heroActionsHtml}
  </div>
  ${renderVisualHero ? `<div class="${visualClasses}">
    <img src="${escapeHtml(heroImage || '')}" alt="${escapeHtml(heroAlt || '')}">
  </div>` : ''}
</section>`;

  return heroHtml;
}

const BLOCK_WRAPPERS = {
  accordionItem: 'accordion-list',
  photo: 'photo-grid',
};

function resolveBlockWrapper(nodeName, blockConfig, runtime) {
  if (blockConfig.wrapperTemplate) {
    return {
      key: `template:${blockConfig.wrapperTemplate}`,
      type: 'template',
      template: loadTemplate(runtime.config.templates[blockConfig.wrapperTemplate]),
    };
  }

  const wrapperClass = BLOCK_WRAPPERS[nodeName] || null;
  if (!wrapperClass) {
    return null;
  }

  return {
    key: `class:${wrapperClass}`,
    type: 'class',
    className: wrapperClass,
  };
}

function renderWrappedGroup(wrapper, itemsHtml) {
  if (!wrapper) {
    return itemsHtml;
  }

  if (wrapper.type === 'template') {
    return renderTemplate(wrapper.template, { itemsHtml });
  }

  return `<div class="${wrapper.className}">${itemsHtml}</div>`;
}

function renderPageNodes(page, runtime, options = {}) {
  const fragments = [];
  let openWrapper = null;
  let wrapperFragments = [];
  const includeBlockNames = Array.isArray(options.includeBlockNames) ? new Set(options.includeBlockNames) : null;
  const excludeBlockNames = Array.isArray(options.excludeBlockNames) ? new Set(options.excludeBlockNames) : null;
  const includeQueries = options.includeQueries !== false;

  function flushWrapper() {
    if (!openWrapper) {
      return;
    }

    fragments.push(renderWrappedGroup(openWrapper, wrapperFragments.join('')));
    openWrapper = null;
    wrapperFragments = [];
  }

  for (const node of page.nodes) {
    if (node.type === 'block') {
      if (includeBlockNames && !includeBlockNames.has(node.name)) {
        continue;
      }

      if (excludeBlockNames && excludeBlockNames.has(node.name)) {
        continue;
      }

      const blockConfig = runtime.config.blocks[node.name];
      const template = loadTemplate(runtime.config.templates[blockConfig.template]);
      const wrapper = resolveBlockWrapper(node.name, blockConfig, runtime);
      const wrapperKey = wrapper ? wrapper.key : null;
      const openWrapperKey = openWrapper ? openWrapper.key : null;
      const blockHtml = renderBlock({
        template,
        context: buildBlockContext(node, blockConfig),
      });

      if (wrapperKey !== openWrapperKey) {
        flushWrapper();
        if (wrapper) {
          openWrapper = wrapper;
        }
      }

      if (wrapper) {
        wrapperFragments.push(blockHtml);
      } else {
        fragments.push(blockHtml);
      }
      continue;
    }

    if (!includeQueries) {
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
    fragments.push(`<div class="query-block" data-query-template="${escapeHtml(node.params.template || '')}">${renderQuery({
      template,
      context: { items },
    })}</div>`);
  }

  flushWrapper();
  return fragments.join('');
}

function registerPageRoutes(app, runtime) {
  const shellTemplate = loadTemplate(runtime.config.templates.pageShell);

  for (const page of Object.values(runtime.index.pages)) {
    app.get(page.route, (req, res) => {
      const bodyHtml = renderMarkdownBody(stripBlockSections(page.body, page.nodes), {
        rootDir: runtime.config.rootDir,
        filePath: page.sourcePath,
        lineOffset: Math.max(0, (page.bodyStartLine || 1) - 1),
      });
      const nodesHtml = renderPageNodes(page, runtime);
      const baseUrl = runtime.config.site && runtime.config.site.siteUrl
        ? runtime.config.site.siteUrl
        : `${req.protocol}://${req.get('host')}`;
      const seo = resolvePageSeo(page, runtime.config, { baseUrl });
      const html = renderPage({
        shellTemplate,
        context: {
          ...(runtime.config.site || {}),
          siteName: resolveSiteName(runtime.config.site || {}),
          ...page.meta,
          description: page.meta.description || page.meta.lead || page.meta.title || page.key,
          title: page.meta.title || page.key,
          pageKey: page.key,
          pageRoute: page.route,
          __head: runtime.config.head,
          __seo: seo,
          __reload: Boolean(runtime.locals && runtime.locals.reloadState),
          __reloadVersion: runtime.locals && runtime.locals.reloadState
            ? runtime.locals.reloadState.version
            : undefined,
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
            heroPrimaryLabel: page.meta.heroPrimaryLabel,
            heroPrimaryHref: page.meta.heroPrimaryHref,
            heroCommand: page.meta.heroCommand,
            heroCommandCopyText: page.meta.heroCommandCopyText,
            heroCommandPrefix: page.meta.heroCommandPrefix,
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
  renderWrappedGroup,
  resolveBlockWrapper,
  resolveSiteName,
  stripBlockSections,
};
