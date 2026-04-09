const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('example theme is fully local and preserves the current shell contract', () => {
  const shellHtml = fs.readFileSync(path.join(__dirname, '../../example/templates/page-shell.html'), 'utf8');
  const css = [
    fs.readFileSync(path.join(__dirname, '../../example/assets/public/base.css'), 'utf8'),
    fs.readFileSync(path.join(__dirname, '../../example/assets/public/components.css'), 'utf8'),
  ].join('\n');

  assert.doesNotMatch(shellHtml, /cdn\.tailwindcss\.com/);
  assert.doesNotMatch(shellHtml, /fonts\.googleapis\.com/);
  assert.match(shellHtml, /themeStylesheetsHtml/);
  assert.match(shellHtml, /@font-face/);
  assert.match(shellHtml, /\/__lidex\/theme\/fonts\/GoogleSansFlex-VariableFont\.woff2/);
  assert.match(shellHtml, /\/__lidex\/theme\/fonts\/PlayfairDisplay-VariableFont_wght\.woff2/);
  assert.match(shellHtml, /--home-stage-scroll-min-height:\s*820px/);
  assert.match(shellHtml, /\.home-stage-scroll-ready main\s*\{/);
  assert.match(shellHtml, /\.home-stage-scroll-ready \.scroll-hint\s*\{/);
  assert.match(shellHtml, /\.site-header\s*\{/);
  assert.match(shellHtml, /\.hero\s*\{/);
  assert.match(shellHtml, /\.hero-action\s*\{/);
  assert.match(shellHtml, /\.feature-grid-wrapper\s*\{/);
  assert.match(shellHtml, /\.scroll-hint__arrow\s*\{/);
  assert.match(shellHtml, /\.site-nav__link\.is-active::after\s*\{/);

  assert.match(css, /\.font-sans\s*\{/);
  assert.match(css, /\.prose\s*\{/);
  assert.match(css, /\.transition-colors\s*\{/);
  assert.match(css, /\.group:hover \.group-hover\\:underline\s*\{/);
  assert.match(css, /\.bg-gradient-to-t\s*\{/);
  assert.match(css, /\.feature-grid-list\s*\{/);
  assert.match(css, /@media \(min-width: 1024px\)\s*\{\s*\.feature-grid-list\s*\{/s);
});

test('example app re-runs image loading for inserted image content', () => {
  const js = fs.readFileSync(
    path.join(__dirname, '../../example/assets/public/app.js'),
    'utf8'
  );

  assert.match(js, /function initImageLoading\(\)/);
  assert.match(js, /function isHomeStageScrollReady\(\)/);
  assert.match(js, /home-stage-scroll-ready/);
  assert.match(
    js,
    /img\.closest\('\.hero-visual, \.member-card__avatar, \.latest-news__photo, \.news-card__photo, \.photo-card'\)/
  );
  assert.match(js, /frame\.classList\.toggle\('is-loading', !isLoaded\);/);
  assert.match(js, /img\.classList\.add\('loaded'\);/);
  assert.match(js, /new MutationObserver\(/);
  assert.match(js, /childList:\s*true,\s*subtree:\s*true/s);
  assert.match(js, /if \(shouldRefreshImageLoading\(mutation\.addedNodes\[nodeIndex\]\)\) \{\s*initImageLoading\(\);/s);
});
