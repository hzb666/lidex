const { injectSeoHead } = require('../seo/render-seo-head.js');
const { renderTemplate } = require('./render-template.js');

function renderDetailPage({ shellTemplate, detailTemplate, context }) {
  const contentHtml = renderTemplate(detailTemplate, context);
  const html = renderTemplate(shellTemplate, {
    ...context,
    contentHtml,
  });
  return context.__seo ? injectSeoHead(html, context.__seo) : html;
}

module.exports = {
  renderDetailPage,
};
