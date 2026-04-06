const { buildRobotsTxt } = require('../seo/build-robots.js');
const { buildSitemapXml } = require('../seo/build-sitemap.js');
const { normalizeAdminPath } = require('./register-admin-routes.js');

function getRequestBaseUrl(req, runtime) {
  if (runtime.config.site && runtime.config.site.siteUrl) {
    return runtime.config.site.siteUrl;
  }

  return `${req.protocol}://${req.get('host')}`;
}

function registerSeoRoutes(app, runtime, options = {}) {
  app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml').send(buildSitemapXml(runtime, {
      baseUrl: getRequestBaseUrl(req, runtime),
    }));
  });

  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(buildRobotsTxt({
      baseUrl: getRequestBaseUrl(req, runtime),
      adminPath: normalizeAdminPath(options.adminPath),
    }));
  });
}

module.exports = {
  registerSeoRoutes,
};
