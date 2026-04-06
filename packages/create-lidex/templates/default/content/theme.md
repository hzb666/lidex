---
title: Theme
description: Theme assets and visual templates remain replaceable in a Lidex site.
eyebrow: Theme & Assets
lead: Lidex recommends splitting global foundation styles from component styles so shared themes stay reusable and local overrides stay understandable.
---

This example uses `example/assets/public/` as its theme directory. Inside it, `base.css` owns the page foundation and typography, `components.css` owns card and detail styling, `app.js` owns theme behavior, and `theme.json` describes the theme bundle. Lidex injects the resolved stylesheets into the page shell automatically.

```json
{
  "name": "Lidex Example Theme",
  "baseCss": "base.css",
  "componentsCss": "components.css",
  "appJs": "app.js"
}
```

That split matters because people share themes differently from templates. A theme should be able to define page background, typography, spacing rhythm, and component surfaces without rewriting route registration or content indexing logic. Likewise, a project should be able to replace one block template without copying the whole theme.

Theme resolution also keeps backward compatibility. If a project still has only `site.css`, Lidex falls back to that file. Newer projects should prefer `base.css` plus `components.css`, because it makes it much easier to separate shell-level design from block-level design.

```js
theme: {
  directory: 'assets/public',
}
```

Assets are still owned by the site root. This example keeps page-specific images under `example/assets/_pages_/`, detail covers under folders such as `example/assets/news/declarative-query-examples-expanded/`, and shared theme files under `example/assets/public/`. During static build, the whole `assets/` directory is copied into the build output, while the resolved theme directory is copied to `__lidex/theme`.

If you want to customize a theme in a real project, start by copying the example split: one foundational stylesheet, one component stylesheet, and one optional behavior file. Then change the page shell or block templates only when the structure itself needs to change.

:::photo
title: Base CSS Owns The Page Foundation
caption: Put the body backdrop, typography, headings, and shell-level spacing rhythm in `base.css`, not in every individual block template.
photo: /assets/placeholders/photo.webp
date: base.css
:::

:::photo
title: Components CSS Owns Block Surfaces
caption: Card layouts, query lists, detail pagination controls, and image frame treatments belong in `components.css`.
photo: /assets/placeholders/photo.webp
date: components.css
:::

:::photo
title: Theme JS Stays Optional
caption: Use `app.js` only for behavior such as image loading states, scroll hints, or other theme-specific runtime polish.
photo: /assets/placeholders/photo.webp
date: app.js
:::

