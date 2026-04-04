const fs = require('node:fs');
const path = require('node:path');

const defaults = require('./defaults.js');
const { validateConfig } = require('./validate-config.js');
const { LydexError } = require('../utils/errors.js');
const { isPathInside } = require('../utils/path-utils.js');
const { loadThemeManifest } = require('../theme/load-theme-manifest.js');
const { resolveThemeAssets } = require('../theme/resolve-theme-assets.js');

function resolvePathValue(rootDir, value) {
  if (!value) {
    return value;
  }

  return path.isAbsolute(value) ? value : path.resolve(rootDir, value);
}

function resolvePathMap(rootDir, entries = {}) {
  const resolved = {};

  for (const [key, value] of Object.entries(entries)) {
    resolved[key] = resolvePathValue(rootDir, value);
  }

  return resolved;
}

function assertFileExists(filePath, label) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new LydexError(`${label} not found: ${filePath}`);
  }
}

function validateResolvedPaths(config) {
  if (!isPathInside(config.rootDir, config.assetsDir)) {
    throw new LydexError(`assetsDir must stay inside rootDir: ${config.assetsDir}`);
  }

  for (const [templateKey, templatePath] of Object.entries(config.templates)) {
    assertFileExists(templatePath, `Template "${templateKey}"`);
  }

  for (const [templateKey, templatePath] of Object.entries(config.queryTemplates)) {
    assertFileExists(templatePath, `Query template "${templateKey}"`);
  }

  if (!fs.existsSync(config.theme.directory) || !fs.statSync(config.theme.directory).isDirectory()) {
    throw new LydexError(`Theme directory not found: ${config.theme.directory}`);
  }

  if (!config.theme.stylesheetPaths || !config.theme.stylesheetPaths.length) {
    throw new LydexError(`Theme styles not found in directory: ${config.theme.directory}`);
  }
}

function validateTemplateKeys(config) {
  if (!config.templates.pageShell) {
    throw new LydexError('Missing required template key: pageShell');
  }

  for (const [blockKey, blockConfig] of Object.entries(config.blocks)) {
    if (!config.templates[blockConfig.template]) {
      throw new LydexError(`config.blocks.${blockKey}.template references unknown template key "${blockConfig.template}"`);
    }

    if (blockConfig.hasDetailPage && !config.templates[blockConfig.detailTemplate]) {
      throw new LydexError(`config.blocks.${blockKey}.detailTemplate references unknown detail template key "${blockConfig.detailTemplate}"`);
    }
  }
}

function loadConfig(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const configPath = path.resolve(rootDir, options.config || 'lydex.config.js');
  delete require.cache[configPath];
  const userConfig = require(configPath);
  const userThemeOverrides = userConfig.theme || {};
  const provisionalThemeDirectory = resolvePathValue(
    rootDir,
    userThemeOverrides.directory || defaults.theme.directory
  );
  const themeManifest = loadThemeManifest(provisionalThemeDirectory) || {};

  const config = {
    ...defaults,
    ...userConfig,
    theme: {
      ...defaults.theme,
      ...themeManifest,
      ...userThemeOverrides,
    },
    templates: {
      ...defaults.templates,
      ...(userConfig.templates || {}),
    },
    queryTemplates: {
      ...defaults.queryTemplates,
      ...(userConfig.queryTemplates || {}),
    },
    rootDir,
    configPath,
  };

  validateConfig(config);
  validateTemplateKeys(config);

  config.assetsDir = resolvePathValue(rootDir, config.assetsDir);
  config.theme = {
    ...config.theme,
    directory: resolvePathValue(rootDir, config.theme.directory),
    manifestPath: themeManifest.path || null,
  };
  config.theme = resolveThemeAssets(config.theme);
  config.templates = resolvePathMap(rootDir, config.templates);
  config.queryTemplates = resolvePathMap(rootDir, config.queryTemplates);
  validateResolvedPaths(config);

  return config;
}

module.exports = {
  loadConfig,
};

