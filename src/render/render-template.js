function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readField(context, fieldName) {
  if (!(fieldName in context)) {
    throw new Error(`Missing template field: ${fieldName}`);
  }

  return context[fieldName];
}

function renderSections(template, context) {
  return template.replace(/{{#([a-zA-Z0-9_.$-]+)}}([\s\S]*?){{\/\1}}/g, (match, fieldName, innerTemplate) => {
    const items = readField(context, fieldName);
    if (!Array.isArray(items)) {
      throw new Error(`Section field "${fieldName}" must be an array`);
    }

    return items
      .map((item) => renderTemplate(innerTemplate, item))
      .join('');
  });
}

function renderTemplate(template, context = {}) {
  let html = renderSections(template, context);

  html = html.replace(/{{{([a-zA-Z0-9_.$-]+)}}}/g, (match, fieldName) => {
    const value = readField(context, fieldName);
    return value == null ? '' : String(value);
  });

  html = html.replace(/{{([a-zA-Z0-9_.$-]+)}}/g, (match, fieldName) => {
    const value = readField(context, fieldName);
    return escapeHtml(value == null ? '' : value);
  });

  return html;
}

module.exports = {
  escapeHtml,
  renderTemplate,
};
