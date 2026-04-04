---
title: Declarative Query Examples Expanded
description: The example homepage now presents cross-page references as a first-class query block.
eyebrow: Query Update
lead: Queries are part of the content model, not a custom render shortcut hidden inside application code.
heroImage: /assets/placeholders/photo.webp
heroAlt: Query update placeholder
publishedAt: 2026-03-27
category: Query
summary: The update clarifies that `from`, `sort`, `limit`, and `template` are content decisions that stay visible in Markdown.
_id_: id-30584750-50f1-417c-80b5-e5dbdcbe5fda
---

The homepage query in this example is easy to inspect because the syntax lives in `example/content/home.md`. You can read the declaration, then open this source page and see the exact items the query is selecting from.

```md
:::query
from: news
sort: publishedAt:desc
limit: 3
template: latestNews
:::
```

That visibility is valuable in real sites. A future editor should not need to search JavaScript route handlers to understand why a homepage feed changed. They should be able to inspect the query declaration and the source content page directly.

The other important rule is that query presentation stays separate. The homepage feed uses `latestNews`, while the list page uses the `newsCard` block template. Same data, different views, same routed detail target.

```js
queryTemplates: {
  latestNews: 'templates/query/latest-news.html',
}
```