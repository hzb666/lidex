const fs = require('node:fs');

const { LydexError } = require('../utils/errors.js');
const { renderMarkdownBody } = require('./render-markdown-body.js');
const { isPathInside, resolveWithinRoot } = require('../utils/path-utils.js');
const { parseFrontmatter } = require('./parse-frontmatter.js');

function loadDetailDoc(config, blockConfig, slug) {
  if (/[\\/]/.test(slug) || slug.includes('..')) {
    throw new LydexError(`Detail slug "${slug}" must not contain path separators or ".." segments`);
  }

  const contentRoot = resolveWithinRoot(config.rootDir, blockConfig.contentDir);
  const detailPath = resolveWithinRoot(contentRoot, `${slug}.md`);

  if (!isPathInside(contentRoot, detailPath)) {
    throw new LydexError(`Detail slug "${slug}" resolves outside contentDir`);
  }

  if (!fs.existsSync(detailPath)) {
    throw new LydexError(`Detail document not found for slug "${slug}" at ${detailPath}`);
  }

  const raw = fs.readFileSync(detailPath, 'utf8');
  const parsed = parseFrontmatter(raw);

  return {
    slug,
    path: detailPath,
    meta: parsed.meta,
    body: parsed.body,
    bodyHtml: renderMarkdownBody(parsed.body),
  };
}

module.exports = {
  loadDetailDoc,
};

