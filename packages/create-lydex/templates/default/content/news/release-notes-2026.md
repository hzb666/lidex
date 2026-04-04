---
title: Fixed URL Demo Entry
description: This detail page demonstrates an explicit _slug_ that keeps the route stable.
eyebrow: Explicit _slug_
lead: The page keeps its URL because the block declaration pins `_slug_` instead of deriving it from `title`.
publishedAt: 2026-01-30
category: Routing
summary: Explicit `_slug_` is the right fit when the public URL should remain stable across title edits.
_id_: id-fixed-url-demo
---

This example uses an explicit `_slug_` in `example/content/news.md`:

```md
:::news
_id_: id-fixed-url-demo
_slug_: release-notes-2026
title: Fixed URL Demo Entry
:::
```

Because `_slug_` is present, the route stays pinned to `/queries/release-notes-2026`, even if the title changes later.

That is the recommended pattern when a page has already been shared publicly or when editors want a shorter, hand-picked URL than the title-derived default.