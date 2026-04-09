const { loadDetailDoc } = require('./load-detail-doc.js');
const { LidexError } = require('../utils/errors.js');
const { collectManagedContent } = require('./managed-content.js');
const { PAGINATION_FIELD, RESERVED_FIELD_PATTERN, SYSTEM_FIELDS } = require('./detail-slug.js');
const {
  appendNodeFieldLocation,
  appendSourceLocation,
  getFieldSource,
} = require('./source-location.js');

function parsePaginationPage(fieldValue, nodeName, source, rootDir) {
  if (fieldValue == null || fieldValue === '') {
    return null;
  }

  const numericValue = Number(fieldValue);
  if (!Number.isFinite(numericValue)) {
    throw new LidexError(
      appendSourceLocation(
        `Block "${nodeName}" has invalid ${PAGINATION_FIELD} value "${fieldValue}"`,
        rootDir,
        getFieldSource(source, PAGINATION_FIELD),
      ),
    );
  }

  return numericValue;
}

function validateBlockFields(node, blockConfig, rootDir) {
  const declaredFields = blockConfig.fields || {};

  for (const fieldName of Object.keys(node.fields)) {
    if (fieldName === PAGINATION_FIELD && blockConfig.enablePagination) {
      continue;
    }

    if (SYSTEM_FIELDS.has(fieldName)) {
      continue;
    }

    if (RESERVED_FIELD_PATTERN.test(fieldName)) {
      throw new LidexError(
        appendNodeFieldLocation(
          `Block "${node.name}" contains unknown reserved system field "${fieldName}"`,
          rootDir,
          node,
          fieldName,
        ),
      );
    }

    if (!declaredFields[fieldName]) {
      throw new LidexError(
        appendNodeFieldLocation(
          `Block "${node.name}" contains undeclared field "${fieldName}"`,
          rootDir,
          node,
          fieldName,
        ),
      );
    }
  }

  for (const [fieldName, fieldConfig] of Object.entries(declaredFields)) {
    if (fieldConfig.required && !node.fields[fieldName]) {
      throw new LidexError(
        appendNodeFieldLocation(
          `Block "${node.name}" is missing required field "${fieldName}"`,
          rootDir,
          node,
          fieldName,
        ),
      );
    }
  }
}

function compareSourceOrder(left, right) {
  return left.source.startLine - right.source.startLine;
}

function comparePageKey(left, right) {
  return left.localeCompare(right);
}

function buildPaginationOrder(items, rootDir) {
  const pageGroups = new Map();

  for (const item of items) {
    const pageKey = item.pageKey;
    if (!pageGroups.has(pageKey)) {
      pageGroups.set(pageKey, []);
    }

    const pageValue = parsePaginationPage(item.fields[PAGINATION_FIELD], item.name, item.source, rootDir);
    item.paginationPage = pageValue;
    pageGroups.get(pageKey).push(item);
  }

  const pageKeys = Array.from(pageGroups.keys()).sort(comparePageKey);
  const pagedClusters = [];
  const unpagedOnlyGroups = [];
  let hasExplicitPagination = false;

  for (const pageKey of pageKeys) {
    const pageItems = pageGroups.get(pageKey).slice().sort(compareSourceOrder);
    const explicitItems = pageItems
      .filter((item) => item.paginationPage != null)
      .sort((left, right) => left.paginationPage - right.paginationPage || compareSourceOrder(left, right));
    const implicitItems = pageItems.filter((item) => item.paginationPage == null);

    if (explicitItems.length === 0) {
      unpagedOnlyGroups.push({
        pageKey,
        items: implicitItems,
      });
      continue;
    }

    hasExplicitPagination = true;
    const pageClusters = [];

    for (const item of explicitItems) {
      const lastCluster = pageClusters[pageClusters.length - 1];
      if (!lastCluster || item.paginationPage > lastCluster.end + 1) {
        pageClusters.push({
          pageKey,
          anchor: item.paginationPage,
          end: item.paginationPage,
          items: [item],
        });
        continue;
      }

      lastCluster.items.push(item);
      lastCluster.end = item.paginationPage;
    }

    if (implicitItems.length > 0) {
      pageClusters[pageClusters.length - 1].items.push(...implicitItems);
    }

    pagedClusters.push(...pageClusters);
  }

  if (!hasExplicitPagination) {
    return pageKeys.flatMap((pageKey) => pageGroups.get(pageKey).slice().sort(compareSourceOrder));
  }

  const sortedClusters = pagedClusters
    .slice()
    .sort((left, right) => left.anchor - right.anchor || comparePageKey(left.pageKey, right.pageKey) || left.end - right.end);
  const overlapGroups = [];

  for (const cluster of sortedClusters) {
    const currentGroup = overlapGroups[overlapGroups.length - 1];
    if (!currentGroup || cluster.anchor > currentGroup.maxEnd) {
      overlapGroups.push({
        maxEnd: cluster.end,
        clusters: [cluster],
      });
      continue;
    }

    currentGroup.clusters.push(cluster);
    currentGroup.maxEnd = Math.max(currentGroup.maxEnd, cluster.end);
  }

  const orderedItems = [];
  for (const group of overlapGroups) {
    const groupClusters = group.clusters
      .slice()
      .sort((left, right) => comparePageKey(left.pageKey, right.pageKey) || left.anchor - right.anchor || left.end - right.end);

    for (const cluster of groupClusters) {
      orderedItems.push(...cluster.items);
    }
  }

  const trailingImplicitItems = unpagedOnlyGroups
    .slice()
    .sort((left, right) => comparePageKey(left.pageKey, right.pageKey))
    .flatMap((group) => group.items);

  orderedItems.push(...trailingImplicitItems);
  return orderedItems;
}

function validateQueryNode(node, config) {
  if (node.params.where) {
    try {
      JSON.parse(node.params.where);
    } catch {
      throw new LidexError(
        appendSourceLocation(
          'Invalid query where JSON',
          config.rootDir,
          getFieldSource(node.source, 'where'),
        ),
      );
    }
  }

  if (!node.params.template || !config.queryTemplates[node.params.template]) {
    throw new LidexError(
      appendSourceLocation(
        `Query block references unknown query template key "${node.params.template}"`,
        config.rootDir,
        getFieldSource(node.source, 'template'),
      ),
    );
  }
}

function buildContentIndex(config) {
  const { pages, detailEntriesByBlock } = collectManagedContent(config);
  const index = {
    pages,
    blocks: {},
    pagination: {},
    queries: [],
  };

  for (const page of Object.values(pages)) {
    for (const node of page.nodes) {
      if (node.type === 'query') {
        validateQueryNode(node, config);
        index.queries.push(node);
        continue;
      }

      const blockConfig = config.blocks[node.name];
      if (!blockConfig) {
        throw new LidexError(
          appendSourceLocation(`Undeclared block "${node.name}" found`, config.rootDir, node.source),
        );
      }

      validateBlockFields(node, blockConfig, config.rootDir);

      const blockEntry = {
        ...node,
        pageKey: page.key,
        route: page.route,
        detailRouteTemplate: blockConfig.route,
      };

      if (blockConfig && blockConfig.hasDetailPage) {
        const detailEntry = (detailEntriesByBlock[node.name] || []).find((entry) => entry.node === node);
        if (!detailEntry) {
          throw new LidexError(
            appendSourceLocation(
              `Detail-enabled block "${node.name}" is missing managed detail metadata`,
              config.rootDir,
              node.source,
            ),
          );
        }

        blockEntry.detail = loadDetailDoc(config, blockConfig, detailEntry.slug, {
          source: getFieldSource(node.source, detailEntry.locationField),
        });
        blockEntry.detail.assetDirectory = detailEntry.assetDirectory;
        blockEntry.detail.assetDirectoryUrl = detailEntry.assetDirectoryUrl;
        blockEntry.detail.coverImage = detailEntry.coverImage;
      }

      if (!index.blocks[node.name]) {
        index.blocks[node.name] = [];
      }

      index.blocks[node.name].push(blockEntry);
    }
  }

  for (const [blockName, blockConfig] of Object.entries(config.blocks)) {
    if (!blockConfig.hasDetailPage || !blockConfig.enablePagination || !index.blocks[blockName]) {
      continue;
    }

    const orderedItems = buildPaginationOrder(index.blocks[blockName], config.rootDir);
    index.pagination[blockName] = orderedItems;
    for (let itemIndex = 0; itemIndex < orderedItems.length; itemIndex += 1) {
      orderedItems[itemIndex].paginationIndex = itemIndex;
    }
  }

  return index;
}

module.exports = {
  buildContentIndex,
};

