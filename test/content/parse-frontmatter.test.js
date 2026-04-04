const test = require('node:test');
const assert = require('node:assert/strict');

test('parseFrontmatter supports CRLF line endings', () => {
  const { parseFrontmatter } = require('../../src/content/parse-frontmatter.js');

  const parsed = parseFrontmatter('---\r\ntitle: Windows Title\r\nlead: Windows Lead\r\n---\r\n\r\nBody');

  assert.deepEqual(parsed.meta, {
    title: 'Windows Title',
    lead: 'Windows Lead',
  });
  assert.equal(parsed.body, 'Body');
});
