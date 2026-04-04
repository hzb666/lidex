---
title: Query Driven
description: Query blocks let one page reuse another page's structured items without copy-pasting cards.
eyebrow: Feature Detail
lead: Ask for indexed content where you need it, pick a template, and keep the source page authoritative.
heroImage: /assets/public/favicon.svg
heroAlt: Lydex feature icon
kicker: Indexed reuse
summary: Pull the right items onto the page without duplicating markup.
proof: Queries + templates
why: One canonical content item can drive a list page, a homepage highlight, and a detail route at the same time.
touchpoint: Query syntax, sorting, limiting, filtering, and query-specific templates.
_id_: id-4c302677-c8b1-419d-8322-17db89c2cc96
---

The homepage feed in this example is the exact use case queries were designed for. The source items belong to `example/content/news.md`, but the homepage can still ask for the newest three items with `from: news`, `sort: publishedAt:desc`, `limit: 3`, and `template: latestNews`.

```md
:::query
from: news
sort: publishedAt:desc
limit: 3
template: latestNews
:::
```

That matters because query rendering is intentionally separate from source-block rendering. A queried news item can look different on the homepage than it does on the `/queries` page, while still pointing to the same detail route and pulling from the same underlying data record.

If you need filtering, `where` takes JSON. That keeps the query strict. It is less magical than a custom mini-language, but it is easier to validate, easier to test, and easier to reason about once your content model grows.

```md
:::query
from: news
where: {"all":[{"field":"category","op":"eq","value":"Query"}]}
sort: publishedAt:desc
limit: 2
template: latestNews
:::
```