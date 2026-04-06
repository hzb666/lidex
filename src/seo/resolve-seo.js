function normalizeBaseUrl(value = '') {
  return String(value || '').trim().replace(/\/+$/, '');
}

function isAbsoluteUrl(value = '') {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function resolveUrl(baseUrl, value = '') {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  if (isAbsoluteUrl(raw)) {
    return raw;
  }

  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  if (!normalizedBaseUrl) {
    return '';
  }

  if (raw.startsWith('/')) {
    return `${normalizedBaseUrl}${raw}`;
  }

  return `${normalizedBaseUrl}/${raw}`;
}

function normalizeKeywords(value = '') {
  return Array.from(new Set(
    String(value || '')
      .split(/[,\n，]/)
      .map((item) => item.trim())
      .filter(Boolean),
  ));
}

function parseOptionalBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (['true', '1', 'yes', 'y'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'n'].includes(normalized)) {
    return false;
  }

  return null;
}

function pickFirst(...values) {
  for (const value of values) {
    const normalized = String(value || '').trim();
    if (normalized) {
      return normalized;
    }
  }

  return '';
}

function readSeoOverrides(meta = {}) {
  return {
    title: pickFirst(meta['seo.title']),
    description: pickFirst(meta['seo.description']),
    image: pickFirst(meta['seo.image']),
    imageAlt: pickFirst(meta['seo.imageAlt']),
    canonical: pickFirst(meta['seo.canonical']),
    keywords: normalizeKeywords(meta['seo.keywords']),
    noindex: parseOptionalBoolean(meta['seo.noindex']),
  };
}

function resolveSeoMetadata({
  kind = 'page',
  route = '/',
  meta = {},
  site = {},
  baseUrl = '',
  defaults = {},
} = {}) {
  const overrides = readSeoOverrides(meta);
  const resolvedBaseUrl = normalizeBaseUrl(baseUrl || site.siteUrl || '');
  const title = pickFirst(overrides.title, defaults.title, meta.title, meta.name, route);
  const description = pickFirst(
    overrides.description,
    defaults.description,
    meta.description,
    meta.lead,
    meta.summary,
  );
  const image = resolveUrl(
    resolvedBaseUrl,
    pickFirst(overrides.image, defaults.image, meta.heroImage, meta.coverImage),
  );
  const imageAlt = pickFirst(overrides.imageAlt, defaults.imageAlt, meta.heroAlt, meta.title, title);
  const canonical = resolveUrl(
    resolvedBaseUrl,
    pickFirst(overrides.canonical, defaults.canonical, route),
  );
  const noindex = overrides.noindex == null ? false : overrides.noindex;
  const keywords = overrides.keywords.length ? overrides.keywords : normalizeKeywords(defaults.keywords);

  return {
    title,
    description: description || title,
    image,
    imageAlt,
    canonical,
    noindex,
    keywords,
    twitterCard: image ? 'summary_large_image' : 'summary',
    ogType: kind === 'detail' ? 'article' : 'website',
    siteName: pickFirst(site.siteName, site.title),
    emitKeywordsMeta: Boolean(site.seo && site.seo.emitKeywordsMeta),
  };
}

function resolvePageSeo(page, config, options = {}) {
  return resolveSeoMetadata({
    kind: 'page',
    route: page.route,
    meta: page.meta,
    site: config.site || {},
    baseUrl: options.baseUrl,
  });
}

function resolveDetailSeo(item, config, options = {}) {
  const route = item.detailRouteTemplate.replace(':slug', item.detail.slug);
  return resolveSeoMetadata({
    kind: 'detail',
    route,
    meta: {
      ...item.fields,
      ...item.detail.meta,
    },
    site: config.site || {},
    baseUrl: options.baseUrl,
  });
}

module.exports = {
  normalizeBaseUrl,
  normalizeKeywords,
  resolveDetailSeo,
  resolvePageSeo,
  resolveSeoMetadata,
  resolveUrl,
};
