const fs = require('node:fs');
const path = require('node:path');

const { LidexError } = require('../utils/errors.js');
const { resolveWithinRoot } = require('../utils/path-utils.js');
const { loadPages } = require('./load-pages.js');
const { writeManagedContentMetadata } = require('./managed-metadata.js');
const { parseFrontmatter } = require('./parse-frontmatter.js');
const { generateManagedId, getDetailSlugInfo } = require('./detail-slug.js');

const COVER_BASENAMES = ['cover'];
const COVER_EXTENSIONS = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'avif'];

function toPosixPath(value) {
  return String(value || '').replace(/\\/g, '/');
}

function buildAssetUrl(...parts) {
  const normalized = parts
    .flat()
    .map((part) => toPosixPath(part).replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');

  return normalized ? `/assets/${normalized}` : '/assets';
}

function buildPageSlug(rootDir, page) {
  const relative = toPosixPath(path.relative(rootDir, page.sourcePath));
  const contentRelative = relative.startsWith('content/') ? relative.slice('content/'.length) : path.basename(relative);
  return contentRelative.replace(/\.md$/i, '');
}

function findCoverImage(config, relativeParts) {
  for (const basename of COVER_BASENAMES) {
    for (const extension of COVER_EXTENSIONS) {
      const relativePath = path.join(...relativeParts, `${basename}.${extension}`);
      const absolutePath = resolveWithinRoot(config.assetsDir, relativePath);
      if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
        return buildAssetUrl(relativePath);
      }
    }
  }

  return '';
}

function ensureDirectory(directoryPath, createdDirectories) {
  if (fs.existsSync(directoryPath)) {
    return;
  }

  fs.mkdirSync(directoryPath, { recursive: true });
  createdDirectories.push(directoryPath);
}

function listManagedMarkdownFiles(directoryPath) {
  if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) {
    return [];
  }

  return fs.readdirSync(directoryPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map((entry) => path.join(directoryPath, entry.name));
}

function listManagedAssetEntries(directoryPath) {
  if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) {
    return [];
  }

  return fs.readdirSync(directoryPath, { withFileTypes: true }).map((entry) => ({
    absolutePath: path.join(directoryPath, entry.name),
    type: entry.isDirectory() ? 'directory' : 'file',
    name: entry.name,
  }));
}

function splitRawMarkdown(raw = '') {
  const normalized = String(raw || '').replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    return {
      head: '',
      body: normalized,
    };
  }

  const end = normalized.indexOf('\n---\n', 4);
  if (end === -1) {
    return {
      head: '',
      body: normalized,
    };
  }

  return {
    head: normalized.slice(0, end + 5),
    body: normalized.slice(end + 5),
  };
}

function buildFrontmatterDocument(meta, body = '') {
  const entries = Object.entries(meta);
  const frontmatter = entries.length
    ? `---\n${entries.map(([key, value]) => `${key}: ${value}`).join('\n')}\n---`
    : '';
  const normalizedBody = String(body || '').replace(/\r\n/g, '\n').replace(/^\n+/, '');

  if (!frontmatter) {
    return normalizedBody;
  }

  return normalizedBody ? `${frontmatter}\n\n${normalizedBody}` : `${frontmatter}\n`;
}

function rewritePageWithManagedIds(page, managedIdWrites) {
  if (!managedIdWrites.length) {
    return;
  }

  const raw = fs.readFileSync(page.sourcePath, 'utf8');
  const { head, body } = splitRawMarkdown(raw);
  const bodyLines = String(body || '').replace(/\r/g, '').split('\n');
  const writesByStartLine = new Map(managedIdWrites.map((entry) => [entry.node.source.startLine, entry.id]));

  const targetNodes = page.nodes
    .filter((node) => writesByStartLine.has(node.source.startLine))
    .sort((left, right) => right.source.startLine - left.source.startLine);

  for (const node of targetNodes) {
    bodyLines.splice(node.source.startLine, 0, `_id_: ${writesByStartLine.get(node.source.startLine)}`);
  }

  fs.writeFileSync(page.sourcePath, `${head}${bodyLines.join('\n')}`, 'utf8');
}

function writeDetailDocument(filePath, meta, body, createdFiles) {
  const existed = fs.existsSync(filePath);
  const nextContent = buildFrontmatterDocument(meta, body);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, nextContent, 'utf8');

  if (!existed) {
    createdFiles.push(filePath);
  }
}

function readDetailDocument(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = parseFrontmatter(raw);
  return {
    path: filePath,
    slug: path.basename(filePath, '.md'),
    raw,
    meta: parsed.meta,
    body: parsed.body,
  };
}

function renameManagedPath(fromPath, toPath) {
  if (fromPath === toPath || !fs.existsSync(fromPath)) {
    return;
  }

  if (fs.existsSync(toPath)) {
    throw new LidexError(`Managed path rename target already exists: ${toPath}`);
  }

  fs.mkdirSync(path.dirname(toPath), { recursive: true });
  fs.renameSync(fromPath, toPath);
}

function collectManagedContent(config) {
  const pages = loadPages(config);
  const detailEntriesByBlock = {};
  const referencedPageAssetDirectories = new Set();

  for (const page of Object.values(pages)) {
    page.pageSlug = buildPageSlug(config.rootDir, page);
    page.assetDirectory = path.join(config.assetsDir, '_pages_', page.pageSlug);
    page.assetDirectoryUrl = buildAssetUrl('_pages_', page.pageSlug);
    referencedPageAssetDirectories.add(page.assetDirectory);

    if (!page.meta.heroImage) {
      const pageCoverImage = findCoverImage(config, ['_pages_', page.pageSlug]);
      if (pageCoverImage) {
        page.meta.heroImage = pageCoverImage;
      }
    }

    for (const node of page.nodes) {
      if (node.type !== 'block') {
        continue;
      }

      const blockConfig = config.blocks[node.name];
      if (!blockConfig || !blockConfig.hasDetailPage) {
        continue;
      }

      const detailInfo = getDetailSlugInfo(node, blockConfig);
      const contentRoot = resolveWithinRoot(config.rootDir, blockConfig.contentDir);
      const managedModel = blockConfig.slugField === '_slug_' || Boolean(node.fields._id_) || Boolean(node.fields._slug_);
      const hadManagedId = Boolean(node.fields._id_);
      const managedId = managedModel ? (node.fields._id_ || generateManagedId()) : null;
      const assetDirectory = path.join(config.assetsDir, node.name, detailInfo.slug);
      const assetDirectoryUrl = buildAssetUrl(node.name, detailInfo.slug);
      const coverImage = findCoverImage(config, [node.name, detailInfo.slug]);

      if (!detailEntriesByBlock[node.name]) {
        detailEntriesByBlock[node.name] = [];
      }

      if (detailEntriesByBlock[node.name].some((entry) => entry.slug === detailInfo.slug)) {
        throw new LidexError(`Duplicate detail slug "${detailInfo.slug}" found in block type "${node.name}"`);
      }

      if (managedId && detailEntriesByBlock[node.name].some((entry) => entry.managedId === managedId)) {
        throw new LidexError(`Duplicate detail _id_ "${managedId}" found in block type "${node.name}"`);
      }

      if (managedId) {
        node.fields._id_ = managedId;
      }
      if (detailInfo.explicit || blockConfig.slugField === '_slug_') {
        node.fields._slug_ = detailInfo.slug;
      }

      node.detailSlug = detailInfo.slug;
      node.detailSourceField = detailInfo.sourceField;
      node.detailSourceValue = detailInfo.sourceValue;
      node.detailPath = resolveWithinRoot(contentRoot, `${detailInfo.slug}.md`);
      node.assetDirectory = assetDirectory;
      node.assetDirectoryUrl = assetDirectoryUrl;
      node.coverImage = node.fields.coverImage || coverImage || '';
      node.heroImage = node.fields.heroImage || node.coverImage || '';
      node.managedId = managedId;
      node.hadManagedId = hadManagedId;
      node.usesManagedIdentifiers = managedModel;

      detailEntriesByBlock[node.name].push({
        page,
        node,
        slug: detailInfo.slug,
        managedId,
        detailPath: node.detailPath,
        assetDirectory,
        assetDirectoryUrl,
        coverImage,
      });
    }
  }

  return {
    pages,
    detailEntriesByBlock,
    referencedPageAssetDirectories,
  };
}

function scanDetailDocuments(contentRoot) {
  const docs = listManagedMarkdownFiles(contentRoot).map(readDetailDocument);
  const docsById = new Map();
  const docsBySlug = new Map();

  for (const doc of docs) {
    if (doc.meta._id_) {
      if (docsById.has(doc.meta._id_)) {
        throw new LidexError(`Duplicate managed detail _id_ "${doc.meta._id_}" found in ${contentRoot}`);
      }
      docsById.set(doc.meta._id_, doc);
    }

    docsBySlug.set(doc.slug, doc);
  }

  return {
    docsById,
    docsBySlug,
  };
}

function synchronizeBlockEntries(config, blockName, entries, report, pageIdWrites) {
  const blockConfig = config.blocks[blockName];
  const contentRoot = resolveWithinRoot(config.rootDir, blockConfig.contentDir);
  const assetRoot = path.join(config.assetsDir, blockName);
  const scannedDocs = scanDetailDocuments(contentRoot);
  const expectedDetailPaths = new Set();
  const expectedAssetDirectories = new Set();

  for (const entry of entries) {
    let managedId = entry.managedId;
    const existingBySlug = scannedDocs.docsBySlug.get(entry.slug);

    if (entry.node.usesManagedIdentifiers && !entry.node.hadManagedId && existingBySlug && existingBySlug.meta._id_) {
      managedId = existingBySlug.meta._id_;
      entry.node.fields._id_ = managedId;
      entry.node.managedId = managedId;
    }

    if (entry.node.usesManagedIdentifiers) {
      if (!pageIdWrites.has(entry.page.sourcePath)) {
        pageIdWrites.set(entry.page.sourcePath, []);
      }
      if (!entry.node.hadManagedId || entry.node.fields._id_ !== managedId) {
        pageIdWrites.get(entry.page.sourcePath).push({ node: entry.node, id: managedId });
        entry.node.fields._id_ = managedId;
        entry.node.managedId = managedId;
      }
    }

    const matchedDoc = (managedId ? scannedDocs.docsById.get(managedId) : null) || existingBySlug || null;
    const targetDetailPath = entry.detailPath;
    const targetAssetDirectory = entry.assetDirectory;

    if (matchedDoc && matchedDoc.path !== targetDetailPath) {
      renameManagedPath(matchedDoc.path, targetDetailPath);

      const previousAssetDirectory = path.join(config.assetsDir, blockName, matchedDoc.slug);
      if (previousAssetDirectory !== targetAssetDirectory && fs.existsSync(previousAssetDirectory)) {
        renameManagedPath(previousAssetDirectory, targetAssetDirectory);
      }
    }

    ensureDirectory(targetAssetDirectory, report.createdDirectories);

    const currentDoc = fs.existsSync(targetDetailPath)
      ? readDetailDocument(targetDetailPath)
      : { meta: {}, body: '' };
    writeDetailDocument(
      targetDetailPath,
      managedId ? {
        ...currentDoc.meta,
        _id_: managedId,
      } : currentDoc.meta,
      currentDoc.body,
      report.createdFiles,
    );

    expectedDetailPaths.add(targetDetailPath);
    expectedAssetDirectories.add(targetAssetDirectory);
  }

  for (const detailPath of listManagedMarkdownFiles(contentRoot)) {
    if (!expectedDetailPaths.has(detailPath)) {
      report.orphanedFiles.push(detailPath);
    }
  }

  for (const entry of listManagedAssetEntries(assetRoot)) {
    if (entry.type === 'directory' && !expectedAssetDirectories.has(entry.absolutePath)) {
      report.orphanedDirectories.push(entry.absolutePath);
    }

    if (entry.type === 'file') {
      report.orphanedFiles.push(entry.absolutePath);
    }
  }
}

function readConfirmationLine() {
  if (!process.stdin || typeof process.stdin.fd !== 'number') {
    return '';
  }

  const chunks = [];
  while (true) {
    const buffer = Buffer.alloc(1);
    const bytesRead = fs.readSync(process.stdin.fd, buffer, 0, 1, null);
    if (bytesRead === 0) {
      break;
    }

    const value = buffer.toString('utf8', 0, bytesRead);
    if (value === '\n' || value === '\r') {
      break;
    }

    chunks.push(value);
  }

  return chunks.join('').trim();
}

function defaultConfirmCleanup(report, mode) {
  if (!report.orphanedFiles.length && !report.orphanedDirectories.length) {
    return false;
  }

  if (!process.stdin || !process.stdin.isTTY || !process.stdout || !process.stdout.isTTY) {
    console.warn(`[lidex] ${mode}: orphaned managed content detected, skipping deletion in non-interactive mode.`);
    return false;
  }

  console.warn(`[lidex] ${mode}: managed content is about to delete these orphaned paths:`);
  for (const entry of report.orphanedFiles) {
    console.warn(`  file: ${entry}`);
  }
  for (const entry of report.orphanedDirectories) {
    console.warn(`  dir:  ${entry}`);
  }
  process.stdout.write('[lidex] Delete these paths now? [y/N] ');
  return /^y(es)?$/i.test(readConfirmationLine());
}

function synchronizeManagedContent(config, options = {}) {
  const {
    mode = 'runtime',
    confirmCleanup = defaultConfirmCleanup,
  } = options;

  const model = collectManagedContent(config);
  const report = {
    mode,
    createdFiles: [],
    createdDirectories: [],
    orphanedFiles: [],
    orphanedDirectories: [],
  };
  const pageIdWrites = new Map();

  for (const page of Object.values(model.pages)) {
    ensureDirectory(page.assetDirectory, report.createdDirectories);
  }

  for (const [blockName, entries] of Object.entries(model.detailEntriesByBlock)) {
    synchronizeBlockEntries(config, blockName, entries, report, pageIdWrites);
  }

  for (const page of Object.values(model.pages)) {
    rewritePageWithManagedIds(page, pageIdWrites.get(page.sourcePath) || []);
  }

  const pagesAssetRoot = path.join(config.assetsDir, '_pages_');
  for (const entry of listManagedAssetEntries(pagesAssetRoot)) {
    if (entry.type === 'directory' && !model.referencedPageAssetDirectories.has(entry.absolutePath)) {
      report.orphanedDirectories.push(entry.absolutePath);
    }
  }

  if ((report.orphanedFiles.length || report.orphanedDirectories.length) && confirmCleanup(report, mode)) {
    for (const filePath of report.orphanedFiles) {
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true });
      }
    }

    for (const directoryPath of report.orphanedDirectories) {
      if (fs.existsSync(directoryPath)) {
        fs.rmSync(directoryPath, { force: true, recursive: true });
      }
    }
  }

  report.metadataPath = writeManagedContentMetadata(config, model, mode);

  return report;
}

module.exports = {
  buildAssetUrl,
  collectManagedContent,
  findCoverImage,
  synchronizeManagedContent,
};

