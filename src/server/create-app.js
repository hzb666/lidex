const fs = require('node:fs');
const path = require('node:path');
const express = require('express');

const { loadConfig } = require('../config/load-config.js');
const { createRuntime } = require('../runtime/create-runtime.js');
const { synchronizeManagedContent } = require('../content/managed-content.js');
const { compileTailwindCss } = require('../theme/compile-tailwind-css.js');
const { registerAdminRoutes } = require('./register-admin-routes.js');
const { registerPageRoutes } = require('./register-page-routes.js');
const { registerDetailRoutes } = require('./register-detail-routes.js');
const { registerSeoRoutes } = require('./register-seo-routes.js');
const { LidexError } = require('../utils/errors.js');

function createApp(options = {}) {
  const app = express();
  app.locals.__lidex = {
    options,
    reloadState: options.reloadState || null,
  };
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const configPath = path.resolve(rootDir, options.config || 'lidex.config.js');

  if (!fs.existsSync(configPath)) {
    throw new LidexError(`Config file not found: ${configPath}`);
  }

  const config = compileTailwindCss(loadConfig(options));
  synchronizeManagedContent(config, {
    mode: 'preview',
    confirmCleanup: options.confirmCleanup,
  });
  const runtime = createRuntime(options, app.locals.__lidex, config);
  const { config: runtimeConfig } = runtime;

  app.use(express.json({ limit: '1mb' }));
  app.use(express.text({ limit: '1mb', type: ['text/plain', 'text/markdown', 'text/*'] }));

  if (options.reload && options.reloadState) {
    app.get('/__lidex/reload', (req, res) => {
      res.set('Cache-Control', 'no-store');
      res.json({
        version: options.reloadState.version,
      });
    });
  }

  if (fs.existsSync(runtimeConfig.theme.directory)) {
    app.use(runtimeConfig.theme.mountPath, express.static(runtimeConfig.theme.directory));
  }

  if (fs.existsSync(runtimeConfig.assetsDir)) {
    app.use('/assets', express.static(runtimeConfig.assetsDir));
  }
  registerSeoRoutes(app, runtime, options);
  registerPageRoutes(app, runtime);
  registerDetailRoutes(app, runtime);
  registerAdminRoutes(app, runtime, options);

  return app;
}

module.exports = {
  createApp,
};

