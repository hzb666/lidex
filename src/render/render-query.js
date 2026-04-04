const { renderTemplate } = require('./render-template.js');

function renderQuery({ template, context }) {
  return renderTemplate(template, context);
}

module.exports = {
  renderQuery,
};
