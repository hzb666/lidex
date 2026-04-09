const { escapeHtml } = require('./render-template.js');

function buildHeadHtml(head = {}) {
  const tags = [];

  for (const href of head.stylesheets || []) {
    tags.push(`<link rel="stylesheet" href="${escapeHtml(href)}">`);
  }

  for (const src of head.scripts || []) {
    tags.push(`<script src="${escapeHtml(src)}"></script>`);
  }

  return tags.join('\n');
}

function injectHeadHtml(html = '', head = {}) {
  const nextHtml = String(html || '');
  const injectedTags = buildHeadHtml(head);

  if (!injectedTags) {
    return nextHtml;
  }

  if (/<\/head>/i.test(nextHtml)) {
    return nextHtml.replace(/<\/head>/i, `${injectedTags}\n</head>`);
  }

  return `${injectedTags}\n${nextHtml}`;
}

module.exports = {
  buildHeadHtml,
  injectHeadHtml,
};
