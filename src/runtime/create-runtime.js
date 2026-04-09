const { loadConfig } = require('../config/load-config.js');
const { buildContentIndex } = require('../content/build-content-index.js');
const { compileTailwindCss } = require('../theme/compile-tailwind-css.js');
const { validateRouteConflicts } = require('./validate-route-conflicts.js');

function createRuntime(options = {}, locals = null, preloadedConfig = null) {
  const config = preloadedConfig || compileTailwindCss(loadConfig(options));
  validateRouteConflicts(config);
  const index = buildContentIndex(config);

  const runtime = { config, index, locals };
  if (locals) {
    locals.config = config;
    locals.index = index;
  }

  return runtime;
}

module.exports = {
  createRuntime,
};
