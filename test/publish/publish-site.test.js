const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('publishSite builds into target directory and snapshots the previous publish', async () => {
  const { publishSite } = require('../../src/index.js');
  const fixtureRoot = path.join(__dirname, '../fixtures/basic-site');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-publish-'));
  fs.cpSync(fixtureRoot, tempRoot, { recursive: true });

  try {
    const targetDir = path.join(tempRoot, 'published');
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'index.html'), '<h1>Old publish</h1>', 'utf8');

    const result = await publishSite({
      rootDir: tempRoot,
      config: 'lidex-defaults.config.js',
      targetDir: 'published',
    });

    const publishedHome = fs.readFileSync(path.join(targetDir, 'index.html'), 'utf8');
    const snapshotHome = fs.readFileSync(path.join(result.historyEntryDir, 'site', 'index.html'), 'utf8');
    const snapshotMeta = JSON.parse(fs.readFileSync(path.join(result.historyEntryDir, 'meta.json'), 'utf8'));

    assert.equal(result.targetDir, targetDir);
    assert.match(result.publishId, /^\d{8}T\d{6}\d{3}Z$/);
    assert.match(publishedHome, /Welcome/);
    assert.match(snapshotHome, /Old publish/);
    assert.equal(snapshotMeta.reason, 'publish');
    assert.equal(snapshotMeta.targetDir, targetDir);
    assert.deepEqual(result.routes.sort(), ['/', '/listing', '/listing/example-item']);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('rollbackSite restores a published snapshot and snapshots the pre-rollback target', async () => {
  const { publishSite, rollbackSite } = require('../../src/index.js');
  const fixtureRoot = path.join(__dirname, '../fixtures/basic-site');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-rollback-'));
  fs.cpSync(fixtureRoot, tempRoot, { recursive: true });

  try {
    await publishSite({
      rootDir: tempRoot,
      config: 'lidex-defaults.config.js',
      targetDir: 'published',
    });

    const changedContent = `---
title: Home
---

# Changed Publish`;
    fs.writeFileSync(path.join(tempRoot, 'content', 'home.md'), changedContent, 'utf8');

    const secondPublish = await publishSite({
      rootDir: tempRoot,
      config: 'lidex-defaults.config.js',
      targetDir: 'published',
    });

    const targetDir = path.join(tempRoot, 'published');
    const changedHome = fs.readFileSync(path.join(targetDir, 'index.html'), 'utf8');
    assert.match(changedHome, /Changed Publish/);

    const rollbackResult = await rollbackSite({
      rootDir: tempRoot,
      targetDir: 'published',
      rollbackId: secondPublish.publishId,
    });

    const restoredHome = fs.readFileSync(path.join(targetDir, 'index.html'), 'utf8');
    const rollbackBackupHome = fs.readFileSync(path.join(rollbackResult.backupEntryDir, 'site', 'index.html'), 'utf8');

    assert.match(restoredHome, /Welcome/);
    assert.match(rollbackBackupHome, /Changed Publish/);
    assert.equal(rollbackResult.rollbackId, secondPublish.publishId);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('listPublishHistory returns publish and rollback snapshots in reverse chronological order', async () => {
  const { listPublishHistory, publishSite, rollbackSite } = require('../../src/index.js');
  const fixtureRoot = path.join(__dirname, '../fixtures/basic-site');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-history-'));
  fs.cpSync(fixtureRoot, tempRoot, { recursive: true });

  try {
    const targetDir = path.join(tempRoot, 'published');
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'index.html'), '<h1>Old publish</h1>', 'utf8');

    await publishSite({
      rootDir: tempRoot,
      config: 'lidex-defaults.config.js',
      targetDir: 'published',
    });

    const changedContent = `---
title: Home
---

# Changed Publish`;
    fs.writeFileSync(path.join(tempRoot, 'content', 'home.md'), changedContent, 'utf8');

    const secondPublish = await publishSite({
      rootDir: tempRoot,
      config: 'lidex-defaults.config.js',
      targetDir: 'published',
    });

    await rollbackSite({
      rootDir: tempRoot,
      targetDir: 'published',
      rollbackId: secondPublish.publishId,
    });

    const result = await listPublishHistory({
      rootDir: tempRoot,
      targetDir: 'published',
    });

    assert.equal(result.entries.length, 3);
    assert.deepEqual(
      result.entries.map((entry) => entry.reason),
      ['rollback-backup', 'publish', 'publish'],
    );
    assert.equal(result.entries[0].rollbackOf, secondPublish.publishId);
    assert.equal(result.entries[0].targetDir, path.join(tempRoot, 'published'));
    assert.match(result.entries[0].entryDir, /publish-history/);
    assert.match(result.entries[0].siteDir, /publish-history/);
    assert.equal(result.entries[0].publishId > result.entries[1].publishId, true);
    assert.equal(result.entries[1].publishId > result.entries[2].publishId, true);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

