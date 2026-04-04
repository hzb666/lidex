const path = require('node:path');

function toThemeAssetHref(themeConfig, filePath) {
  const relativePath = path.relative(themeConfig.directory, filePath).split(path.sep).join('/');
  return `${themeConfig.mountPath}/${relativePath}`;
}

function buildThemeContext(themeConfig) {
  const stylesheetHrefs = (themeConfig.stylesheetPaths || []).map((filePath) => toThemeAssetHref(themeConfig, filePath));
  const scriptHref = themeConfig.appJsPath ? toThemeAssetHref(themeConfig, themeConfig.appJsPath) : '';

  return {
    themeCssHref: stylesheetHrefs[0] || '',
    themeStylesheetsHtml: stylesheetHrefs
      .map((href) => `<link rel="stylesheet" href="${href}">`)
      .join(''),
    themeJsSrc: scriptHref,
    themeScriptHtml: scriptHref ? `<script src="${scriptHref}"></script>` : '',
  };
}

module.exports = {
  buildThemeContext,
};
