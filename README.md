<p align="center">
  <img src="example/assets/public/favicon.svg" alt="Lidex logo" width="96" height="96">
</p>

<h1 align="center">Lidex</h1>

<p align="center">
  <img alt="Node.js" src="https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white">
  <img alt="npm @lidex/lidex" src="https://img.shields.io/npm/v/%40lidex%2Flidex?logo=npm&color=CB3837">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white">
</p>

Lidex is a Markdown-first site engine for small structured websites. It lets one project root hold page copy, structured blocks, detail-page Markdown, query-driven cross-page lists, template overrides, and theme assets without introducing a database or a heavy CMS layer.

Lidex can run in two modes:

- a small Node/Express server for local preview and optional admin editing
- a static exporter that writes `index.html` files you can publish anywhere

## Table Of Contents

- [What Lidex Is Good At](#what-lidex-is-good-at)
- [Requirements](#requirements)
- [Install](#install)
- [Create A Project](#create-a-project)
- [Quick Start](#quick-start)
- [How Lidex Thinks About Content](#how-lidex-thinks-about-content)
- [Configuration Reference](#configuration-reference)
- [Templates](#templates)
- [Themes](#themes)
- [API](#api)
- [CLI](#cli)
- [Build Publish And Rollback](#build-publish-and-rollback)
- [Admin Editing](#admin-editing)
- [Example Site Walkthrough](#example-site-walkthrough)
- [Package Structure](#package-structure)
- [Testing](#testing)
- [Current Limitations](#current-limitations)

## What Lidex Is Good At

- Keeping content in Markdown files instead of moving it into a database
- Rendering structured block declarations inside normal page Markdown
- Letting block items open dedicated detail routes backed by their own Markdown files
- Reusing indexed content across pages with `:::query`
- Separating shell, block, detail, query, and theme overrides cleanly
- Supporting both local preview and static export from the same content model

Lidex is a good fit when you want more structure than a plain Markdown site, but you do not want to build a full low-code system.

## Requirements

- Node.js `>=18`
- npm that ships with your Node installation

No database is required. No environment variables are required for the default preview flow.

## Install

```bash
npm install @lidex/lidex
```

## Create A Project

Use the interactive scaffolder to generate a full Lidex example site as a starting point:

```bash
npm create lidex@latest
```

or:

```bash
pnpm create lidex
```

The scaffolder asks for:

- project name
- theme preset

Right now it ships the `default` preset, which writes the bundled example site into your new project directory. The project content keeps the built-in `Lidex` copy; your chosen project name is used for the directory and generated project metadata.

## Quick Start

This section builds the smallest useful Lidex site from scratch.

### 1. Create A Site Folder

```text
my-site/
  lidex.config.js
  content/
    home.md
    news.md
    news/
      lidex-site-launched.md
  assets/
    _pages_/
      home/
        cover.jpg
    news/
      lidex-site-launched/
        cover.jpg
```

### 2. Add `lidex.config.js`

This config uses built-in templates and the built-in theme. You only need to declare custom template paths when you want to override them.

```js
module.exports = {
  site: {
    siteName: 'My Lab Site',
    siteSubtitle: 'Markdown-first research notes',
    footerText: '© 2026 My Lab Site',
  },
  pages: {
    home: {
      route: '/',
      source: 'content/home.md',
    },
    news: {
      route: '/news',
      source: 'content/news.md',
    },
  },
  blocks: {
    news: {
      template: 'cardGrid',
      fields: {
        title: { type: 'string', required: true },
        publishedAt: { type: 'string', required: true },
        category: { type: 'string', required: false },
      },
      hasDetailPage: true,
      contentDir: 'content/news',
      slugField: '_slug_',
      slugSourceField: 'title',
      route: '/news/:slug',
      detailTemplate: 'standardDetail',
    },
  },
};
```

### 3. Add A Homepage

`content/home.md`

```md
---
title: Home
eyebrow: Lidex Demo
lead: A tiny site powered by Markdown pages, blocks, and detail routes.
---

Welcome to the site.

:::query
from: news
sort: publishedAt:desc
limit: 3
template: compactList
:::
```

### 4. Add A Source Page With Structured Blocks

`content/news.md`

```md
---
title: News
lead: Updates indexed by Lidex.
---

:::news
_id_: id-news-launch
title: Lidex Site Launched
publishedAt: 2026-04-04
category: Release
:::
```

### 5. Add The Detail Markdown File

`content/news/lidex-site-launched.md`

```md
This detail page is matched by the title-derived slug.
```

At runtime, Lidex derives `lidex-site-launched` from `title`, then matches:

- `content/news/lidex-site-launched.md`
- `assets/news/lidex-site-launched/cover.*`
- `/news/lidex-site-launched`

`_id_` is the stable system identity for the entry. `_slug_` is the routed path key. If you omit `_slug_`, Lidex derives it from `slugSourceField`. In the managed-slug workflow (`slugField: '_slug_'`), you may omit `_id_` on first write and let preview/build generate it and write it back to the source files.

### 6. Start The Preview Server

If you are already inside the site root, `--root` is optional because Lidex defaults to the current working directory:

```bash
cd my-site
npx lidex --port 3001 --reload
```

If you want to launch the preview server from another directory, pass `--root` explicitly:

```bash
npx lidex --root ./my-site --port 3001 --reload
```

Open `http://127.0.0.1:3001`.

Preview reload behavior:

- `--reload` only affects preview server mode
- when enabled, Lidex watches the site config, `content/`, `templates/`, `assets/`, and the resolved theme directory
- on matching file changes, Lidex rebuilds the preview app and the browser refreshes automatically
- if you omit `--root`, Lidex expects `lidex.config.js` under the directory where you ran `npx lidex`

### 7. Build Static HTML

```bash
npx lidex --build --root ./my-site --out ./dist
```

Lidex will emit:

- `dist/index.html` for the homepage
- `dist/news/index.html` for the list page
- `dist/news/lidex-site-launched/index.html` for the detail page
- `dist/assets/*` for your project assets
- `dist/__lidex/theme/*` for the resolved theme assets

## How Lidex Thinks About Content

### 1. Pages

A page maps one route to one Markdown file:

```js
pages: {
  news: {
    route: '/news',
    source: 'content/news.md',
  },
}
```

Page Markdown does two jobs:

- frontmatter sets shell-level values such as `title`, `eyebrow`, `lead`, and optional hero media
- the body holds normal text plus block declarations and query declarations

If `heroImage` is omitted, Lidex looks for `assets/_pages_/<page-slug>/cover.*`.

### 1.1 Markdown Callouts

Page bodies and detail documents can also use a built-in `callout` directive. Unlike page blocks, `callout` does not need to be declared in `blocks` inside `lidex.config.js`.

```md
:::callout
type: warning
title: Route-sensitive copy
body: Use note, tip, warning, or danger when a paragraph needs stronger visual emphasis.
:::
```

Callout rules:

- required fields: `type`, `title`, `body`
- recommended `type` values: `note`, `tip`, `warning`, `danger`
- callouts stay in the Markdown flow, so they render in both page bodies and detail `bodyHtml`

### 2. Blocks

Blocks are structured items embedded inside a page:

```md
:::news
title: Lidex Site Launched
publishedAt: 2026-04-04
category: Release
:::
```

Each block type must be declared in `blocks` inside `lidex.config.js`. Lidex validates block fields against that declaration.

Blocks do not have to create routes. A block can also stay local to the page and render an interactive disclosure pattern. The bundled example now includes `accordionItem`, where each declaration is one expandable row and consecutive rows are rendered as one accordion group.

```js
accordionItem: {
  template: 'accordionItem',
  fields: {
    title: { type: 'string', required: true },
    summary: { type: 'string', required: true },
    body: { type: 'string', required: true },
  },
}
```

```md
:::accordionItem
title: What Makes A Good Block Contract?
summary: Keep the field set small, predictable, and obvious enough that another editor can infer the output shape from the declaration.
body: A strong block contract exposes only the fields the template actually needs, keeps names stable, and avoids hiding major behavior behind incidental copy fields.
:::

:::accordionItem
title: When Should A Block Get A Detail Route?
summary: Use a routed detail page when the list card needs to stay short but the content still deserves its own canonical URL and richer body.
body: If the content needs longer explanation, dedicated assets, or previous and next navigation, add a detail route. If it only needs a tighter in-page disclosure, an accordion is enough.
:::
```

Accordion behavior in the example site:

- each `accordionItem` declaration becomes one row
- consecutive `accordionItem` rows are wrapped into one accordion list automatically
- accordion items stay on the source page; they do not create detail routes
- clicking one row opens that row and closes any other open row in the same group
- clicking the open row again collapses it

### 3. Detail Pages

When a block has `hasDetailPage: true`, Lidex expects a second Markdown file inside `contentDir`.

For this config:

```js
news: {
  hasDetailPage: true,
  contentDir: 'content/news',
  slugField: '_slug_',
  slugSourceField: 'title',
  route: '/news/:slug',
  detailTemplate: 'standardDetail',
}
```

This block:

```md
:::news
_id_: id-news-launch
title: Lidex Site Launched
publishedAt: 2026-04-04
:::
```

must have:

```text
content/news/lidex-site-launched.md
```

Important rules:

- `_id_` and `_slug_` are reserved system fields
- `slugField` should point at `_slug_` for the managed-slug workflow
- if `_slug_` is absent, `slugSourceField` can derive it from another field such as `title`
- if `_slug_` is present, Lidex uses it after normalization
- when `slugSourceField` is set, Lidex normalizes the source value to lowercase letters and `-`
- Chinese titles are transliterated to pinyin before normalization
- the detail filename and detail asset directory must exactly match the derived slug
- `_pages_` is reserved for first-level page assets and cannot be used as a block name
- detail frontmatter overrides colliding list-block fields
- detail templates receive merged list fields, detail frontmatter, and `bodyHtml`

### 3.1 Editing Managed Entries

For detail-enabled blocks that use `_id_` / `_slug_`:

- `_id_` is optional on first write in the managed-slug workflow (`slugField: '_slug_'`); if it is missing, preview/build generates one and writes it back to the block declaration and detail file
- once `_id_` exists, keep it stable; Lidex uses it to recognize the same entry across preview/build runs
- if `_slug_` is omitted, changing `slugSourceField` data such as `title` renames the detail Markdown path, asset directory, and route on the next preview/build
- if `_slug_` is present, changing `title` does not move the route; the explicit `_slug_` wins
- if you change `_slug_` explicitly, Lidex treats that as a route/path rename and moves the matching detail Markdown file and asset directory on the next preview/build
- if you delete a block declaration, the old detail Markdown file and asset directory become orphaned; Lidex lists them and asks before deleting them

### 3.2 Implicit Vs Explicit `_slug_`

Implicit `_slug_` means the route key is derived from `slugSourceField`:

```md
:::news
_id_: id-news-launch
title: Lidex Site Launched
publishedAt: 2026-04-04
:::
```

With `slugSourceField: 'title'`, this resolves to:

- route: `/news/lidex-site-launched`
- detail doc: `content/news/lidex-site-launched.md`
- assets: `assets/news/lidex-site-launched/`

Explicit `_slug_` means the route key is pinned even if `title` changes:

```md
:::news
_id_: id-news-launch
_slug_: launch-2026
title: Lidex Site Launched
publishedAt: 2026-04-04
:::
```

This resolves to:

- route: `/news/launch-2026`
- detail doc: `content/news/launch-2026.md`
- assets: `assets/news/launch-2026/`

The bundled example site includes a real pinned-route entry at `/queries/release-notes-2026`, backed by `example/content/news/release-notes-2026.md`.

Editing consequences:

- change `title` only on the implicit form -> Lidex derives a new `_slug_` on the next preview/build
- change `title` only on the explicit form -> route and file paths stay unchanged
- change `_slug_` on the explicit form -> Lidex moves the matching detail doc and asset directory on the next preview/build

### 3.3 Recommended Authoring Habits

Use these defaults unless you have a specific routing reason not to:

- you may omit `_id_` when creating a new managed entry and let preview/build write one for you
- once `_id_` has been written, keep it stable forever
- omit `_slug_` for normal entries and let Lidex derive it from `slugSourceField`
- write `_slug_` explicitly only when you want to pin a route or filename
- change `title` freely when `_slug_` is explicit; the public path stays stable
- expect title changes to move the route only when `_slug_` is implicit
- treat `_slug_` edits as path changes, not copy edits

Recommended pattern for most entries:

```md
:::news
_id_: id-news-launch
title: Lidex Site Launched
publishedAt: 2026-04-04
category: Release
:::
```

Recommended pattern when the URL must stay fixed:

```md
:::news
_id_: id-news-launch
_slug_: launch-2026
title: Lidex Site Launched
publishedAt: 2026-04-04
category: Release
:::
```

### 4. Queries

Queries let one page render another page's indexed block items:

```md
:::query
from: news
sort: publishedAt:desc
limit: 3
template: compactList
:::
```

Supported concepts:

- `from`: block type to query
- `sort`: `field:asc` or `field:desc`
- `limit`: max number of items
- `offset`: pagination offset
- `where`: JSON condition object
- `template`: query template key

Example with filtering:

```md
:::query
from: news
where: {"all":[{"field":"category","op":"eq","value":"Release"}]}
sort: publishedAt:desc
limit: 5
template: compactList
:::
```

The queried items can still keep their original list page and detail routes. A query is an alternate view over indexed content, not a content clone.

### 5. Detail Pagination

If a detail-enabled block type also sets `enablePagination: true`, Lidex builds previous/next links for its detail pages.

```js
feature: {
  hasDetailPage: true,
  enablePagination: true,
  // ...
}
```

Inside Markdown block declarations, reserved system fields use the `_xx_` form. For pagination order, use the reserved `_page_` field:

```md
:::feature
title: Markdown First
_page_: 1
:::
```

Ordering rules:

- if no item in that block type declares `_page_`, Lidex uses page-key order, then declaration order
- items with explicit `_page_` values are ordered numerically
- if multiple pages overlap on the same `_page_` range, Lidex groups by page key and keeps stable ordering within each group
- items without `_page_` are appended after the last explicit cluster for their page, in declaration order

That gives you a global detail-page sequence across multiple source pages without inventing a separate routing layer.

### 5.1 Reserved Names And Paths

Lidex uses a small set of reserved names for system-managed behavior. Treat these as contracts, not as ordinary author-defined names.

Reserved names in Markdown block declarations:

- reserved block fields in page body use the `_xx_` form
- currently recognized reserved block fields are `_id_`, `_slug_`, and `_page_`
- `_id_` is the stable managed identity for detail-enabled entries
- `_slug_` is the managed or explicit routed slug for detail-enabled entries
- `_page_` is the pagination anchor when that block type sets `enablePagination: true`
- any other `_xx_` field in a block declaration is rejected as an unknown reserved system field
- reserved `_xx_` names must not be declared inside `config.blocks.<name>.fields`

Reserved block names and asset directories:

- `_pages_` is reserved for first-level page asset directories such as `assets/_pages_/home/cover.webp`
- `_pages_` must not be used as a block name

Reserved managed output under the project root:

- `.lidex/managed-content.json` is generated during preview/build as a managed metadata snapshot
- `.lidex/build/` is the default internal build output used by publish
- `.lidex/publish-history/` stores publish and rollback snapshots
- treat the `.lidex/` namespace as system-owned; do not rely on hand-edited content inside it

Non-reserved but easy to confuse:

- `backup/` is not a reserved folder name; it has no built-in meaning unless you explicitly point `outDir`, `targetDir`, or `historyDir` at it
- `dist/`, `published/`, and `lidex.config.js` are defaults, not hard-reserved names; you can override them through options or config

## Configuration Reference

The main entry point is `lidex.config.js`.

### Top-Level Keys

| Key | Purpose |
| --- | --- |
| `site` | Site-wide shell values such as title, subtitle, footer text |
| `tailwind` | Enable local Tailwind CSS compilation from `theme/tailwind.css` |
| `head` | External head assets such as CDN stylesheets and scripts |
| `pages` | Route to Markdown page mapping |
| `blocks` | Block type definitions and detail-route contracts |
| `templates` | Custom template path map |
| `queryTemplates` | Custom query template path map |
| `theme` | Theme directory and asset overrides |

### `site`

Example:

```js
site: {
  siteName: 'Lidex',
  siteSubtitle: 'Declarative Markdown Site Engine',
  footerText: '© 2026 Lidex',
  siteUrl: 'https://example.com',
}
```

These values are available to the page shell template.

SEO-related `site` values:

- `siteUrl` is the absolute site origin used for canonical URLs, `og:url`, `sitemap.xml`, and `robots.txt`
- `seo.emitKeywordsMeta` is optional and defaults to `false`; when enabled, Lidex emits `<meta name="keywords">` from `seo.keywords`

### `pages`

Example:

```js
pages: {
  home: {
    route: '/',
    source: 'content/home.md',
  },
  docs: {
    route: '/docs',
    source: 'content/docs.md',
  },
}
```

Rules:

- page keys must be unique
- routes must be unique
- page source paths are resolved relative to `rootDir`

### `tailwind`

Use the boolean switch when you want Lidex to compile a local Tailwind entry file during preview and static build:

```js
tailwind: true,
```

When enabled, Lidex expects:

- `theme/tailwind.css` to exist inside your theme directory
- the file to contain your Tailwind imports, for example `@import "tailwindcss";`
- compiled output to be written to `theme/tailwind.generated.css`

The generated stylesheet is then served in preview and copied into static build output automatically.

### `head`

Use `head` when you want Lidex to inject external assets such as Google Fonts or custom scripts into `<head>` without editing every shell template.

```js
head: {
  stylesheets: [
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap',
  ],
},
```

Rules:

- `stylesheets` must be an array of stylesheet URLs
- `scripts` must be an array of script URLs
- Lidex injects them before `</head>` for both preview and static build output
- this is optional and defaults to empty arrays

### SEO Frontmatter

Page frontmatter and detail frontmatter can override SEO values with flat `seo.*` keys:

```md
---
title: Lidex
description: Declarative Markdown site engine
seo.title: Lidex SEO Title
seo.description: Search summary override
seo.image: /assets/public/share-card.webp
seo.imageAlt: Lidex share card
seo.canonical: https://example.com/custom-url
seo.noindex: false
seo.keywords: markdown site engine, static publishing
---
```

Fallback rules:

- `seo.title` -> `title`
- `seo.description` -> `description` -> `lead` -> `summary`
- `seo.image` -> `heroImage` -> `coverImage`
- `seo.imageAlt` -> `heroAlt` -> `title`
- `seo.canonical` -> `site.siteUrl + route`
- `seo.noindex` -> `false`
- `seo.keywords` -> stored as normalized keywords, but not emitted as `<meta name="keywords">` unless `site.seo.emitKeywordsMeta` is enabled

### `blocks`

Example:

```js
blocks: {
  feature: {
    template: 'featureCard',
    fields: {
      title: { type: 'string', required: true },
      summary: { type: 'string', required: true },
    },
    hasDetailPage: true,
    contentDir: 'content/features',
    slugField: '_slug_',
    slugSourceField: 'title',
    route: '/features/:slug',
    detailTemplate: 'featureDetail',
  },
}
```

Block rules:

- every used block type must exist in `blocks`
- every declared field used in Markdown must be listed in `fields`
- missing required fields throw during index build
- undeclared fields throw during index build
- `_id_`, `_slug_`, `_page_`, and other `_xx_` names are reserved for system-managed fields and must not be declared in `fields`
- if `hasDetailPage: true`, then `contentDir`, `slugField`, `route`, and `detailTemplate` are required
- `slugSourceField` is optional and lets Lidex derive the routed slug from a field such as `title`
- detail routes must include `:slug`

### Built-In Defaults

If you do not override them, Lidex provides:

- page shell: `templates/page-shell.html`
- block template key: `cardGrid`
- detail template key: `standardDetail`
- query template key: `compactList`
- theme files: `theme/base.css`, `theme/components.css`, `theme/app.js`

That means a small project can start with built-in resources and only override the parts it actually wants to customize.

## Templates

Lidex uses four template layers:

- `page-shell`: the shared outer page chrome, including `<head>`, navigation, footer, and the main content frame
- `block`: the template for a block declaration rendered inside a page body
- `detail`: the template for a detail-enabled block's routed second-level page
- `query`: the template for a query result view rendered from indexed content

### Built-In Template Paths

The package ships these built-ins:

- page shell: `templates/page-shell.html`
- block template: `templates/blocks/card-grid.html`
- detail template: `templates/details/standard-detail.html`
- query template: `templates/query/compact-list.html`

### Custom Template Example

```js
templates: {
  pageShell: 'templates/page-shell.html',
  featureCard: 'templates/blocks/feature-card.html',
  featureDetail: 'templates/details/feature-detail.html',
},
queryTemplates: {
  homepageNews: 'templates/query/homepage-news.html',
},
```

Then reference those keys from block declarations:

```js
feature: {
  template: 'featureCard',
  detailTemplate: 'featureDetail',
}
```

### Template Features

Supported rendering features are intentionally small:

- `{{field}}` for escaped values
- `{{{htmlField}}}` for raw HTML values
- `{{#items}}...{{/items}}` for repeating arrays

Useful context values:

- detail templates receive merged list fields + detail frontmatter + `bodyHtml`
- detail-enabled block templates receive `detailRoute`
- query items can use source fields plus `detailRoute`
- the page shell receives `contentHtml`, shell-level site fields, and theme asset HTML

### Shell Theme Injection

Modern shells should use:

- `{{{themeStylesheetsHtml}}}`
- `{{{themeScriptHtml}}}`

External `head` assets are injected automatically before `</head>`, so shells do not need extra placeholders for configured CDN links or scripts.

Older shells can still use:

- `{{themeCssHref}}`
- `{{themeJsSrc}}`

## Themes

Lidex themes are file-based. The recommended split is:

```text
theme/
  theme.json
  base.css
  components.css
  app.js
```

Recommended responsibility split:

- `base.css`: page-level foundations such as body, typography, headings, links, tables, and reading rhythm
- `components.css`: block cards, query lists, detail layouts, and other reusable pieces
- `app.js`: optional theme behavior

### `theme.json`

Example:

```json
{
  "name": "Example",
  "author": "Example Author",
  "version": "1.0.0",
  "description": "A light editorial theme for Lidex",
  "baseCss": "base.css",
  "componentsCss": "components.css",
  "appJs": "app.js"
}
```

All fields are optional. When present, they must be strings.

### Theme Config In `lidex.config.js`

```js
theme: {
  directory: 'assets/public',
  baseCss: 'base.css',
  componentsCss: 'components.css',
  appJs: 'app.js',
}
```

Priority order:

1. Lidex defaults
2. `theme/theme.json`
3. `theme` overrides from `lidex.config.js`

Legacy compatibility:

- if `base.css` and `components.css` are absent but `site.css` exists, Lidex falls back to `site.css`

## API

```js
const {
  buildSite,
  createApp,
  listPublishHistory,
  publishSite,
  rollbackSite,
  startServer,
} = require('@lidex/lidex');
```

### `createApp(options)`

Creates an Express-compatible app.

Common options:

- `rootDir`
- `config`
- `adminUser`
- `adminPassword`
- `adminPath`

### `startServer(options)`

Starts the preview server and returns the Node server instance.

Common options:

- `rootDir`
- `port`
- `host`
- `config`
- `reload`
- `adminUser`
- `adminPassword`
- `adminPath`

### `buildSite(options)`

Builds static HTML to disk.

Common options:

- `rootDir`
- `outDir`
- `config`

### `publishSite(options)`

Builds the site, snapshots the existing target if needed, and copies the build into the publish target.

Common options:

- `rootDir`
- `targetDir`
- `historyDir`
- `outDir`
- `config`

### `rollbackSite(options)`

Restores one publish-history snapshot into the target directory.

Common options:

- `rootDir`
- `targetDir`
- `historyDir`
- `rollbackId`

### `listPublishHistory(options)`

Returns publish-history entries, optionally filtered by `targetDir`.

## CLI

Basic preview:

```bash
npx lidex --root ./example --port 3001 --host 127.0.0.1
```

Preview with automatic reload:

```bash
npx lidex --root ./example --port 3001 --reload
```

If you run Lidex from inside the site root, `--root` is optional and defaults to the current working directory:

```bash
cd example
npx lidex --reload
```

Before preview or static build, Lidex creates any missing managed detail files and asset folders, writes generated `_id_` values back into managed block declarations when needed, and asks before deleting orphaned managed detail files or asset directories.

Preview reload notes:

- `--reload` only applies to preview server mode
- Lidex reloads when `lidex.config.js`, `content/`, `templates/`, `assets/`, or the resolved theme directory changes
- reload is implemented as a preview server restart plus a browser auto-refresh check
- if `--root` is omitted, Lidex resolves the site root from the directory where the command is executed

SEO automation during preview and build:

- preview serves live `GET /sitemap.xml`
- preview serves live `GET /robots.txt`
- preview uses `site.siteUrl` when present, otherwise falls back to the current request host for canonical and SEO route output
- build writes `sitemap.xml` into the output directory when `site.siteUrl` is configured
- build writes `robots.txt` into the output directory when `site.siteUrl` is configured
- canonical, Open Graph, and Twitter metadata are injected automatically with the fallback rules above

### Supported Flags

| Flag | Meaning |
| --- | --- |
| `--build` | Build static output |
| `--publish` | Build then publish into a target directory |
| `--list-history` | Print publish history JSON |
| `--rollback <publishId>` | Restore one history entry |
| `--root <dir>` | Site root directory |
| `--reload` | Enable preview auto-reload on file changes |
| `--out <dir>` | Build output directory |
| `--target <dir>` | Publish target directory |
| `--history-dir <dir>` | Custom publish-history directory |
| `--port <number>` | Preview server port |
| `--host <host>` | Preview server host |
| `--config <file>` | Config filename under the site root |
| `--admin-path <path>` | Custom admin path |

Unknown flags, missing values, and invalid `--port` values fail fast with a non-zero exit code.

When a CLI command returns a plain object, Lidex prints it as JSON. That applies to build, publish, rollback, and history commands.

## Build Publish And Rollback

### Build

```bash
lidex --build --root ./example --out ./dist
```

Output rules:

- page routes are written as `index.html` under their route path
- detail routes are also emitted as `index.html`
- the project `assets/` directory is copied to `dist/assets`
- the resolved theme directory is copied to `dist/__lidex/theme`

### Publish

```bash
lidex --publish --root ./example --target ./published
```

Behavior:

- build output defaults to `.lidex/build`
- if the target directory already exists, Lidex snapshots it into `.lidex/publish-history/<publishId>/site`
- each history entry also stores `meta.json`

### List History

```bash
lidex --list-history --root ./example --target ./published
```

### Rollback

```bash
lidex --rollback 20260404T120000123Z --root ./example --target ./published
```

Rollback behavior:

- Lidex restores the selected snapshot back into the target directory
- before restore, Lidex snapshots the current target as a `rollback-backup` entry

## Admin Editing

Admin editing is optional and only available in server mode.

Enable it by passing credentials into `createApp()` or `startServer()`:

```js
startServer({
  rootDir: process.cwd(),
  adminUser: 'admin',
  adminPassword: 'secret',
  adminPath: '/manage',
});
```

Available routes:

- `GET /admin` by default, or `GET <adminPath>`
- `GET <adminPath>/api/files?dir=content`
- `GET <adminPath>/api/file?path=content/example.md`
- `PUT <adminPath>/api/file?path=content/example.md`
- `GET <adminPath>/api/assets`

Rules:

- admin file access is limited to `content/` and `assets/`
- successful content writes rebuild the in-memory index immediately
- admin editing is still file-oriented; it does not provide a separate UI flow for creating or renaming detail entries
- server mode reflects edits immediately after save
- static builds do not update automatically; you must run build or publish again

## Example Site Walkthrough

This repository ships a full example site under [example/](example/).

Run it locally:

```bash
npx lidex --root ./example --port 3001
```

The example is intentionally organized as documentation:

- `/` shows syntax on the page and then renders those same declarations
- `/docs` explains the content model
- `/design` explains project structure and runtime choices
- `/blocks` explains structured block declarations and pagination order
- `/details` explains detail-file matching and field override behavior
- `/queries` explains query blocks
- `/theme` explains the theme split and asset ownership

Useful example files:

- config: [example/lidex.config.js](example/lidex.config.js)
- homepage: [example/content/home.md](example/content/home.md)
- block tutorial page: [example/content/blocks.md](example/content/blocks.md)
- query source page: [example/content/news.md](example/content/news.md)
- feature detail doc: [example/content/features/markdown-first.md](example/content/features/markdown-first.md)
- shell template: [example/templates/page-shell.html](example/templates/page-shell.html)
- theme base: [example/assets/public/base.css](example/assets/public/base.css)
- theme components: [example/assets/public/components.css](example/assets/public/components.css)
- theme behavior: [example/assets/public/app.js](example/assets/public/app.js)

## Package Structure

```text
bin/
  lidex.js                # CLI entry
src/
  build/                  # Static export
  cli/                    # CLI parsing and dispatch
  config/                 # Defaults and config loading
  content/                # Markdown loading and indexing
  publish/                # Publish, rollback, history
  query/                  # Query execution
  render/                 # Template rendering
  runtime/                # Shared runtime creation
  server/                 # Express app and route registration
  theme/                  # Theme manifest and asset resolution
  utils/                  # Shared errors and helpers
templates/
  ...                     # Built-in templates
theme/
  ...                     # Built-in theme
example/
  ...                     # Full teaching/demo site
test/
  ...                     # Automated coverage
```

## Testing

Run all tests:

```bash
npm test
```

Run lint:

```bash
npm run lint
```

Useful local checks while working on the scaffolder:

```bash
node packages/create-lidex/bin/create-lidex.js
npm pack --dry-run --prefix packages/create-lidex
```

The test suite covers:

- config loading
- content indexing
- query execution
- page and detail rendering
- static build
- publish and rollback
- CLI behavior
- example site contracts

## Current Limitations

The current Markdown body renderer is intentionally small.

Today Lidex does not implement a full Markdown parser for page and detail body copy. Body content currently supports escaped paragraphs plus fenced code blocks, but features such as headings, lists, tables, inline links, and broader inline Markdown syntax are not yet parsed from body text.

That means:

- frontmatter is supported
- block declarations are supported
- query declarations are supported
- fenced code blocks are supported
- raw HTML is escaped in normal Markdown body content

If you need richer body rendering, that should be added as an explicit engine capability rather than being assumed silently.



