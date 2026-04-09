const { randomUUID } = require('node:crypto');

const { pinyin } = require('pinyin-pro');
const { LidexError } = require('../utils/errors.js');
const { appendNodeFieldLocation, appendSourceLocation } = require('./source-location.js');

const SYSTEM_FIELDS = new Set(['_id_', '_slug_']);
const PAGINATION_FIELD = '_page_';
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

function validateExplicitSlug(value, node, fieldName, rootDir) {
  if (/[\\/]/.test(value) || String(value).includes('..')) {
    throw new LidexError(
      appendNodeFieldLocation(
        `Detail slug "${value}" must not contain path separators or ".." segments`,
        rootDir,
        node,
        fieldName,
      ),
    );
  }

  const normalized = normalizeSlug(value);
  if (!normalized) {
    throw new LidexError(
      appendNodeFieldLocation(
        `Detail-enabled block "${node.name}" provided an empty _slug_ value`,
        rootDir,
        node,
        fieldName,
      ),
    );
  }

  return normalized;
}

function getDetailSlugInfo(node, blockConfig, rootDir) {
  const slugField = blockConfig.slugField || 'slug';
  const explicitSlugValue = node.fields._slug_ || (slugField !== '_slug_' ? node.fields[slugField] : '');
  const explicitSourceField = node.fields._slug_ ? '_slug_' : (slugField !== '_slug_' ? slugField : '_slug_');

  if (explicitSlugValue) {
    return {
      slugField,
      sourceField: '_slug_',
      sourceValue: explicitSlugValue,
      slug: validateExplicitSlug(explicitSlugValue, node, explicitSourceField, rootDir),
      explicit: true,
      locationField: explicitSourceField,
    };
  }

  const sourceField = blockConfig.slugSourceField || slugField;
  const sourceValue = node.fields[sourceField];

  if (!sourceValue) {
    const label = blockConfig.slugSourceField ? 'slug source field' : 'slug field';
    throw new LidexError(
      appendSourceLocation(
        `Detail-enabled block "${node.name}" is missing ${label} "${sourceField}"`,
        rootDir,
        node.source,
      ),
    );
  }

  if (!blockConfig.slugSourceField && !SYSTEM_FIELDS.has(sourceField) && (/[\\/]/.test(sourceValue) || String(sourceValue).includes('..'))) {
    throw new LidexError(
      appendNodeFieldLocation(
        `Detail slug "${sourceValue}" must not contain path separators or ".." segments`,
        rootDir,
        node,
        sourceField,
      ),
    );
  }

  const slug = slugifyValue(sourceValue);
  if (!slug) {
    throw new LidexError(
      appendNodeFieldLocation(
        `Detail-enabled block "${node.name}" produced an empty detail slug from field "${sourceField}"`,
        rootDir,
        node,
        sourceField,
      ),
    );
  }

  return {
    slugField,
    sourceField,
    sourceValue,
    slug,
    explicit: false,
    locationField: sourceField,
  };
}

module.exports = {
  PAGINATION_FIELD,
  SYSTEM_FIELDS,
  RESERVED_FIELD_PATTERN,
  generateManagedId,
  getDetailSlugInfo,
  normalizeSlug,
  slugifyValue,
};

