---
title: Detail Route Walkthrough Added
description: The example now explains how title-derived Markdown files feed detail pages.
eyebrow: Routing Update
lead: Detail routes in Lidex are configured, validated, and resolved from content files rather than hand-written one by one.
heroImage: /assets/placeholders/photo.webp
heroAlt: Routing update placeholder
publishedAt: 2026-03-19
category: Routing
summary: The walkthrough clarifies how list blocks connect to detail files and why detail frontmatter can override list values.
_id_: id-b4fef53b-046e-47e8-9d79-250aad00e9b1
---

For the `news` block type, the list declaration lives on `example/content/news.md`, the route pattern is `/queries/:slug`, and the detail files live under `example/content/news/`. That is enough information for Lidex to build the routed page without a custom per-item router.

```js
news: {
  hasDetailPage: true,
  contentDir: 'content/news',
  slugField: '_slug_',
  slugSourceField: 'title',
  route: '/queries/:slug',
  detailTemplate: 'newsDetail',
}
```

The authoring workflow is straightforward: add the list block, let Lidex derive the slug from `title`, add the detail file with that derived slug, then click the generated link. If the file is missing or the source field is missing, Lidex fails fast while building the content index instead of leaving a broken route to discover later.

```md
:::news
title: Detail Route Walkthrough Added
publishedAt: 2026-03-19
category: Routing
:::
```

```text
example/content/news/detail-route-walkthrough-added.md
```

That is also why detail frontmatter overriding list fields is useful. The list view stays concise, but the detail page can carry a stronger summary, extra metadata, and a real body once someone opens the route.
