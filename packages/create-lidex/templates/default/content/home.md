---
title: Lidex
description: Lidex is a declarative Markdown site engine for structured pages, detail routes, and query-driven layouts.
lead: Write the page in Markdown, then follow it into routes, detail pages, and query output.
showHero: false
heroPrimaryLabel: Get Started
heroPrimaryHref: /docs
heroCommand: npm create lidex@latest
heroCommandCopyText: npm create lidex@latest
heroCommandPrefix: >
---

:::feature
_id_: id-ea6f359c-0eb8-4e5a-b1b1-ccd3315751f3
title: Markdown First
kicker: Local content
summary: Keep pages and detail docs editable inside one site root.
_page_: 1
:::

:::feature
_id_: id-4c302677-c8b1-419d-8322-17db89c2cc96
title: Query Driven
kicker: Indexed reuse
summary: Pull the right items onto the page without duplicating markup.
_page_: 3
:::

:::feature
_id_: id-b3c9e63f-ff1e-44ab-b37c-12d3bf46971d
title: Route Ready
kicker: Linked detail
summary: Open a small declaration into a richer Markdown-backed detail page.
_page_: 5
:::

:::query
from: news
sort: publishedAt:desc
limit: 3
template: latestNews
:::

