const { injectSeoHead } = require('../seo/render-seo-head.js');
const { injectHeadHtml } = require('./inject-head-html.js');
const { injectReloadScript } = require('./inject-reload-script.js');
const { renderTemplate } = require('./render-template.js');

function renderDetailPage({ shellTemplate, detailTemplate, context }) {
  const contentHtml = renderTemplate(detailTemplate, context);
  const html = renderTemplate(shellTemplate, {
    ...context,
    contentHtml,
  });
  const headHtml = context.__head ? injectHeadHtml(html, context.__head) : html;
  const seoHtml = context.__seo ? injectSeoHead(headHtml, context.__seo) : headHtml;
  return context.__reload ? injectReloadScript(seoHtml, context.__reloadVersion) : seoHtml;
}

module.exports = {
  renderDetailPage,
};
