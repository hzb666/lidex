---
title: Example Starter Reorganised
description: The bundled example was rewritten as a Lydex explanation site while keeping the same engine behavior.
eyebrow: Example Update
lead: The example now teaches real usage instead of acting as a generic placeholder site, while still exercising the same runtime contracts.
heroImage: /assets/placeholders/photo.webp
heroAlt: Example update placeholder
publishedAt: 2026-02-18
category: Example
summary: The content changed, but the package behavior stayed the same, which is exactly the point of a reusable site engine.
_id_: id-0837bc61-7668-48a5-9621-df5ce91e7872
---

The example site is meant to answer a practical question: if someone installs Lydex, what files do they create first and how do those files relate. That is why the current example keeps concepts, setup, blocks, details, queries, and theme as separate readable pages.

It also doubles as a runtime exercise. The same example covers homepage rendering, block rendering, detail routes, query templates, theme injection, and image-loading behavior. Changing the copy should not require changing the engine, and the tests make sure that remains true.

If you are adapting Lydex for your own project, use this example as a structural reference first and a visual reference second. The important parts are the file layout, the route mapping, the block declarations, and the override boundaries.
