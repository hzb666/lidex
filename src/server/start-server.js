const path = require('node:path');

const { createApp } = require('./create-app.js');
const { normalizeAdminPath } = require('./register-admin-routes.js');

function formatUrl(host, port, pathname = '/') {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `http://${host}:${port}${normalizedPath}`;
}

function getReadableHost(host) {
  if (host === '0.0.0.0' || host === '::') {
    return '127.0.0.1';
  }

  return host;
}

function logStartup({ host, port, rootDir, configPath, adminEnabled }) {
  const localHost = getReadableHost(host);
  const adminPath = normalizeAdminPath(adminEnabled.path);

  console.log(`[lydex] root: ${rootDir}`);
  console.log(`[lydex] config: ${configPath}`);
  console.log(`[lydex] listening: ${formatUrl(localHost, port)}`);

  if (adminEnabled.enabled) {
    console.log(`[lydex] admin: ${formatUrl(localHost, port, adminPath)}`);
  } else {
    console.log('[lydex] admin: disabled');
  }
}

function startServer(options = {}) {
  const { port = 3001, host = '127.0.0.1' } = options;
  const rootDir = options.rootDir || process.cwd();
  const resolvedRootDir = path.resolve(rootDir);
  const configPath = path.resolve(resolvedRootDir, options.config || 'lydex.config.js');
  const app = createApp({
    ...options,
    rootDir,
  });

  return app.listen(port, host, () => {
    logStartup({
      host,
      port,
      rootDir: resolvedRootDir,
      configPath,
      adminEnabled: {
        enabled: Boolean(options.adminPassword),
        path: options.adminPath,
      },
    });
  });
}

module.exports = {
  formatUrl,
  getReadableHost,
  logStartup,
  startServer,
};

