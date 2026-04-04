---
title: Details
description: Detail routes and templates let Lydex keep list cards small while routed pages stay useful.
eyebrow: Detail Routes
lead: A detail-enabled block is a contract between the list declaration, the config, the matching Markdown file, and the detail template.
---

The full contract has four parts. First, the block type must set `hasDetailPage: true`. Second, it must define `contentDir`, `slugField`, `slugSourceField`, `route`, and `detailTemplate`. Third, each list declaration must provide `_id_` so Lydex can keep the same entry matched across renames, while `_slug_` remains either explicit or title-derived. Fourth, a Markdown file with that resolved slug must exist inside the configured `contentDir`.

For the `feature` block in this example, the list declaration lives in `example/content/home.md` or `example/content/blocks.md`, the route pattern is `/blocks/:slug`, and the detail files live in `example/content/features/`. A feature with `title: Markdown First` therefore resolves to `example/content/features/markdown-first.md`.

```md
:::feature
title: Markdown First
...
:::
```

```text
example/content/features/markdown-first.md
```

```md
---
title: Markdown First
summary: Keep pages, lists, and detail docs editable inside one site root.
---

This detail page is matched by the title-derived slug.
```

When the detail file frontmatter repeats a field that already exists on the list block, the detail frontmatter wins. That lets list views stay concise while detail pages carry richer metadata, longer summaries, and a real body without bloating the list declaration.

The practical editing rule is to treat `_id_` as the stable identity and `_slug_` as the path contract. If you leave `_slug_` implicit, changing `title` changes the routed path on the next preview/build. If you write `_slug_` explicitly, that route stays fixed until you change `_slug_` yourself.

```md
:::news
_id_: id-news-launch
title: Lydex Site Launched
:::
```

That implicit form resolves to `content/news/lydex-site-launched.md`. If you instead write `_slug_: launch-2026`, the detail file and route stay pinned to `launch-2026` until you change `_slug_` explicitly.

The example site now includes a real pinned-route entry at `/queries/release-notes-2026`, backed by `example/content/news/release-notes-2026.md`.

Pagination is also handled at the block-type level. Because `feature` and `news` both enable pagination, their detail pages show previous and next controls. The ordering comes from the configured block type, not from hard-coded route modules.

The cards below are intentionally plain because this page is teaching the contract, not the styling. The behavior to notice is that each item could have been a one-line list entry, but Lydex can still expand it into a route-backed detail page when the config and content directory agree.

:::pub
title: Declare The Block Route Contract
journal: Detail Rule
year: 2026
authors: Lydex Example
summary: Set `hasDetailPage`, then define `contentDir`, `slugField`, `slugSourceField`, `route`, and `detailTemplate` on the block type.
photo: /assets/public/favicon.svg
link: https://example.com/lydex/detail-contract
:::

:::pub
title: Match The Filename To The Slug
journal: Detail Rule
year: 2026
authors: Lydex Example
summary: A block with `title: New Paper` resolves to a detail file such as `content/news/new-paper.md`.
photo: /assets/public/favicon.svg
link: https://example.com/lydex/detail-filename
:::

:::pub
title: Let Detail Frontmatter Override List Fields
journal: Detail Rule
year: 2026
authors: Lydex Example
summary: The list card stays short, but the routed page can replace or extend those values with detail frontmatter and body content.
photo: /assets/public/favicon.svg
link: https://example.com/lydex/detail-override
:::


