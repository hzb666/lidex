const { escapeHtml } = require('../render/render-template.js');
const { normalizeBaseUrl, resolveDetailSeo, resolvePageSeo } = require('./resolve-seo.js');

function buildSitemapEntries(runtime, options = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl || runtime.config.site && runtime.config.site.siteUrl || '');
  const entries = [];

  for (const page of Object.values(runtime.index.pages)) {
    const seo = resolvePageSeo(page, runtime.config, { baseUrl });
    if (!seo.noindex) {
      entries.push({
        route: page.route,
        url: seo.canonical || page.route,
      });
    }
  }

  for (const [blockName, blockConfig] of Object.entries(runtime.config.blocks)) {
    if (!blockConfig.hasDetailPage) {
      continue;
    }

    for (const item of runtime.index.blocks[blockName] || []) {
      if (!item.detail) {
        continue;
      }

      const seo = resolveDetailSeo(item, runtime.config, { baseUrl });
      if (!seo.noindex) {
        entries.push({
          route: item.detailRouteTemplate.replace(':slug', item.detail.slug),
          url: seo.canonical || item.detailRouteTemplate.replace(':slug', item.detail.slug),
        });
      }
    }
  }

  return entries;
}

function buildSitemapXml(runtime, options = {}) {
  const entries = buildSitemapEntries(runtime, options);
  const body = entries.map((entry) => `  <url><loc>${escapeHtml(entry.url)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

module.exports = {
  buildSitemapEntries,
  buildSitemapXml,
};
