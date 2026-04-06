---
title: Template Override Notes Refined
description: The example now presents page shells, block templates, detail templates, and query templates as separate override points.
eyebrow: Template Update
lead: Template ownership should be obvious, because most custom Lidex work is really a template or theme change rather than an engine change.
heroImage: /assets/placeholders/photo.webp
heroAlt: Template update placeholder
publishedAt: 2026-03-12
category: Templates
summary: The update distinguishes shared shell structure from block-level, query-level, and detail-level rendering rules.
_id_: id-a7b3379d-2064-4486-8d5d-5cba20c12f66
---

When a project says it wants a new layout, the first question should be which layer actually changes. Is it the global shell, the list card, the detail route, or the query view. Lidex keeps those choices explicit so customization does not blur into engine code.

This example uses `example/templates/blocks/feature-card.html`, `example/templates/blocks/news-card.html`, `example/templates/details/feature-detail.html`, `example/templates/details/news-detail.html`, and `example/templates/query/latest-news.html` to demonstrate that separation in one small project.

That structure also helps documentation. When you tell someone to change the homepage query look, you can point them directly to the query template and the related theme CSS instead of saying "search the codebase until you find the right branch."
