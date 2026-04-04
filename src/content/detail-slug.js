const { randomUUID } = require('node:crypto');

const { pinyin } = require('pinyin-pro');
const { LydexError } = require('../utils/errors.js');

const SYSTEM_FIELDS = new Set(['_id_', '_slug_']);
const RESERVED_FIELD_PATTERN = /^_.*_$/;

function generateManagedId() {
  return `id-${randomUUID()}`;
}

function normalizeSlug(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/\p{Mark}+/gu, '')
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function transliterateText(value) {
  return pinyin(String(value || ''), {
    toneType: 'none',
    nonZh: 'consecutive',
  });
}

function slugifyValue(value) {
  const source = String(value || '').trim();
  if (!source) {
    return '';
  }

  return normalizeSlug(transliterateText(source));
}

function validateExplicitSlug(value, nodeName) {
  if (/[\\/]/.test(value) || String(value).includes('..')) {
    throw new LydexError(`Detail slug "${value}" must not contain path separators or ".." segments`);
  }

  const normalized = normalizeSlug(value);
  if (!normalized) {
    throw new LydexError(`Detail-enabled block "${nodeName}" provided an empty _slug_ value`);
  }

  return normalized;
}

function getDetailSlugInfo(node, blockConfig) {
  const slugField = blockConfig.slugField || 'slug';
  const explicitSlugValue = node.fields._slug_ || (slugField !== '_slug_' ? node.fields[slugField] : '');

  if (explicitSlugValue) {
    return {
      slugField,
      sourceField: '_slug_',
      sourceValue: explicitSlugValue,
      slug: validateExplicitSlug(explicitSlugValue, node.name),
      explicit: true,
    };
  }

  const sourceField = blockConfig.slugSourceField || slugField;
  const sourceValue = node.fields[sourceField];

  if (!sourceValue) {
    const label = blockConfig.slugSourceField ? 'slug source field' : 'slug field';
    throw new LydexError(
      `Detail-enabled block "${node.name}" is missing ${label} "${sourceField}"`,
    );
  }

  if (!blockConfig.slugSourceField && !SYSTEM_FIELDS.has(sourceField) && (/[\\/]/.test(sourceValue) || String(sourceValue).includes('..'))) {
    throw new LydexError(`Detail slug "${sourceValue}" must not contain path separators or ".." segments`);
  }

  const slug = slugifyValue(sourceValue);
  if (!slug) {
    throw new LydexError(
      `Detail-enabled block "${node.name}" produced an empty detail slug from field "${sourceField}"`,
    );
  }

  return {
    slugField,
    sourceField,
    sourceValue,
    slug,
    explicit: false,
  };
}

module.exports = {
  SYSTEM_FIELDS,
  RESERVED_FIELD_PATTERN,
  generateManagedId,
  getDetailSlugInfo,
  normalizeSlug,
  slugifyValue,
};

