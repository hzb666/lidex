---
title: News Block
description: The news block demonstrates a detail-enabled format that also works well with cross-page queries.
eyebrow: Declaration Pattern
lead: Query-friendly editorial entry
heroImage: /assets/placeholders/avatar.webp
heroAlt: News block placeholder
role: Query-friendly editorial entry
year: Fields: title, publishedAt
summary: The news block is a good fit for updates that should render in lists, detail pages, and query-driven homepage summaries.
focus: Sorting, cross-page queries, detail routes
email: news-block@lydex.example
---

Because each news item keeps structured metadata such as `publishedAt` and `category`, queries can sort and filter them without custom route code. That same content can still open on its own detail route for fuller editorial context.

The important idea is that query blocks do not replace the original page. They are alternate views over indexed content, with their own template and presentation rules.

