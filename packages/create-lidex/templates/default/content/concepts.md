---
title: Concepts
description: Core concepts behind the Lidex content model.
eyebrow: Core Concepts
lead: Lidex keeps pages, blocks, detail docs, queries, templates, and theme assets as separate concerns so each one stays understandable.
---

Step 1 is always the same: choose a `rootDir`. Everything Lidex needs lives under that folder. In this example, the root is `example/`, so the engine reads `example/lidex.config.js`, `example/content/`, `example/templates/`, and `example/assets/`.

Step 2 is page mapping. A page is one route plus one Markdown file, declared under `pages` in `example/lidex.config.js`. The page frontmatter controls shell-level values such as `title`, `eyebrow`, and `lead`. If a page omits `heroImage`, Lidex will look for `assets/_pages_/<page-slug>/cover.*`. The page body holds normal copy plus block or query declarations.

Step 3 is structured blocks. A block type is declared once under `blocks`, including its allowed fields and the template key that should render it. A page can then embed that block with `:::feature`, `:::news`, `:::photo`, or any other configured name. Lidex validates those fields while building the content index.

Step 4 is detail expansion. If a block type sets `hasDetailPage: true`, Lidex expects a second Markdown file in that block type's `contentDir`. In this example, `_id_` is the stable system identity, `_slug_` is the routed path key, and `slugSourceField: 'title'` means Lidex derives `_slug_` from `title` unless the page declaration overrides it explicitly. The rendered detail page merges list data with detail frontmatter and detail body content.

```js
pages: {
  home: { route: '/', source: 'content/home.md' },
  news: { route: '/queries', source: 'content/news.md' },
},
blocks: {
  news: {
    template: 'newsCard',
    fields: {
      title: { type: 'string', required: true },
      publishedAt: { type: 'string', required: true },
    },
  hasDetailPage: true,
  contentDir: 'content/news',
    slugField: '_slug_',
    slugSourceField: 'title',
    route: '/queries/:slug',
    detailTemplate: 'newsDetail',
  },
}
```

Step 5 is reuse. `:::query` asks Lidex for indexed items from a block type, then renders them through a query template. That means one source page can remain the canonical owner of a content collection while other pages pull curated views of the same items.

```md
:::query
from: news
sort: publishedAt:desc
limit: 3
template: latestNews
:::
```

Step 6 is presentation. The shared shell lives in one template, block cards live in block templates, routed long-form pages live in detail templates, and the page-wide visual system lives in theme files. Lidex stays manageable because those layers are separated instead of fused together.

