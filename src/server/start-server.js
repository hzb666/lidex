const fs = require('node:fs');
const path = require('node:path');
const express = require('express');

const { createApp } = require('./create-app.js');
const { normalizeAdminPath } = require('./register-admin-routes.js');

const RELOAD_POLL_INTERVAL_MS = 500;
const RELOAD_DEBOUNCE_MS = 120;

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

  console.log(`[lidex] root: ${rootDir}`);
  console.log(`[lidex] config: ${configPath}`);
  console.log(`[lidex] listening: ${formatUrl(localHost, port)}`);

  if (adminEnabled.enabled) {
    console.log(`[lidex] admin: ${formatUrl(localHost, port, adminPath)}`);
  } else {
    console.log('[lidex] admin: disabled');
  }
}

function createServerOptions(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  return {
    ...options,
    port: options.port ?? 3001,
    host: options.host || '127.0.0.1',
    rootDir,
    configPath: path.resolve(rootDir, options.config || 'lidex.config.js'),
  };
}

function listenApp(app, options) {
  return app.listen(options.port, options.host, () => {
    logStartup({
      host: options.host,
      port: options.port,
      rootDir: options.rootDir,
      configPath: options.configPath,
      adminEnabled: {
        enabled: Boolean(options.adminPassword),
        path: options.adminPath,
      },
    });
  });
}

function createReloadBridgeApp(options, reloadState) {
  const bridgeApp = express();
  const bridgeState = {
    currentApp: createApp({
      ...options,
      reload: true,
      reloadState,
    }),
    clients: new Set(),
  };

  bridgeApp.get('/__lidex/events', (req, res) => {
    res.set({
      'Cache-Control': 'no-store',
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders && res.flushHeaders();
    res.write('retry: 600\n\n');
    bridgeState.clients.add(res);

    req.on('close', () => {
      bridgeState.clients.delete(res);
    });
  });

  bridgeApp.get('/__lidex/reload', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({
      version: reloadState.version,
    });
  });

  bridgeApp.use((req, res, next) => bridgeState.currentApp(req, res, next));

  function swapApp(nextApp) {
    bridgeState.currentApp = nextApp;
  }

  function broadcastReload() {
    const payload = `event: reload\ndata: ${JSON.stringify({ version: reloadState.version })}\n\n`;
    for (const client of bridgeState.clients) {
      client.write(payload);
    }
  }

  function close() {
    for (const client of bridgeState.clients) {
      client.end();
    }
    bridgeState.clients.clear();
  }

  return {
    app: bridgeApp,
    broadcastReload,
    close,
    getCurrentApp() {
      return bridgeState.currentApp;
    },
    swapApp,
  };
}

function resolveReloadTargets(app, options) {
  const config = app.locals.__lidex && app.locals.__lidex.config
    ? app.locals.__lidex.config
    : null;
  const rootDir = options.rootDir;
  const targets = new Set([
    options.configPath,
    path.resolve(rootDir, 'content'),
    path.resolve(rootDir, 'templates'),
    path.resolve(rootDir, 'assets'),
  ]);

  if (!config) {
    return [...targets];
  }

  targets.add(config.assetsDir);
  targets.add(config.theme.directory);

  for (const templatePath of Object.values(config.templates || {})) {
    targets.add(path.dirname(templatePath));
  }

  for (const templatePath of Object.values(config.queryTemplates || {})) {
    targets.add(path.dirname(templatePath));
  }

  for (const pageConfig of Object.values(config.pages || {})) {
    if (!pageConfig.source) {
      continue;
    }

    targets.add(path.dirname(path.resolve(rootDir, pageConfig.source)));
  }

  for (const blockConfig of Object.values(config.blocks || {})) {
    if (!blockConfig.contentDir) {
      continue;
    }

    targets.add(path.resolve(rootDir, blockConfig.contentDir));
  }

  return [...targets];
}

function buildWatchEntries(paths = []) {
  const entries = new Map();
  const sortedPaths = [...new Set(paths.filter(Boolean))].sort((left, right) => left.localeCompare(right));

  for (const targetPath of sortedPaths) {
    let watchPath = targetPath;
    let recursive = false;

    try {
      const stat = fs.statSync(targetPath);
      recursive = stat.isDirectory();
    } catch (error) {
      watchPath = path.dirname(targetPath);
      if (!watchPath || watchPath === targetPath || !fs.existsSync(watchPath)) {
        continue;
      }
      recursive = true;
    }

    const existing = entries.get(watchPath);
    entries.set(watchPath, existing ? existing || recursive : recursive);
  }

  return [...entries.entries()].map(([watchPath, recursive]) => ({ watchPath, recursive }));
}

function scanTarget(entries, targetPath) {
  let stat = null;
  try {
    stat = fs.statSync(targetPath);
  } catch (error) {
    entries.set(targetPath, 'missing');
    return;
  }

  if (!stat.isDirectory()) {
    entries.set(targetPath, `file:${stat.size}:${stat.mtimeMs}`);
    return;
  }

  entries.set(targetPath, `dir:${stat.mtimeMs}`);

  const children = fs.readdirSync(targetPath, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name));

  for (const child of children) {
    scanTarget(entries, path.join(targetPath, child.name));
  }
}

function createSnapshot(paths = []) {
  const entries = new Map();
  const uniquePaths = [...new Set(paths.filter(Boolean))].sort((left, right) => left.localeCompare(right));

  for (const targetPath of uniquePaths) {
    scanTarget(entries, targetPath);
  }

  return entries;
}

function snapshotsEqual(left, right) {
  if (left.size !== right.size) {
    return false;
  }

  for (const [key, value] of left.entries()) {
    if (right.get(key) !== value) {
      return false;
    }
  }

  return true;
}

function closeWatcher(watcher) {
  if (!watcher || typeof watcher.close !== 'function') {
    return;
  }

  try {
    watcher.close();
  } catch (error) {
    // Ignore close errors from stale watchers.
  }
}

function createReloadMonitor({ getTargets, onChange }) {
  const state = {
    closed: false,
    debounceTimer: null,
    interval: null,
    watchers: [],
  };

  function clearWatchers() {
    for (const watcher of state.watchers) {
      closeWatcher(watcher);
    }
    state.watchers = [];
  }

  function clearPolling() {
    if (state.interval) {
      clearInterval(state.interval);
      state.interval = null;
    }
  }

  function triggerReload() {
    if (state.closed) {
      return;
    }

    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(() => {
      void onChange();
    }, RELOAD_DEBOUNCE_MS);
  }

  function refresh() {
    if (state.closed) {
      return;
    }

    clearWatchers();
    clearPolling();

    const watchEntries = buildWatchEntries(getTargets());
    let watchSupported = watchEntries.length > 0;

    for (const entry of watchEntries) {
      try {
        const watcher = entry.recursive
          ? fs.watch(entry.watchPath, { recursive: true }, triggerReload)
          : fs.watch(entry.watchPath, triggerReload);
        watcher.on('error', triggerReload);
        state.watchers.push(watcher);
      } catch (error) {
        watchSupported = false;
        break;
      }
    }

    if (!watchSupported) {
      clearWatchers();
      state.interval = setInterval(() => {
        void onChange();
      }, RELOAD_POLL_INTERVAL_MS);
    }
  }

  refresh();

  return {
    close() {
      state.closed = true;
      clearTimeout(state.debounceTimer);
      clearWatchers();
      clearPolling();
    },
    refresh,
  };
}

function startReloadServer(options = {}) {
  const serverOptions = createServerOptions(options);
  const reloadState = {
    version: 0,
  };
  const bridge = createReloadBridgeApp(serverOptions, reloadState);
  let currentApp = bridge.getCurrentApp();
  let currentSnapshot = createSnapshot(resolveReloadTargets(currentApp, serverOptions));
  let restarting = false;
  let closed = false;
  let server = null;

  function emitReloadError(error) {
    if (!error) {
      return;
    }

    if (server && server.listenerCount('reloadError') > 0) {
      server.emit('reloadError', error);
    }

    const message = error && error.message ? error.message : String(error);
    console.error(`[lidex] reload error: ${message}`);
  }

  async function reloadApp() {
    if (restarting || closed) {
      return;
    }

    const observedSnapshot = createSnapshot(resolveReloadTargets(currentApp, serverOptions));
    if (snapshotsEqual(currentSnapshot, observedSnapshot)) {
      return;
    }

    restarting = true;
    try {
      const nextApp = createApp({
        ...serverOptions,
        reload: true,
        reloadState,
      });
      bridge.swapApp(nextApp);
      currentApp = nextApp;
      currentSnapshot = createSnapshot(resolveReloadTargets(nextApp, serverOptions));
      reloadState.version += 1;
      bridge.broadcastReload();
      monitor.refresh();
      console.log(`[lidex] reload: version ${reloadState.version}`);
    } catch (error) {
      emitReloadError(error);
    } finally {
      restarting = false;
    }
  }

  const monitor = createReloadMonitor({
    getTargets() {
      return resolveReloadTargets(currentApp, serverOptions);
    },
    onChange: reloadApp,
  });

  server = listenApp(bridge.app, serverOptions);
  const originalClose = server.close.bind(server);
  server.close = (callback) => {
    closed = true;
    monitor.close();
    bridge.close();
    return originalClose(callback);
  };
  server.on('close', () => {
    closed = true;
    monitor.close();
    bridge.close();
  });

  return server;
}

function startServer(options = {}) {
  if (options.reload) {
    return startReloadServer(options);
  }

  const serverOptions = createServerOptions(options);
  const app = createApp(serverOptions);
  return listenApp(app, serverOptions);
}

module.exports = {
  createServerOptions,
  formatUrl,
  getReadableHost,
  logStartup,
  startReloadServer,
  startServer,
};

