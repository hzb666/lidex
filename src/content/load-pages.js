const fs = require('node:fs');

const { resolveWithinRoot } = require('../utils/path-utils.js');
const { parseFrontmatter } = require('./parse-frontmatter.js');
const { parseBlocks } = require('./parse-blocks.js');

function loadPages(config) {
  const pages = {};

  for (const [pageKey, pageConfig] of Object.entries(config.pages)) {
    const filePath = resolveWithinRoot(config.rootDir, pageConfig.source);
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = parseFrontmatter(raw);

    pages[pageKey] = {
      key: pageKey,
      route: pageConfig.route,
      sourcePath: filePath,
      meta: parsed.meta,
      body: parsed.body,
      nodes: parseBlocks(parsed.body, {
        pageKey,
        filePath,
      }),
    };
  }

  return pages;
}

module.exports = {
  loadPages,
};
