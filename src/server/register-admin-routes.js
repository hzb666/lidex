const fs = require('node:fs');
const path = require('node:path');

const { buildContentIndex } = require('../content/build-content-index.js');
const { isPathInside, resolveWithinRoot } = require('../utils/path-utils.js');

function normalizeAdminPath(value = '/admin') {
  const raw = String(value || '/admin').trim();
  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  return normalized.replace(/\/+$/, '') || '/admin';
}

function unauthorized(res) {
  res.set('WWW-Authenticate', 'Basic realm="Lidex Admin"');
  res.status(401).send('Authentication required');
}

function parseBasicAuth(header = '') {
  if (!header.startsWith('Basic ')) {
    return null;
  }

  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex === -1) {
    return null;
  }

  return {
    user: decoded.slice(0, separatorIndex),
    password: decoded.slice(separatorIndex + 1),
  };
}

function createAuthMiddleware(options = {}) {
  const adminUser = options.adminUser || 'admin';
  const adminPassword = options.adminPassword;

  return function requireAuth(req, res, next) {
    if (!adminPassword) {
      unauthorized(res);
      return;
    }

    const credentials = parseBasicAuth(req.headers.authorization || '');
    if (!credentials || credentials.user !== adminUser || credentials.password !== adminPassword) {
      unauthorized(res);
      return;
    }

    next();
  };
}

function normalizeRelativePath(requestedPath = '') {
  return String(requestedPath)
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
}

function getRequestedPath(req) {
  if (typeof req.query.path === 'string') {
    return normalizeRelativePath(req.query.path);
  }

  return normalizeRelativePath(req.path);
}

function validateRootRelativePath(rootDir, requestedPath, originalUrl) {
  const normalizedPath = normalizeRelativePath(requestedPath);
  const absolutePath = resolveWithinRoot(rootDir, normalizedPath);
  const decodedUrl = decodeURIComponent(originalUrl || '');

  if (
    !normalizedPath
    || normalizedPath.includes('..')
    || decodedUrl.includes('..')
    || !isPathInside(rootDir, absolutePath)
  ) {
    return null;
  }

  return {
    normalizedPath,
    absolutePath,
  };
}

function isAllowedAdminPath(runtime, normalizedPath) {
  const allowedRoots = ['content'];
  const relativeAssetsDir = normalizeRelativePath(path.relative(runtime.config.rootDir, runtime.config.assetsDir));

  if (relativeAssetsDir && relativeAssetsDir !== '.' && !relativeAssetsDir.startsWith('..')) {
    allowedRoots.push(relativeAssetsDir);
  }

  return allowedRoots.some((allowedRoot) => (
    normalizedPath === allowedRoot || normalizedPath.startsWith(`${allowedRoot}/`)
  ));
}

function listDirectoryEntries(rootDir, directoryPath) {
  const entries = [];

  function walk(currentAbsolutePath, currentRelativePath) {
    const dirents = fs.readdirSync(currentAbsolutePath, { withFileTypes: true });

    for (const dirent of dirents) {
      const entryRelativePath = normalizeRelativePath(path.posix.join(currentRelativePath, dirent.name));
      entries.push({
        path: entryRelativePath,
        type: dirent.isDirectory() ? 'directory' : 'file',
      });

      if (dirent.isDirectory()) {
        walk(path.join(currentAbsolutePath, dirent.name), entryRelativePath);
      }
    }
  }

  walk(directoryPath.absolutePath, directoryPath.normalizedPath);

  return entries.sort((left, right) => left.path.localeCompare(right.path));
}

function readRequestBody(req) {
  if (typeof req.body === 'string') {
    return req.body;
  }

  if (req.body && typeof req.body.content === 'string') {
    return req.body.content;
  }

  return '';
}

function refreshRuntimeIndex(runtime) {
  runtime.index = buildContentIndex(runtime.config);
  if (runtime.locals) {
    runtime.locals.index = runtime.index;
  }
}

function restorePreviousFileState(absolutePath, existed, previousContent) {
  if (existed) {
    fs.writeFileSync(absolutePath, previousContent, 'utf8');
    return;
  }

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}

function registerAdminRoutes(app, runtime, options = {}) {
  const requireAuth = createAuthMiddleware(options);
  const rootDir = runtime.config.rootDir;
  const adminPath = normalizeAdminPath(options.adminPath);
  const adminApiPath = `${adminPath}/api`;

  app.get(adminPath, requireAuth, (req, res) => {
    res.type('html').send('<!doctype html><html><body><h1>Lidex Admin</h1></body></html>');
  });

  app.get(`${adminApiPath}/files`, requireAuth, (req, res) => {
    const requestedDir = normalizeRelativePath(req.query.dir || 'content');
    const resolvedDir = validateRootRelativePath(rootDir, requestedDir, req.originalUrl);

    if (!resolvedDir) {
      res.status(400).send('Invalid path');
      return;
    }

    if (!isAllowedAdminPath(runtime, resolvedDir.normalizedPath)) {
      res.status(403).send('Forbidden');
      return;
    }

    if (!fs.existsSync(resolvedDir.absolutePath) || !fs.statSync(resolvedDir.absolutePath).isDirectory()) {
      res.status(404).send('Not Found');
      return;
    }

    res.json({
      dir: resolvedDir.normalizedPath,
      entries: listDirectoryEntries(rootDir, resolvedDir),
    });
  });

  app.get(`${adminApiPath}/assets`, requireAuth, (req, res) => {
    const relativeAssetsDir = path.relative(rootDir, runtime.config.assetsDir);
    const normalizedAssetsDir = normalizeRelativePath(relativeAssetsDir || 'assets');
    const resolvedDir = validateRootRelativePath(rootDir, normalizedAssetsDir, req.originalUrl);

    if (!resolvedDir || !fs.existsSync(resolvedDir.absolutePath)) {
      res.json({
        dir: normalizedAssetsDir,
        entries: [],
      });
      return;
    }

    res.json({
      dir: resolvedDir.normalizedPath,
      entries: listDirectoryEntries(rootDir, resolvedDir).filter((entry) => entry.type === 'file'),
    });
  });

  app.use(`${adminApiPath}/file`, requireAuth, (req, res) => {
    if (req.method !== 'GET' && req.method !== 'PUT') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const resolvedPath = validateRootRelativePath(rootDir, getRequestedPath(req), req.originalUrl);
    if (!resolvedPath) {
      res.status(400).send('Invalid path');
      return;
    }

    if (!isAllowedAdminPath(runtime, resolvedPath.normalizedPath)) {
      res.status(403).send('Forbidden');
      return;
    }

    if (req.method === 'PUT') {
      const existed = fs.existsSync(resolvedPath.absolutePath);
      const previousContent = existed ? fs.readFileSync(resolvedPath.absolutePath, 'utf8') : '';
      fs.mkdirSync(path.dirname(resolvedPath.absolutePath), { recursive: true });
      fs.writeFileSync(resolvedPath.absolutePath, readRequestBody(req), 'utf8');

      if (resolvedPath.normalizedPath === 'content' || resolvedPath.normalizedPath.startsWith('content/')) {
        try {
          refreshRuntimeIndex(runtime);
        } catch (error) {
          restorePreviousFileState(resolvedPath.absolutePath, existed, previousContent);
          res.status(400).send(error && error.message ? error.message : 'Invalid content update');
          return;
        }
      }

      res.json({
        path: resolvedPath.normalizedPath,
        saved: true,
      });
      return;
    }

    if (!fs.existsSync(resolvedPath.absolutePath)) {
      res.status(404).send('Not Found');
      return;
    }

    res.type('text/plain').send(fs.readFileSync(resolvedPath.absolutePath, 'utf8'));
  });
}

module.exports = {
  normalizeAdminPath,
  registerAdminRoutes,
};

