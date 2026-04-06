---
title: Route Ready
description: Small declarations can open larger detail pages without changing the list syntax.
eyebrow: Feature Detail
lead: The list block only needs enough data for the card and URL; the detail Markdown file provides the rest.
heroImage: /assets/public/favicon.svg
heroAlt: Lidex feature icon
kicker: Linked detail
summary: Open any small declaration into a richer Markdown-backed detail page.
proof: Slugs + detail docs
why: Lists stay scan-friendly while detail pages keep enough room for explanation, examples, and metadata.
touchpoint: `hasDetailPage`, `contentDir`, `_id_`, `_slug_`, `slugSourceField`, `route`, and detail templates.
_id_: id-b3c9e63f-ff1e-44ab-b37c-12d3bf46971d
---

For this feature card, the list declaration lives on a page file and the routed long-form version lives in `example/content/features/route-ready.md`. The route itself is not hand-coded in an Express router; it is generated from the block configuration under `feature.route`.

```js
feature: {
  hasDetailPage: true,
  contentDir: 'content/features',
  slugField: '_slug_',
  slugSourceField: 'title',
  route: '/blocks/:slug',
  detailTemplate: 'featureDetail',
}
```

The important authoring habit is to treat the list block and the detail doc as a pair. The block gives the summary fields needed for the listing. The detail file gives the richer frontmatter and body needed for the routed page. Lidex merges them when a visitor opens the route.

```md
:::feature
title: Route Ready
...
:::
```

```text
example/content/features/route-ready.md
```

Because `feature` also enables pagination, that route participates in previous and next navigation across multiple pages. The content author controls the sequence with optional `_page_` values on the block declarations rather than by writing custom controller logic.