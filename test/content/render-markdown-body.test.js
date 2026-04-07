const test = require('node:test');
const assert = require('node:assert/strict');

test('renderMarkdownBody renders fenced code blocks with optional language class', () => {
  const { renderMarkdownBody } = require('../../src/content/render-markdown-body.js');

  const html = renderMarkdownBody(`Intro paragraph.

\`\`\`js
const value = "<unsafe>";
\`\`\`

Outro paragraph.`);

  assert.match(html, /^<p>Intro paragraph\.<\/p>/);
  assert.match(
    html,
    /<pre class="markdown-code-block"><code class="language-js">const value = &quot;&lt;unsafe&gt;&quot;;<\/code><\/pre>/
  );
  assert.match(html, /<p>Outro paragraph\.<\/p>$/);
});

test('renderMarkdownBody renders callout directives with escaped text and inline svg icons', () => {
  const { renderMarkdownBody } = require('../../src/content/render-markdown-body.js');

  const html = renderMarkdownBody(`Intro paragraph.

:::callout
type: warning
title: Read this first
body: Keep <unsafe> markup escaped.
:::

Outro paragraph.`);

  assert.match(html, /^<p>Intro paragraph\.<\/p>/);
  assert.match(html, /<aside class="callout callout--warning" data-callout-type="warning">/);
  assert.match(html, /<span class="callout__icon" aria-hidden="true"><svg/);
  assert.match(html, /<p class="callout__title">Read this first<\/p>/);
  assert.match(html, /<p class="callout__body">Keep &lt;unsafe&gt; markup escaped\.<\/p>/);
  assert.match(html, /<p>Outro paragraph\.<\/p>$/);
});

test('renderMarkdownBody throws when a callout directive is missing required fields', () => {
  const { renderMarkdownBody } = require('../../src/content/render-markdown-body.js');

  assert.throws(
    () => renderMarkdownBody(`:::callout
type: note
title: Missing body
:::`),
    /missing required field "body"/i,
  );
});
