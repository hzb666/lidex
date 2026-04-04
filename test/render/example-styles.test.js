const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('example styles keep the songlab textured page backdrop contract', () => {
  const css = [
    fs.readFileSync(path.join(__dirname, '../../example/assets/public/base.css'), 'utf8'),
    fs.readFileSync(path.join(__dirname, '../../example/assets/public/components.css'), 'utf8'),
  ].join('\n');

  assert.match(
    css,
    /--page-backdrop-image:\s*url\("data:image\/svg\+xml,[^"]+"\),\s*radial-gradient\(circle, rgba\(17, 24, 39, 0\.06\) 1\.5px, transparent 1\.6px\),\s*radial-gradient\(ellipse at 15% 0%, rgba\(219, 234, 254, 0\.45\) 0%, transparent 65%\),\s*radial-gradient\(ellipse at 85% 100%, rgba\(228, 233, 255, 0\.45\) 0%, transparent 65%\);/s
  );
  assert.match(
    css,
    /--page-backdrop-size:\s*180px 180px,\s*34px 34px,\s*100% 100%,\s*100% 100%;/s
  );
  assert.match(
    css,
    /--page-backdrop-position:\s*0 0,\s*17px 17px,\s*0 0,\s*0 0;/s
  );
  assert.match(css, /html\s*\{[^}]*background:\s*var\(--bg\);[^}]*position:\s*relative;[^}]*\}/s);
  assert.match(
    css,
    /body\s*\{[^}]*background:\s*transparent;[^}]*min-height:\s*100vh;[^}]*\}/s
  );
  assert.match(
    css,
    /html::before\s*\{[^}]*background-image:\s*var\(--page-backdrop-image\);[^}]*background-size:\s*var\(--page-backdrop-size\);[^}]*background-position:\s*var\(--page-backdrop-position\);[^}]*\}/s
  );
  assert.match(
    css,
    /::-webkit-scrollbar-thumb\s*\{[^}]*background-color:\s*rgba\(17,\s*24,\s*39,\s*0\.28\);[^}]*border:\s*3px solid transparent;[^}]*border-radius:\s*999px;[^}]*\}/s
  );
  assert.match(
    css,
    /::-webkit-scrollbar-thumb:hover\s*\{[^}]*background-color:\s*rgba\(17,\s*24,\s*39,\s*0\.46\);[^}]*border:\s*1px solid transparent;[^}]*border-radius:\s*999px;[^}]*\}/s
  );
  assert.match(
    css,
    /::-webkit-scrollbar-button\s*\{[^}]*display:\s*none;[^}]*width:\s*0;[^}]*height:\s*0;[^}]*background:\s*transparent;[^}]*\}/s
  );
  assert.match(
    css,
    /::-webkit-scrollbar-track\s*\{[^}]*background:\s*linear-gradient\(180deg,\s*#f9f9f9 0%,\s*#eeeef3 100%\);[^}]*\}/s
  );
  assert.match(
    css,
    /::-webkit-scrollbar-corner\s*\{[^}]*background:\s*#eeeef3;[^}]*\}/s
  );
  assert.match(
    css,
    /scrollbar-color:\s*rgba\(17,\s*24,\s*39,\s*0\.28\)\s+#eeeef3;/s
  );
  assert.match(css, /\.scroll-hint__arrow\s*\{[^}]*width:\s*18px;[^}]*height:\s*18px;[^}]*border-right:\s*1\.8px solid currentColor;[^}]*border-bottom:\s*1\.8px solid currentColor;[^}]*transform:\s*rotate\(45deg\);[^}]*animation:\s*bounce 2s ease-in-out infinite;[^}]*\}/s);
  assert.match(css, /@keyframes bounce\s*\{[\s\S]*transform:\s*translateY\(0\)\s*rotate\(45deg\);[\s\S]*transform:\s*translateY\(6px\)\s*rotate\(45deg\);[\s\S]*\}/s);
  assert.match(css, /--image-frame-skeleton-base:\s*#f6f6f6;/);
  assert.match(css, /--image-frame-skeleton-highlight:\s*#ebedf2;/);
  assert.match(
    css,
    /img:not\(\.loaded\)\s*\{[^}]*background-image:\s*linear-gradient\([^}]*var\(--image-frame-skeleton-base\)[^}]*var\(--image-frame-skeleton-highlight\)[^}]*\)[^}]*animation:\s*skeleton-shimmer 1\.5s infinite linear;[^}]*\}/s
  );
  assert.match(css, /@keyframes skeleton-shimmer\s*\{/);
  assert.match(
    css,
    /\.hero-visual::before\s*\{[^}]*background-image:\s*linear-gradient\([^}]*var\(--image-frame-skeleton-base\)[^}]*var\(--image-frame-skeleton-highlight\)[^}]*\)[^}]*opacity:\s*0;[^}]*\}/s
  );
  assert.match(css, /\.hero-visual\.is-loading::before\s*\{[^}]*opacity:\s*1;[^}]*\}/s);
  assert.match(css, /\.member-card__avatar\.is-loading::before\s*\{[^}]*opacity:\s*1;[^}]*\}/s);
  assert.match(css, /\.news-card__photo\.is-loading::before\s*\{[^}]*opacity:\s*1;[^}]*\}/s);
  assert.match(css, /\.latest-news__photo\.is-loading::before\s*\{[^}]*opacity:\s*1;[^}]*\}/s);
  assert.match(css, /\.photo-card\.is-loading::before\s*\{[^}]*opacity:\s*1;[^}]*\}/s);
  assert.match(css, /\.member-card--feature\s*\{[^}]*padding:\s*0;[^}]*border:\s*none;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;[^}]*\}/s);
  assert.match(css, /\.member-card__figure\s*\{[^}]*letter-spacing:\s*0\.12em;[^}]*\}/s);
  assert.match(css, /\.member-card__illustration\s*\{[^}]*min-height:\s*220px;[^}]*\}/s);
  assert.doesNotMatch(css, /\[data-feature-page=/);
  assert.match(css, /\.detail-pagination-control\s*\{[^}]*background:\s*transparent;[^}]*border:\s*none;[^}]*\}/s);
  assert.match(css, /\.detail-pagination-control:hover\s*\{[^}]*background:\s*rgba\(17,\s*24,\s*39,\s*0\.06\);[^}]*\}/s);
  assert.match(css, /\.detail-pagination-link\s*\{[^}]*border:\s*none;[^}]*background:\s*transparent;[^}]*\}/s);
  assert.match(css, /\.detail-pagination-link:hover\s*\{[^}]*background:\s*rgba\(17,\s*24,\s*39,\s*0\.05\);[^}]*\}/s);
  assert.match(css, /\.photo-card__overlay\s*\{[^}]*z-index:\s*2;[^}]*\}/s);
  assert.match(css, /\.photo-card:not\(\.is-loading\):hover img\s*\{[^}]*transform:\s*scale\(1\.06\);[^}]*filter:\s*blur\(4px\);[^}]*\}/s);
  assert.match(css, /\.photo-card:not\(\.is-loading\):hover \.photo-card__overlay\s*\{[^}]*opacity:\s*1;[^}]*\}/s);
  assert.match(css, /\.markdown-code-block\s*\{/);
  assert.match(css, /\.markdown-code-block code\s*\{/);
});

test('example app re-runs image loading for inserted image content', () => {
  const js = fs.readFileSync(
    path.join(__dirname, '../../example/assets/public/app.js'),
    'utf8'
  );

  assert.match(js, /function initImageLoading\(\)/);
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
