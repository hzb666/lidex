const { escapeHtml } = require('../render/render-template.js');

function buildSeoHeadHtml(seo = {}) {
  const tags = [];

  if (seo.title) {
    tags.push(`<title>${escapeHtml(seo.title)}</title>`);
    tags.push(`<meta property="og:title" content="${escapeHtml(seo.title)}">`);
    tags.push(`<meta name="twitter:title" content="${escapeHtml(seo.title)}">`);
  }

  tags.push(`<meta name="description" content="${escapeHtml(seo.description || '')}">`);
  tags.push(`<meta property="og:description" content="${escapeHtml(seo.description || '')}">`);
  tags.push(`<meta name="twitter:description" content="${escapeHtml(seo.description || '')}">`);

  if (seo.canonical) {
    tags.push(`<link rel="canonical" href="${escapeHtml(seo.canonical)}">`);
    tags.push(`<meta property="og:url" content="${escapeHtml(seo.canonical)}">`);
  }

  tags.push(`<meta property="og:type" content="${escapeHtml(seo.ogType || 'website')}">`);
  if (seo.siteName) {
    tags.push(`<meta property="og:site_name" content="${escapeHtml(seo.siteName)}">`);
  }

  if (seo.image) {
    tags.push(`<meta property="og:image" content="${escapeHtml(seo.image)}">`);
    tags.push(`<meta name="twitter:image" content="${escapeHtml(seo.image)}">`);
    if (seo.imageAlt) {
      tags.push(`<meta property="og:image:alt" content="${escapeHtml(seo.imageAlt)}">`);
      tags.push(`<meta name="twitter:image:alt" content="${escapeHtml(seo.imageAlt)}">`);
    }
  }

  tags.push(`<meta name="twitter:card" content="${escapeHtml(seo.twitterCard || 'summary')}">`);

  if (seo.noindex) {
    tags.push('<meta name="robots" content="noindex">');
  }

  if (seo.emitKeywordsMeta && seo.keywords && seo.keywords.length) {
    tags.push(`<meta name="keywords" content="${escapeHtml(seo.keywords.join(', '))}">`);
  }

  return tags.join('\n');
}

function buildSupplementalSeoHeadHtml(seo = {}) {
  const tags = [];

  if (seo.title) {
    tags.push(`<meta property="og:title" content="${escapeHtml(seo.title)}">`);
    tags.push(`<meta name="twitter:title" content="${escapeHtml(seo.title)}">`);
  }

  tags.push(`<meta property="og:description" content="${escapeHtml(seo.description || '')}">`);
  tags.push(`<meta name="twitter:description" content="${escapeHtml(seo.description || '')}">`);

  if (seo.canonical) {
    tags.push(`<meta property="og:url" content="${escapeHtml(seo.canonical)}">`);
  }

  tags.push(`<meta property="og:type" content="${escapeHtml(seo.ogType || 'website')}">`);
  if (seo.siteName) {
    tags.push(`<meta property="og:site_name" content="${escapeHtml(seo.siteName)}">`);
  }

  if (seo.image) {
    tags.push(`<meta property="og:image" content="${escapeHtml(seo.image)}">`);
    tags.push(`<meta name="twitter:image" content="${escapeHtml(seo.image)}">`);
    if (seo.imageAlt) {
      tags.push(`<meta property="og:image:alt" content="${escapeHtml(seo.imageAlt)}">`);
      tags.push(`<meta name="twitter:image:alt" content="${escapeHtml(seo.imageAlt)}">`);
    }
  }

  tags.push(`<meta name="twitter:card" content="${escapeHtml(seo.twitterCard || 'summary')}">`);

  if (seo.noindex) {
    tags.push('<meta name="robots" content="noindex">');
  }

  if (seo.emitKeywordsMeta && seo.keywords && seo.keywords.length) {
    tags.push(`<meta name="keywords" content="${escapeHtml(seo.keywords.join(', '))}">`);
  }

  return tags.join('\n');
}

function replaceOrInsert(html, pattern, replacement) {
  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }

  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${replacement}\n</head>`);
  }

  return `${replacement}\n${html}`;
}

function injectSeoHead(html = '', seo = {}) {
  let nextHtml = String(html || '');
  nextHtml = replaceOrInsert(nextHtml, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seo.title || '')}</title>`);
  nextHtml = replaceOrInsert(nextHtml, /<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeHtml(seo.description || '')}">`);
  nextHtml = replaceOrInsert(nextHtml, /<link\s+rel=["']canonical["'][^>]*>/i, seo.canonical ? `<link rel="canonical" href="${escapeHtml(seo.canonical)}">` : '');

  const injectedTags = buildSupplementalSeoHeadHtml(seo);

  if (injectedTags) {
    nextHtml = nextHtml.replace(/<\/head>/i, `${injectedTags}\n</head>`);
  }

  return nextHtml;
}

module.exports = {
  buildSeoHeadHtml,
  buildSupplementalSeoHeadHtml,
  injectSeoHead,
};
