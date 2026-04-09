const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const request = require('supertest');

test('createApp exposes reload metadata and injects reload live-reload helpers when preview reload is enabled', async () => {
  const { createApp } = require('../../src/index.js');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-reload-preview-'));

  try {
    fs.mkdirSync(path.join(tempRoot, 'content/items'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/blocks'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/details'), { recursive: true });

    fs.writeFileSync(
      path.join(tempRoot, 'lidex.config.js'),
      `module.exports = {
  site: {
    siteName: 'Reload Site',
  },
  pages: {
    home: { route: '/', source: 'content/home.md' },
  },
  blocks: {
    card: {
      template: 'cardBlock',
      fields: {
        slug: { type: 'string', required: true },
        title: { type: 'string', required: true },
      },
      hasDetailPage: true,
      contentDir: 'content/items',
      slugField: 'slug',
      route: '/items/:slug',
      detailTemplate: 'cardDetail',
    },
  },
  templates: {
    pageShell: 'templates/page-shell.html',
    cardBlock: 'templates/blocks/card-block.html',
    cardDetail: 'templates/details/card-detail.html',
  },
};`,
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'templates/page-shell.html'),
      '<!doctype html><html><body><header>{{siteName}}</header>{{{pageHeaderHtml}}}{{{contentHtml}}}</body></html>',
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'templates/blocks/card-block.html'),
      '<article><a href="{{detailRoute}}">{{title}}</a></article>',
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'templates/details/card-detail.html'),
      '<article><h1>{{title}}</h1><div>{{{bodyHtml}}}</div></article>',
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'content/home.md'),
      `---
title: Home
lead: Preview lead
---

:::card
slug: example-item
title: Example Item
:::`,
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'content/items/example-item.md'),
      'Example detail body.',
      'utf8',
    );

    const app = createApp({
      rootDir: tempRoot,
      reload: true,
      reloadState: { version: 3 },
    });

    const reloadState = await request(app).get('/__lidex/reload');
    const home = await request(app).get('/');
    const detail = await request(app).get('/items/example-item');

    assert.equal(reloadState.status, 200);
    assert.deepEqual(reloadState.body, { version: 3 });
    assert.equal(reloadState.headers['cache-control'], 'no-store');
    assert.match(home.text, /__lidex\/events/);
    assert.match(home.text, /__lidex\/reload/);
    assert.match(home.text, /EventSource/);
    assert.match(home.text, /currentVersion=3/);
    assert.match(detail.text, /__lidex\/events/);
    assert.match(detail.text, /__lidex\/reload/);
    assert.match(detail.text, /currentVersion=3/);
  } finally {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});

async function waitFor(condition, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (condition()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

test('startServer keeps reload content errors non-fatal and preserves the previous app', async () => {
  const { startServer } = require('../../src/index.js');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lidex-reload-server-error-'));
  const originalConsoleError = console.error;
  const originalWatch = fs.watch;
  const errorLogs = [];
  const watchCallbacks = [];

  console.error = (message) => {
    errorLogs.push(String(message));
  };
  fs.watch = (watchPath, optionsOrListener, maybeListener) => {
    const listener = typeof optionsOrListener === 'function' ? optionsOrListener : maybeListener;
    watchCallbacks.push(listener);
    return {
      on() {
        return this;
      },
      close() {},
    };
  };

  let server = null;

  try {
    fs.mkdirSync(path.join(tempRoot, 'content'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'templates/blocks'), { recursive: true });

    fs.writeFileSync(
      path.join(tempRoot, 'lidex.config.js'),
      `module.exports = {
  pages: {
    home: { route: '/', source: 'content/home.md' },
  },
  blocks: {
    card: {
      template: 'cardBlock',
      fields: {
        title: { type: 'string', required: true },
      },
    },
  },
  templates: {
    pageShell: 'templates/page-shell.html',
    cardBlock: 'templates/blocks/card-block.html',
  },
};`,
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'templates/page-shell.html'),
      '<!doctype html><html><body><main>{{{contentHtml}}}</main></body></html>',
      'utf8',
    );
    fs.writeFileSync(
      path.join(tempRoot, 'templates/blocks/card-block.html'),
      '<article>{{title}}</article>',
      'utf8',
    );
    const homePath = path.join(tempRoot, 'content/home.md');

    fs.writeFileSync(
      homePath,
      `---
title: Home
---

Before reload failure.`,
      'utf8',
    );

    server = startServer({
      rootDir: tempRoot,
      reload: true,
      port: 0,
    });

    let serverErrorCount = 0;
    let reloadErrorCount = 0;
    server.on('error', () => {
      serverErrorCount += 1;
    });
    server.on('reloadError', () => {
      reloadErrorCount += 1;
    });

    fs.writeFileSync(
      homePath,
      `---
title: Home
---

:::card
title: Broken`,
      'utf8',
    );
    const bumpedTime = new Date(Date.now() + 5000);
    fs.utimesSync(homePath, bumpedTime, bumpedTime);
    for (const callback of watchCallbacks) {
      callback('change', path.basename(homePath));
    }

    await waitFor(() => reloadErrorCount > 0 || errorLogs.length > 0);

    const after = await request(server).get('/');
    assert.equal(after.status, 200);
    assert.match(after.text, /Before reload failure/);
    assert.equal(serverErrorCount, 0);
    assert.equal(reloadErrorCount, 1);
    assert.equal(errorLogs.some((line) => /\[lidex\] reload error:/i.test(line)), true);
  } finally {
    console.error = originalConsoleError;
    fs.watch = originalWatch;
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    fs.rmSync(tempRoot, { force: true, recursive: true });
  }
});
