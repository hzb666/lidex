---
title: Queries
description: Query blocks make cross-page references declarative in Lydex.
eyebrow: Cross-page Queries
lead: A query asks the content index for items, then renders them through a query template without copying the source block markup.
---

The homepage pulls from the `news` block type declared on this page. That means the homepage feed is not a second hand-written list. It is a live query over these items, sorted by `publishedAt` and limited to the newest three entries.

The minimum useful query is `from` plus `template`. In practice, most real queries also use `sort`, `limit`, or `where`. `where` is JSON, not a mini DSL. That keeps the config strict and machine-checkable, even though it is less forgiving than an ad hoc text syntax.

```md
:::query
from: news
where: {"all":[{"field":"category","op":"eq","value":"Query"}]}
sort: publishedAt:desc
limit: 2
template: latestNews
:::
```

The current engine supports `from`, `where`, `sort`, `limit`, and `offset`. A good mental model is this: page Markdown declares the query, Lydex reads the indexed dataset for that block type, the query executor filters and sorts it, and the query template decides the final presentation.

One of the most important habits is to keep the source page authoritative. News items still belong here. Their detail routes still open under `/queries/:slug`, but the `slug` itself is generated from `title`, and Lydex expects the body file under `content/news/<slug>.md` plus images under `assets/news/<slug>/`. The homepage or any other page simply asks for another view over the same indexed records.

```md
:::query
from: news
sort: publishedAt:desc
limit: 3
template: latestNews
:::
```

:::news
_id_: id-30584750-50f1-417c-80b5-e5dbdcbe5fda
title: Declarative Query Examples Expanded
publishedAt: 2026-03-27
category: Query
summary: The example now shows cross-page pulls as first-class content blocks instead of ad hoc rendering helpers.
:::

:::news
_id_: id-b4fef53b-046e-47e8-9d79-250aad00e9b1
title: Detail Route Walkthrough Added
publishedAt: 2026-03-19
category: Routing
summary: The example explains how list blocks connect to title-derived Markdown detail files and dedicated detail templates.
:::

:::news
_id_: id-a7b3379d-2064-4486-8d5d-5cba20c12f66
title: Template Override Notes Refined
publishedAt: 2026-03-12
category: Templates
summary: The docs now frame page shells, block templates, query templates, and detail templates as separate override points.
:::

:::news
_id_: id-0837bc61-7668-48a5-9621-df5ce91e7872
title: Example Starter Reorganised
publishedAt: 2026-02-18
category: Example
summary: The bundled starter was rewritten as a Lydex explanation site while keeping the same rendering primitives underneath.
:::

:::news
_id_: id-fixed-url-demo
_slug_: release-notes-2026
title: Fixed URL Demo Entry
publishedAt: 2026-01-30
category: Routing
summary: This example pins a public route with an explicit _slug_ so title edits do not move the detail page.
:::

