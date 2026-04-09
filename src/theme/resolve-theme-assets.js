const fs = require('node:fs');
const path = require('node:path');

const LEGACY_SITE_CSS = 'site.css';

function fileExists(filePath) {
  return Boolean(filePath) && fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function resolveThemeAssetPath(themeDirectory, value) {
  if (!value) {
    return null;
  }

  return path.isAbsolute(value) ? value : path.resolve(themeDirectory, value);
}

function resolveThemeAssets(themeConfig) {
  const themeDirectory = themeConfig.directory;
  const baseCssPath = resolveThemeAssetPath(themeDirectory, themeConfig.baseCss);
  const componentsCssPath = resolveThemeAssetPath(themeDirectory, themeConfig.componentsCss);
  const appJsPath = resolveThemeAssetPath(themeDirectory, themeConfig.appJs);
  const legacySiteCssPath = resolveThemeAssetPath(themeDirectory, LEGACY_SITE_CSS);
  const tailwindOutputPath = resolveThemeAssetPath(themeDirectory, themeConfig.tailwindOutputPath);

  const stylesheetPaths = [];
  if (fileExists(baseCssPath)) {
    stylesheetPaths.push(baseCssPath);
  }

  if (fileExists(componentsCssPath)) {
    stylesheetPaths.push(componentsCssPath);
  }

  if (themeConfig.tailwindEnabled && fileExists(tailwindOutputPath)) {
    stylesheetPaths.push(tailwindOutputPath);
  }

  if (!stylesheetPaths.length && fileExists(legacySiteCssPath)) {
    stylesheetPaths.push(legacySiteCssPath);
  }

  return {
    ...themeConfig,
    stylesheetPaths,
    legacySiteCssPath: fileExists(legacySiteCssPath) ? legacySiteCssPath : null,
    appJsPath: fileExists(appJsPath) ? appJsPath : null,
    tailwindOutputPath,
  };
}

module.exports = {
  LEGACY_SITE_CSS,
  resolveThemeAssetPath,
  resolveThemeAssets,
};
