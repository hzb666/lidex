const fs = require('node:fs');
const path = require('node:path');

const { buildSite } = require('../build/build-site.js');
const { LidexError } = require('../utils/errors.js');

function formatPublishId(date = new Date()) {
  const iso = date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '');
  const millis = String(date.getUTCMilliseconds()).padStart(3, '0');
  return `${iso}${millis}Z`;
}

function resolveTargetDir(rootDir, targetDir) {
  return path.resolve(rootDir, targetDir || 'published');
}

function resolveHistoryDir(rootDir, historyDir) {
  return path.resolve(rootDir, historyDir || path.join('.lidex', 'publish-history'));
}

function readHistoryEntries(historyDir) {
  if (!fs.existsSync(historyDir) || !fs.statSync(historyDir).isDirectory()) {
    return [];
  }

  return fs.readdirSync(historyDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const entryDir = path.join(historyDir, entry.name);
      const metaPath = path.join(entryDir, 'meta.json');
      const siteDir = path.join(entryDir, 'site');

      if (!fs.existsSync(metaPath)) {
        throw new LidexError(`Publish history meta not found: ${entry.name}`);
      }

      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      return {
        ...meta,
        entryDir,
        siteDir,
      };
    })
    .sort((left, right) => String(right.publishId).localeCompare(String(left.publishId)));
}

function copyDirectoryContents(sourceDir, targetDir) {
  fs.rmSync(targetDir, { force: true, recursive: true });
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

function snapshotTarget(targetDir, historyDir, reason, extra = {}) {
  if (!fs.existsSync(targetDir)) {
    return null;
  }

  const publishId = formatPublishId();
  const entryDir = path.join(historyDir, publishId);
  const siteDir = path.join(entryDir, 'site');

  fs.mkdirSync(entryDir, { recursive: true });
  fs.cpSync(targetDir, siteDir, { recursive: true });
  fs.writeFileSync(
    path.join(entryDir, 'meta.json'),
    JSON.stringify({
      publishId,
      reason,
      targetDir,
      createdAt: new Date().toISOString(),
      ...extra,
    }, null, 2),
    'utf8',
  );

  return {
    publishId,
    entryDir,
    siteDir,
  };
}

function publishSite(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const targetDir = resolveTargetDir(rootDir, options.targetDir);
  const historyDir = resolveHistoryDir(rootDir, options.historyDir);
  const buildResult = buildSite({
    ...options,
    rootDir,
    outDir: options.outDir || path.join('.lidex', 'build'),
  });
  const historySnapshot = snapshotTarget(targetDir, historyDir, 'publish');

  copyDirectoryContents(buildResult.outDir, targetDir);

  return {
    ...buildResult,
    targetDir,
    historyDir,
    publishId: historySnapshot ? historySnapshot.publishId : null,
    historyEntryDir: historySnapshot ? historySnapshot.entryDir : null,
  };
}

function rollbackSite(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const targetDir = resolveTargetDir(rootDir, options.targetDir);
  const historyDir = resolveHistoryDir(rootDir, options.historyDir);
  const rollbackId = options.rollbackId;

  if (!rollbackId) {
    throw new LidexError('Missing rollback id');
  }

  const entryDir = path.join(historyDir, rollbackId);
  const siteDir = path.join(entryDir, 'site');
  if (!fs.existsSync(siteDir) || !fs.statSync(siteDir).isDirectory()) {
    throw new LidexError(`Publish history entry not found: ${rollbackId}`);
  }

  const backupSnapshot = snapshotTarget(targetDir, historyDir, 'rollback-backup', { rollbackOf: rollbackId });
  copyDirectoryContents(siteDir, targetDir);

  return {
    rollbackId,
    targetDir,
    historyDir,
    restoredFrom: entryDir,
    backupEntryDir: backupSnapshot ? backupSnapshot.entryDir : null,
  };
}

function listPublishHistory(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const historyDir = resolveHistoryDir(rootDir, options.historyDir);
  const targetDir = options.targetDir ? resolveTargetDir(rootDir, options.targetDir) : null;
  const entries = readHistoryEntries(historyDir)
    .filter((entry) => !targetDir || entry.targetDir === targetDir);

  return {
    historyDir,
    targetDir,
    entries,
  };
}

module.exports = {
  formatPublishId,
  listPublishHistory,
  publishSite,
  resolveHistoryDir,
  resolveTargetDir,
  rollbackSite,
};

