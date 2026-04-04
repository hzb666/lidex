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
