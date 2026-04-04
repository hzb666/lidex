const test = require('node:test');
const assert = require('node:assert/strict');

test('renderTemplate escapes normal fields and preserves triple-brace html fields', () => {
  const { renderTemplate } = require('../../src/render/render-template.js');

  const html = renderTemplate('<h1>{{title}}</h1><div>{{{bodyHtml}}}</div>', {
    title: '<unsafe>',
    bodyHtml: '<p>safe body</p>',
  });

  assert.equal(html, '<h1>&lt;unsafe&gt;</h1><div><p>safe body</p></div>');
});

test('renderTemplate repeats sections for array values', () => {
  const { renderTemplate } = require('../../src/render/render-template.js');

  const html = renderTemplate(
    '<ul>{{#items}}<li>{{title}}</li>{{/items}}</ul>',
    {
      items: [
        { title: 'A' },
        { title: 'B' },
      ],
    },
  );

  assert.equal(html, '<ul><li>A</li><li>B</li></ul>');
});

test('renderTemplate throws on missing fields', () => {
  const { renderTemplate } = require('../../src/render/render-template.js');

  assert.throws(
    () => renderTemplate('<h1>{{title}}</h1><p>{{summary}}</p>', { title: 'Example' }),
    /missing template field/i,
  );
});
