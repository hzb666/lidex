---
title: Feature Blocks
description: Feature blocks demonstrate how to declare structured cards directly inside page Markdown.
eyebrow: Routed Blocks
lead: A block declaration stays compact in the page file, but it can still open a full detail page and participate in global previous or next navigation.
---

The `feature` block is declared in `example/lidex.config.js`. Its required fields are `title`, `kicker`, and `summary`. Lidex derives the routed detail slug from `title`, then maps that to `content/features/<slug>.md` and `assets/feature/<slug>/`. Because the block also enables detail routes and pagination, the same declaration can render a card on one page, open a full detail page, and join a global previous or next sequence across multiple pages.

The homepage starts that sequence and this page continues it. That is why these cards link into the same detail chain as the homepage cards. Lidex is not paging the page route itself here; it is paging the detail views for one block type.

The optional reserved field is `_page_`. It is only accepted because this block type sets `enablePagination: true`. If you omit `_page_` entirely for a block type, Lidex falls back to page-key order and declaration order. If you do set `_page_`, it becomes the explicit anchor for detail navigation order.

Read the declaration first, then click through into the detail page. After that, open `example/content/features/` and compare the list declaration with the matching detail file. That pair is the core authoring pattern for detail-enabled content in Lidex.

```js
feature: {
  template: 'featureCard',
  fields: {
    title: { type: 'string', required: true },
    kicker: { type: 'string', required: true },
    summary: { type: 'string', required: true },
  },
  hasDetailPage: true,
  enablePagination: true,
  contentDir: 'content/features',
  slugField: '_slug_',
  slugSourceField: 'title',
  route: '/blocks/:slug',
  detailTemplate: 'featureDetail',
}
```

```md
:::feature
_id_: id-9c41ff3e-3676-448c-bdd3-e610a2e283cd
title: Design Freedom
kicker: Local override
summary: Swap shells, cards, and detail templates without forking the engine.
_page_: 2
:::
```

:::feature
_id_: id-9c41ff3e-3676-448c-bdd3-e610a2e283cd
title: Design Freedom
kicker: Local override
summary: Swap shells, cards, and detail templates without forking the engine.
_page_: 2
:::

:::feature
_id_: id-5ceb2732-0cf2-40e1-851c-65d3b7cc6cf2
title: Shared Shell
kicker: Consistent chrome
summary: Keep navigation, hero framing, and page rhythm aligned across routes.
_page_: 4
:::

:::feature
_id_: id-75529c79-3c66-430e-b3fc-83a6079b5649
title: Override Points
kicker: Layered rendering
summary: Separate page shells, block cards, query templates, and detail layouts.
_page_: 6
:::

