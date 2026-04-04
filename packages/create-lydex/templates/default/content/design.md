---
title: Design
description: How to set up a real Lydex project root and work with it day to day.
eyebrow: Project Setup
lead: A practical Lydex site is just a root folder with config, content, optional templates, assets, and optional theme overrides.
---

If you are starting a new site, the smallest useful structure is `lydex.config.js`, a `content/` folder, and an `assets/` folder. You only add `templates/` when you want to override built-in markup, and you only add a custom theme directory when you want to override the built-in base styles, component styles, or theme behavior.

A typical starter looks like this: `my-site/lydex.config.js`, `my-site/content/home.md`, `my-site/content/news.md`, `my-site/content/news/new-paper.md`, `my-site/assets/_pages_/home/cover.jpg`, and `my-site/assets/news/new-paper/cover.jpg`. That is enough for page routes, a list block, one routed detail page, and predictable image ownership.

```text
my-site/
  lydex.config.js
  content/
    home.md
    news.md
    news/
      new-paper.md
  assets/
    _pages_/
      home/
        cover.jpg
    news/
      new-paper/
        cover.jpg
```

For local preview, run `npx lydex --root ./my-site --port 3001`. For static export, run `npx lydex --build --root ./my-site --out ./dist`. For deploy-style publishing, run `npx lydex --publish --root ./my-site --target ./published`. If you need to inspect old publishes later, use `npx lydex --list-history --root ./my-site --target ./published`.

```bash
npx lydex --root ./my-site --port 3001
npx lydex --build --root ./my-site --out ./dist
npx lydex --publish --root ./my-site --target ./published
npx lydex --list-history --root ./my-site --target ./published
```

The important design constraint is that Lydex is still Markdown-first. Users are expected to edit Markdown content and simple config, not build pages through a generated GUI. The engine gives structure and routing, but it does not try to become a low-code site builder.

Server mode and static mode solve different problems. Server mode is the easiest way to preview and optionally use admin editing. Static mode is the easiest way to deploy to a plain host or CDN. If you change content after a static export, you rebuild or republish. If you change content in server mode through the admin file APIs, the in-memory index refreshes immediately.

For managed detail entries, the editing rule is simple: keep `_id_` stable, let `_slug_` be either explicit or derived, and remember that preview/build is the moment when Lydex creates missing detail files, renames detail paths for the same `_id_`, and asks before deleting orphaned detail content.

In practice, that means most authors should write `_id_` and stop there. Only write `_slug_` when you intentionally want to pin a public URL or a detail filename instead of letting it follow the configured source field.

