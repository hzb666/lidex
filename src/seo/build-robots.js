const { normalizeBaseUrl } = require('./resolve-seo.js');

function buildRobotsTxt({ baseUrl = '', adminPath = '/admin' } = {}) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const sitemapUrl = normalizedBaseUrl ? `${normalizedBaseUrl}/sitemap.xml` : '/sitemap.xml';

  return [
    'User-agent: *',
    'Allow: /',
    `Disallow: ${String(adminPath || '/admin').trim() || '/admin'}`,
    '',
    `Sitemap: ${sitemapUrl}`,
    '',
  ].join('\n');
}

module.exports = {
  buildRobotsTxt,
};
