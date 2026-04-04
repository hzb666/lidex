const test = require('node:test');
const assert = require('node:assert/strict');

test('executeQuery filters sorts and limits results', () => {
  const { executeQuery } = require('../../src/query/execute-query.js');

  const results = executeQuery(
    {
      from: 'card',
      where: {
        all: [{ field: 'category', op: 'eq', value: 'featured' }],
      },
      sort: [{ field: 'publishedAt', order: 'desc' }],
      limit: 2,
    },
    {
      card: [
        { title: 'B', category: 'featured', publishedAt: '2025-02-01' },
        { title: 'A', category: 'featured', publishedAt: '2025-03-01' },
        { title: 'C', category: 'other', publishedAt: '2025-04-01' },
      ],
    },
  );

  assert.deepEqual(results.map((item) => item.title), ['A', 'B']);
});

test('executeQuery rejects invalid operators', () => {
  const { executeQuery } = require('../../src/query/execute-query.js');

  assert.throws(
    () => executeQuery(
      {
        from: 'card',
        where: {
          all: [{ field: 'category', op: 'regex', value: 'featured' }],
        },
      },
      { card: [] },
    ),
    /invalid query operator/i,
  );
});

test('executeQuery coerces string offset and limit to numbers', () => {
  const { executeQuery } = require('../../src/query/execute-query.js');

  const results = executeQuery(
    {
      from: 'card',
      offset: '1',
      limit: '1',
      sort: [{ field: 'publishedAt', order: 'desc' }],
    },
    {
      card: [
        { title: 'C', publishedAt: '2025-01-01' },
        { title: 'B', publishedAt: '2025-02-01' },
        { title: 'A', publishedAt: '2025-03-01' },
      ],
    },
  );

  assert.deepEqual(results.map((item) => item.title), ['B']);
});

test('executeQuery respects a limit of zero', () => {
  const { executeQuery } = require('../../src/query/execute-query.js');

  const results = executeQuery(
    {
      from: 'card',
      limit: 0,
    },
    {
      card: [
        { title: 'A' },
        { title: 'B' },
      ],
    },
  );

  assert.deepEqual(results, []);
});

test('executeQuery rejects mixing where.all and where.any', () => {
  const { executeQuery } = require('../../src/query/execute-query.js');

  assert.throws(
    () => executeQuery(
      {
        from: 'card',
        where: {
          all: [{ field: 'category', op: 'eq', value: 'featured' }],
          any: [{ field: 'title', op: 'eq', value: 'A' }],
        },
      },
      { card: [] },
    ),
    /where\.all and where\.any/i,
  );
});

test('executeQuery rejects invalid offset and limit values', () => {
  const { executeQuery } = require('../../src/query/execute-query.js');

  assert.throws(
    () => executeQuery(
      {
        from: 'card',
        offset: -1,
      },
      { card: [] },
    ),
    /offset must be a non-negative integer/i,
  );

  assert.throws(
    () => executeQuery(
      {
        from: 'card',
        limit: 'abc',
      },
      { card: [] },
    ),
    /limit must be a non-negative integer/i,
  );
});
