const { renderTemplate } = require('./render-template.js');

function renderDetailPage({ shellTemplate, detailTemplate, context }) {
  const contentHtml = renderTemplate(detailTemplate, context);
  return renderTemplate(shellTemplate, {
    ...context,
    contentHtml,
  });
}

module.exports = {
  renderDetailPage,
};
