const fs = require('node:fs');

const { LidexError } = require('../utils/errors.js');
const { renderMarkdownBody } = require('./render-markdown-body.js');
const { isPathInside, resolveWithinRoot } = require('../utils/path-utils.js');
const { parseFrontmatter } = require('./parse-frontmatter.js');
const { appendSourceLocation } = require('./source-location.js');

function loadDetailDoc(config, blockConfig, slug, options = {}) {
  const { source } = options;

  if (/[\\/]/.test(slug) || slug.includes('..')) {
    throw new LidexError(
      appendSourceLocation(
        `Detail slug "${slug}" must not contain path separators or ".." segments`,
        config.rootDir,
        source,
        'referenced from',
      ),
    );
  }

  const contentRoot = resolveWithinRoot(config.rootDir, blockConfig.contentDir);
  const detailPath = resolveWithinRoot(contentRoot, `${slug}.md`);

  if (!isPathInside(contentRoot, detailPath)) {
    throw new LidexError(
      appendSourceLocation(
        `Detail slug "${slug}" resolves outside contentDir`,
        config.rootDir,
        source,
        'referenced from',
      ),
    );
  }

  if (!fs.existsSync(detailPath)) {
    throw new LidexError(
      appendSourceLocation(
        `Detail document not found for slug "${slug}" at ${detailPath}`,
        config.rootDir,
        source,
        'referenced from',
      ),
    );
  }

  const raw = fs.readFileSync(detailPath, 'utf8');
  const parsed = parseFrontmatter(raw);

  return {
    slug,
    path: detailPath,
    meta: parsed.meta,
    body: parsed.body,
    bodyHtml: renderMarkdownBody(parsed.body, {
      rootDir: config.rootDir,
      filePath: detailPath,
      lineOffset: Math.max(0, (parsed.bodyStartLine || 1) - 1),
    }),
  };
}

module.exports = {
  loadDetailDoc,
};

