const { RESERVED_FIELD_PATTERN, SYSTEM_FIELDS } = require('../content/detail-slug.js');

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function validateConfig(config) {
  assertObject(config, 'config');
  assertObject(config.pages, 'config.pages');
  assertObject(config.blocks, 'config.blocks');

  for (const [pageKey, page] of Object.entries(config.pages)) {
    assertObject(page, `config.pages.${pageKey}`);

    if (!page.route || typeof page.route !== 'string') {
      throw new Error(`config.pages.${pageKey}.route must be a string`);
    }

    if (!page.source || typeof page.source !== 'string') {
      throw new Error(`config.pages.${pageKey}.source must be a string`);
    }
  }

  for (const [blockKey, block] of Object.entries(config.blocks)) {
    assertObject(block, `config.blocks.${blockKey}`);
    assertObject(block.fields, `config.blocks.${blockKey}.fields`);

    if (blockKey === '_pages_') {
      throw new Error('config.blocks._pages_ is reserved for page asset directories');
    }

    if (!block.template || typeof block.template !== 'string') {
      throw new Error(`config.blocks.${blockKey}.template must be a string`);
    }

    for (const fieldName of Object.keys(block.fields)) {
      if (SYSTEM_FIELDS.has(fieldName) || RESERVED_FIELD_PATTERN.test(fieldName)) {
        throw new Error(`config.blocks.${blockKey}.fields.${fieldName} uses a reserved system field name`);
      }
    }

    if (block.hasDetailPage) {
      if (!block.route || typeof block.route !== 'string' || !block.route.includes(':slug')) {
        throw new Error(`config.blocks.${blockKey}.route must be a string containing :slug when hasDetailPage is true`);
      }

      if (!block.contentDir || typeof block.contentDir !== 'string') {
        throw new Error(`config.blocks.${blockKey}.contentDir must be a string when hasDetailPage is true`);
      }

      if (!block.slugField || typeof block.slugField !== 'string') {
        throw new Error(`config.blocks.${blockKey}.slugField must be a string when hasDetailPage is true`);
      }

      if (block.slugSourceField != null && typeof block.slugSourceField !== 'string') {
        throw new Error(`config.blocks.${blockKey}.slugSourceField must be a string when provided`);
      }

      if (!block.detailTemplate || typeof block.detailTemplate !== 'string') {
        throw new Error(`config.blocks.${blockKey}.detailTemplate must be a string when hasDetailPage is true`);
      }
    }
  }
}

module.exports = {
  validateConfig,
};
