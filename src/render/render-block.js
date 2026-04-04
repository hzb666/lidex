const { renderTemplate } = require('./render-template.js');

function renderBlock({ template, context }) {
  return renderTemplate(template, context);
}

module.exports = {
  renderBlock,
};
