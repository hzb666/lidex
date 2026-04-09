const fs = require('node:fs');
const path = require('node:path');

const { RESERVED_FIELD_PATTERN } = require('./detail-slug.js');

function toPosixPath(value) {
  return String(value || '').replace(/\\/g, '/');
}

function buildReservedFields(fields = {}) {
  return Object.fromEntries(
    Object.entries(fields)
      .filter(([fieldName]) => RESERVED_FIELD_PATTERN.test(fieldName))
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function buildResolvedMetadata(node, blockConfig) {
  if (!blockConfig || !blockConfig.hasDetailPage) {
    return null;
  }

  return {
    slug: node.detailSlug || '',
    slugField: blockConfig.slugField || 'slug',
    slugSourceField: node.detailSourceField || '',
    slugSourceValue: node.detailSourceValue || '',
  };
}

function buildManagedContentMetadata(config, model, mode) {
  const entries = [];

  for (const page of Object.values(model.pages)) {
    const sourcePath = toPosixPath(path.relative(config.rootDir, page.sourcePath));

    for (const node of page.nodes) {
      if (node.type !== 'block') {
        continue;
      }

      const reservedFields = buildReservedFields(node.fields);
      const blockConfig = config.blocks[node.name];
      const resolved = buildResolvedMetadata(node, blockConfig);

      if (!Object.keys(reservedFields).length && !resolved) {
        continue;
      }

      entries.push({
        block: node.name,
        sourcePageKey: page.key,
        sourcePath,
        line: node.source.fileStartLine || node.source.startLine,
        reservedFields,
        resolved,
      });
    }
  }

  entries.sort((left, right) => (
    left.sourcePath.localeCompare(right.sourcePath)
    || left.line - right.line
    || left.block.localeCompare(right.block)
  ));

  return {
    generatedAt: new Date().toISOString(),
    mode,
    entries,
  };
}

function sleepMs(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function writeMetadataFile(metadataPath, metadata) {
  let lastError = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
      return;
    } catch (error) {
      if (!error || !['EBUSY', 'EPERM'].includes(error.code)) {
        throw error;
      }

      lastError = error;
      sleepMs(25 * (attempt + 1));
    }
  }

  throw lastError;
}

function writeManagedContentMetadata(config, model, mode) {
  const metadataPath = path.join(config.rootDir, '.lidex', 'managed-content.json');
  const metadata = buildManagedContentMetadata(config, model, mode);

  fs.mkdirSync(path.dirname(metadataPath), { recursive: true });
  writeMetadataFile(metadataPath, metadata);

  return metadataPath;
}

module.exports = {
  buildManagedContentMetadata,
  writeManagedContentMetadata,
};
