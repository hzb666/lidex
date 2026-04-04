const fs = require('node:fs');
const path = require('node:path');

const { loadConfig } = require('../config/load-config.js');
const { synchronizeManagedContent } = require('../content/managed-content.js');
const { createRuntime } = require('../runtime/create-runtime.js');
const { renderMarkdownBody } = require('../content/render-markdown-body.js');
const { loadTemplate } = require('../render/load-template.js');
const { renderPage } = require('../render/render-page.js');
const { renderDetailPage } = require('../render/render-detail-page.js');
const { buildThemeContext } = require('../theme/build-theme-context.js');
const { buildPageHeaderHtml, renderPageNodes, stripBlockSections } = require('../server/register-page-routes.js');
const { buildDetailContext } = require('../server/register-detail-routes.js');
const { isPathInside } = require('../utils/path-utils.js');
const { LydexError } = require('../utils/errors.js');

function resolveOutDir(rootDir, outDir) {
  return path.resolve(rootDir, outDir || 'dist');
}

function ensureSafeOutputDirectory(rootDir, outDir) {
  if (outDir === rootDir) {
    throw new LydexError('Build output directory must not be the project root');
  }

  if (rootDir.startsWith(outDir + path.sep)) {
    throw new LydexError('Build output directory must not contain the project root');
  }

  const parentDir = path.dirname(outDir);
  if (!isPathInside(parentDir, outDir)) {
    throw new LydexError(`Invalid build output directory: ${outDir}`);
  }
}

function routeToHtmlPath(outDir, route) {
  const normalized = String(route || '/').replace(/^\/+|\/+$/g, '');
  if (!normalized) {
    return path.join(outDir, 'index.html');
  }

  return path.join(outDir, normalized, 'index.html');
}

function writeHtmlFile(filePath, html) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html, 'utf8');
}

function buildPageHtml(page, runtime, shellTemplate) {
  const bodyHtml = renderMarkdownBody(stripBlockSections(page.body, page.nodes));
  const nodesHtml = renderPageNodes(page, runtime);

  return renderPage({
    shellTemplate,
    context: {
      ...(runtime.config.site || {}),
      ...page.meta,
      title: page.meta.title || page.key,
      pageKey: page.key,
      pageRoute: page.route,
      ...buildThemeContext(runtime.config.theme),
      pageHeaderHtml: buildPageHeaderHtml({
        pageKey: page.key,
        pageRoute: page.route,
        title: page.meta.title || page.key,
        eyebrow: page.meta.eyebrow,
        lead: page.meta.lead,
        heroImage: page.meta.heroImage,
        heroAlt: page.meta.heroAlt,
        showHero: page.meta.showHero,
      }),
      contentHtml: `${bodyHtml}${nodesHtml}`,
    },
  });
}

function buildDetailHtml(item, runtime, shellTemplate, detailTemplate) {
  const context = buildDetailContext(item, runtime);

  return renderDetailPage({
    shellTemplate,
    detailTemplate,
    context: {
      ...(runtime.config.site || {}),
      ...context,
      ...buildThemeContext(runtime.config.theme),
      pageHeaderHtml: buildPageHeaderHtml({
        pageKey: context.pageKey,
        pageRoute: context.pageRoute,
        title: context.title,
        eyebrow: context.eyebrow,
        lead: context.lead,
        heroImage: context.heroImage,
        heroAlt: context.heroAlt,
        showHero: true,
        eyebrowActionsHtml: context.eyebrowActionsHtml,
      }),
    },
  });
}

function copyDirectoryIfExists(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    return;
  }

  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

function buildSite(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const outDir = resolveOutDir(rootDir, options.outDir);
  ensureSafeOutputDirectory(rootDir, outDir);

  const config = loadConfig(options);
  synchronizeManagedContent(config, {
    mode: 'build',
    confirmCleanup: options.confirmCleanup,
  });
  const runtime = createRuntime(options);
  const shellTemplate = loadTemplate(runtime.config.templates.pageShell);
  const routes = [];

  fs.rmSync(outDir, { force: true, recursive: true });
  fs.mkdirSync(outDir, { recursive: true });

  for (const page of Object.values(runtime.index.pages)) {
    writeHtmlFile(routeToHtmlPath(outDir, page.route), buildPageHtml(page, runtime, shellTemplate));
    routes.push(page.route);
  }

  for (const [blockName, blockConfig] of Object.entries(runtime.config.blocks)) {
    if (!blockConfig.hasDetailPage) {
      continue;
    }

    const detailTemplate = loadTemplate(runtime.config.templates[blockConfig.detailTemplate]);
    for (const item of runtime.index.blocks[blockName] || []) {
      if (!item.detail) {
        continue;
      }

      const detailRoute = item.detailRouteTemplate.replace(':slug', item.detail.slug);
      writeHtmlFile(routeToHtmlPath(outDir, detailRoute), buildDetailHtml(item, runtime, shellTemplate, detailTemplate));
      routes.push(detailRoute);
    }
  }

  copyDirectoryIfExists(runtime.config.assetsDir, path.join(outDir, 'assets'));
  copyDirectoryIfExists(
    runtime.config.theme.directory,
    path.join(outDir, runtime.config.theme.mountPath.replace(/^\/+/, '').replace(/\//g, path.sep))
  );

  return {
    outDir,
    routes,
  };
}

module.exports = {
  buildSite,
};

