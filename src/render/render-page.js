const { renderTemplate } = require('./render-template.js');

function renderPage({ shellTemplate, context }) {
  return renderTemplate(shellTemplate, context);
}

module.exports = {
  renderPage,
};
