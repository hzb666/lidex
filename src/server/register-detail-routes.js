const { loadTemplate } = require('../render/load-template.js');
const { renderDetailPage } = require('../render/render-detail-page.js');
const { escapeHtml } = require('../render/render-template.js');
const { resolveDetailSeo } = require('../seo/resolve-seo.js');
const { buildPageHeaderHtml } = require('./register-page-routes.js');
const { buildThemeContext } = require('../theme/build-theme-context.js');

function getItemTitle(item) {
  return item.detail.meta.title || item.fields.title || item.fields.name || item.detail.slug;
}

function buildPaginationLinkItem(item, label) {
  return {
    label,
    title: getItemTitle(item),
    route: item.detailRouteTemplate.replace(':slug', item.detail.slug),
  };
}

function buildEyebrowActionsHtml(previousItem, nextItem) {
  function renderControl(item, direction) {
    const arrow = direction === 'previous' ? '&larr;' : '&rarr;';
    const ariaLabel = direction === 'previous' ? 'Previous' : 'Next';
    if (!item) {
      return `<span class="detail-pagination-control is-disabled" aria-hidden="true">${arrow}</span>`;
    }

    return `<a class="detail-pagination-control" href="${escapeHtml(item.route)}" aria-label="${ariaLabel}: ${escapeHtml(item.title)}">${arrow}</a>`;
  }

  return `<div class="detail-pagination-controls">${renderControl(previousItem, 'previous')}${renderControl(nextItem, 'next')}</div>`;
}

function buildDetailContext(item, runtime) {
  const paginationEnabled = Boolean(runtime.config.blocks[item.name] && runtime.config.blocks[item.name].enablePagination);
  const orderedItems = paginationEnabled ? runtime.index.pagination[item.name] || [] : [];
  const paginationIndex = paginationEnabled ? item.paginationIndex : null;
  const previousItem = Number.isInteger(paginationIndex) ? orderedItems[paginationIndex - 1] : null;
  const nextItem = Number.isInteger(paginationIndex) ? orderedItems[paginationIndex + 1] : null;
  const paginationPrev = previousItem ? [buildPaginationLinkItem(previousItem, 'Previous')] : [];
  const paginationNext = nextItem ? [buildPaginationLinkItem(nextItem, 'Next')] : [];
  const detailRoute = item.detailRouteTemplate.replace(':slug', item.detail.slug);

  const context = {
    ...item.fields,
    slug: item.detail.slug,
    detailRoute,
    pageKey: item.name,
    pageRoute: detailRoute,
    sourcePageRoute: item.route,
    blockType: item.name,
    sourcePath: item.detail.path,
    ...item.detail.meta,
    bodyHtml: item.detail.bodyHtml,
    assetDirectory: item.detail.assetDirectory,
    assetDirectoryUrl: item.detail.assetDirectoryUrl,
    paginationPrev,
    paginationNext,
    eyebrowActionsHtml: paginationEnabled ? buildEyebrowActionsHtml(paginationPrev[0], paginationNext[0]) : '',
  };

  context.coverImage = context.coverImage || item.detail.coverImage || '';
  context.heroImage = context.heroImage || context.coverImage || '';

  return context;
}

function registerDetailRoutes(app, runtime) {
  const shellTemplate = loadTemplate(runtime.config.templates.pageShell);

  for (const [blockName, blockConfig] of Object.entries(runtime.config.blocks)) {
    if (!blockConfig.hasDetailPage) {
      continue;
    }

    const detailTemplate = loadTemplate(runtime.config.templates[blockConfig.detailTemplate]);

    app.get(blockConfig.route, (req, res) => {
      const slug = req.params.slug;
      const item = (runtime.index.blocks[blockName] || []).find((candidate) => candidate.detail && candidate.detail.slug === slug);

      if (!item) {
        res.status(404).send('Not Found');
        return;
      }

      const context = buildDetailContext(item, runtime);
      const baseUrl = runtime.config.site && runtime.config.site.siteUrl
        ? runtime.config.site.siteUrl
        : `${req.protocol}://${req.get('host')}`;
      const seo = resolveDetailSeo(item, runtime.config, { baseUrl });
      const html = renderDetailPage({
        shellTemplate,
        detailTemplate,
        context: {
          ...(runtime.config.site || {}),
          ...context,
          description: context.description || context.lead || context.summary || context.title || context.slug,
          __seo: seo,
          ...buildThemeContext(runtime.config.theme),
          pageHeaderHtml: buildPageHeaderHtml({
            pageKey: context.pageKey,
            pageRoute: context.pageRoute,
            title: context.title,
            eyebrow: context.eyebrow,
            lead: context.lead,
            heroImage: context.heroImage,
            heroAlt: context.heroAlt,
            showHero: true,
            eyebrowActionsHtml: context.eyebrowActionsHtml,
          }),
        },
      });

      res.type('html').send(html);
    });
  }
}

module.exports = {
  buildDetailContext,
  registerDetailRoutes,
};
