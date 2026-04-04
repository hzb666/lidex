---
title: Lydex
description: Lydex is a declarative Markdown site engine for structured pages, detail routes, and query-driven layouts.
eyebrow: Declarative Site Engine
lead: Read the syntax, inspect the files, then watch the same declarations render into routed pages and live query results.
---

Treat this homepage as the start of the tutorial, not as a marketing mockup. Everything under the fold is powered by the real `example/lydex.config.js`, the real files inside `example/content/`, and the real templates under `example/templates/`.

The fastest learning path is `Concepts` -> `Design` -> `Blocks` -> `Details` -> `Queries` -> `Theme`. By the time you finish those pages, you should know which file to create, which config key to change, and which command to run for the most common Lydex workflows.

If you want to reproduce this site locally, run `npx lydex --root ./example --port 3001`. If you want static output, run `npx lydex --build --root ./example --out ./dist`. If you change any Markdown, template, or theme file after a static build, you build again. In server mode, the public routes update after a restart, and admin edits refresh the in-memory index immediately.

The syntax below is not illustrative pseudo-code. Those exact declarations exist in this page and are rendered by the engine into the three feature links and the news query you see underneath.

```md
:::feature
title: Markdown First
kicker: Local content
summary: Keep pages, lists, and detail docs editable inside one site root.
page: 1
:::

:::feature
title: Query Driven
kicker: Indexed reuse
summary: Pull the right items onto the page without duplicating markup.
page: 3
:::

:::query
from: news
sort: publishedAt:desc
limit: 3
template: latestNews
:::
```

The same page can also show ordinary prose above or below those declarations. The page frontmatter controls the shared shell and header for the route:

```md
---
title: Lydex
eyebrow: Declarative Site Engine
lead: Read the syntax, inspect the files, then watch the same declarations render into routed pages and live query results.
---
```

The point of Lydex is that you do not maintain one set of Markdown for content and another set of route code for presentation. A page can hold prose, blocks, and queries together, while the config, templates, and theme define how those declarations become a site.

:::feature
_id_: id-ea6f359c-0eb8-4e5a-b1b1-ccd3315751f3
title: Markdown First
kicker: Local content
summary: Keep pages, lists, and detail docs editable inside one site root.
page: 1
:::

:::feature
_id_: id-4c302677-c8b1-419d-8322-17db89c2cc96
title: Query Driven
kicker: Indexed reuse
summary: Pull the right items onto the page without duplicating markup.
page: 3
:::

:::feature
_id_: id-b3c9e63f-ff1e-44ab-b37c-12d3bf46971d
title: Route Ready
kicker: Linked detail
summary: Open any small declaration into a richer Markdown-backed detail page.
page: 5
:::

:::query
from: news
sort: publishedAt:desc
limit: 3
template: latestNews
:::

