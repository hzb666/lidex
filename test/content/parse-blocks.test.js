const test = require('node:test');
const assert = require('node:assert/strict');

test('parseBlocks returns declared block nodes and query nodes', () => {
  const { parseBlocks } = require('../../src/content/parse-blocks.js');

  const nodes = parseBlocks(
    [
      ':::card',
      'slug: example-item',
      'title: Example',
      ':::',
      '',
      ':::query',
      'from: card',
      'limit: 3',
      'template: compactList',
      ':::',
    ].join('\n'),
    { pageKey: 'listing', filePath: 'content/listing.md' },
  );

  assert.equal(nodes[0].type, 'block');
  assert.equal(nodes[0].name, 'card');
  assert.equal(nodes[0].fields.slug, 'example-item');
  assert.equal(nodes[0].source.startLine, 1);

  assert.equal(nodes[1].type, 'query');
  assert.equal(nodes[1].params.from, 'card');
  assert.equal(nodes[1].params.limit, '3');
  assert.equal(nodes[1].source.startLine, 6);
});

test('parseBlocks throws when a block is missing a closing fence', () => {
  const { parseBlocks } = require('../../src/content/parse-blocks.js');

  assert.throws(
    () => parseBlocks(
      [
        ':::card',
        'slug: example-item',
        'title: Example',
      ].join('\n'),
      { pageKey: 'listing', filePath: 'content/listing.md' },
    ),
    /missing closing fence/i,
  );
});

test('parseBlocks throws on duplicate field names', () => {
  const { parseBlocks } = require('../../src/content/parse-blocks.js');

  assert.throws(
    () => parseBlocks(
      [
        ':::card',
        'slug: one',
        'slug: two',
        ':::',
      ].join('\n'),
      { pageKey: 'listing', filePath: 'content/listing.md' },
    ),
    /duplicate field/i,
  );
});

test('parseBlocks throws on blank block names', () => {
  const { parseBlocks } = require('../../src/content/parse-blocks.js');

  assert.throws(
    () => parseBlocks(
      [
        ':::',
        'slug: one',
        ':::',
      ].join('\n'),
      { pageKey: 'listing', filePath: 'content/listing.md' },
    ),
    /blank block name/i,
  );
});

test('parseBlocks ignores block-like syntax inside fenced code blocks', () => {
  const { parseBlocks } = require('../../src/content/parse-blocks.js');

  const nodes = parseBlocks(
    [
      '```md',
      ':::feature',
      'slug: example',
      ':::',
      '```',
      '',
      ':::feature',
      'slug: real-example',
      ':::',
    ].join('\n'),
    { pageKey: 'listing', filePath: 'content/listing.md' },
  );

  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].name, 'feature');
  assert.equal(nodes[0].fields.slug, 'real-example');
});

test('parseBlocks ignores markdown callout directives and keeps parsing declared blocks', () => {
  const { parseBlocks } = require('../../src/content/parse-blocks.js');

  const nodes = parseBlocks(
    [
      ':::callout',
      'type: note',
      'title: Heads up',
      'body: This should not become a block node.',
      ':::',
      '',
      ':::feature',
      'slug: real-example',
      ':::',
    ].join('\n'),
    { pageKey: 'listing', filePath: 'content/listing.md' },
  );

  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].name, 'feature');
  assert.equal(nodes[0].fields.slug, 'real-example');
});
