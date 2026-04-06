---
title: Markdown First
description: Keep the authoring surface close to the site root instead of spreading it across custom code.
eyebrow: Feature Detail
lead: Start with files and folders, then add structure only where reusable content or routing actually needs it.
heroImage: /assets/public/favicon.svg
heroAlt: Lidex feature icon
kicker: Local content
summary: Keep pages, lists, and detail docs editable inside one site root.
proof: Pages + details
why: Authors can update content structure without hunting through route code or component trees.
touchpoint: Markdown pages, block declarations, and matching detail docs.
_id_: id-ea6f359c-0eb8-4e5a-b1b1-ccd3315751f3
---

A good Lidex project should be explainable as a folder tree. Someone should be able to open the root and understand where pages live, where list declarations live, where detail docs live, and where design overrides live without learning framework internals first.

That is why this example keeps the source of truth in files such as `example/content/home.md`, `example/content/news.md`, and `example/content/features/markdown-first.md`. The config describes how those files relate, but the content itself remains in Markdown instead of disappearing into hidden runtime state.

```text
example/
  lidex.config.js
  content/
    home.md
    news.md
    features/
      markdown-first.md
  templates/
  assets/
```

In practice, the easiest way to teach a new editor is this: page routes come from `pages`, structured declarations come from block syntax inside the page Markdown, and richer routed content comes from title-derived files inside the configured detail directory. Once that mental model clicks, the rest of Lidex stays small.

```md
---
title: Home
---

:::feature
title: Markdown First
...
:::
```
