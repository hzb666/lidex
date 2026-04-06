const { injectSeoHead } = require('../seo/render-seo-head.js');
const { renderTemplate } = require('./render-template.js');

function renderPage({ shellTemplate, context }) {
  const html = renderTemplate(shellTemplate, context);
  return context.__seo ? injectSeoHead(html, context.__seo) : html;
}

module.exports = {
  renderPage,
};
