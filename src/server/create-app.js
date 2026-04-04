const fs = require('node:fs');
const path = require('node:path');
const express = require('express');

const { loadConfig } = require('../config/load-config.js');
const { createRuntime } = require('../runtime/create-runtime.js');
const { synchronizeManagedContent } = require('../content/managed-content.js');
const { registerAdminRoutes } = require('./register-admin-routes.js');
const { registerPageRoutes } = require('./register-page-routes.js');
const { registerDetailRoutes } = require('./register-detail-routes.js');
const { LydexError } = require('../utils/errors.js');

function createApp(options = {}) {
  const app = express();
  app.locals.__lydex = { options };
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const configPath = path.resolve(rootDir, options.config || 'lydex.config.js');

  if (!fs.existsSync(configPath)) {
    throw new LydexError(`Config file not found: ${configPath}`);
  }

  const config = loadConfig(options);
  synchronizeManagedContent(config, {
    mode: 'preview',
    confirmCleanup: options.confirmCleanup,
  });
  const runtime = createRuntime(options, app.locals.__lydex);
  const { config: runtimeConfig } = runtime;

  app.use(express.json({ limit: '1mb' }));
  app.use(express.text({ limit: '1mb', type: ['text/plain', 'text/markdown', 'text/*'] }));

  if (fs.existsSync(runtimeConfig.theme.directory)) {
    app.use(runtimeConfig.theme.mountPath, express.static(runtimeConfig.theme.directory));
  }

  if (fs.existsSync(runtimeConfig.assetsDir)) {
    app.use('/assets', express.static(runtimeConfig.assetsDir));
  }
  registerPageRoutes(app, runtime);
  registerDetailRoutes(app, runtime);
  registerAdminRoutes(app, runtime, options);

  return app;
}

module.exports = {
  createApp,
};

