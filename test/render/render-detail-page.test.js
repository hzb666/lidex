const test = require('node:test');
const assert = require('node:assert/strict');

test('renderDetailPage uses merged fields where detail context overrides list fields', () => {
  const { renderDetailPage } = require('../../src/render/render-detail-page.js');

  const html = renderDetailPage({
    shellTemplate: '<main>{{{contentHtml}}}</main>',
    detailTemplate: '<h1>{{title}}</h1><div>{{{bodyHtml}}}</div>',
    context: {
      title: 'Detail Title',
      bodyHtml: '<p>Body</p>',
    },
  });

  assert.equal(html, '<main><h1>Detail Title</h1><div><p>Body</p></div></main>');
});

test('renderQuery uses its own template instead of the original block template', () => {
  const { renderBlock } = require('../../src/render/render-block.js');
  const { renderQuery } = require('../../src/render/render-query.js');

  const blockHtml = renderBlock({
    template: '<article><h2>{{title}}</h2></article>',
    context: { title: 'Example' },
  });

  const queryHtml = renderQuery({
    template: '<ul>{{#items}}<li><strong>{{title}}</strong></li>{{/items}}</ul>',
    context: {
      items: [{ title: 'Example' }],
    },
  });

  assert.equal(blockHtml, '<article><h2>Example</h2></article>');
  assert.equal(queryHtml, '<ul><li><strong>Example</strong></li></ul>');
});
