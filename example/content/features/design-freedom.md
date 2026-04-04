---
title: Design Freedom
description: Replace the surface layer locally without forking the engine runtime.
eyebrow: Feature Detail
lead: Keep engine behavior stable, but let each project own its shell, templates, and theme files.
heroImage: /assets/public/favicon.svg
heroAlt: Lydex feature icon
kicker: Local override
summary: Swap shells, cards, and detail templates without forking the engine.
proof: Theme + templates
why: Design changes stay isolated to the site using Lydex instead of leaking back into engine code.
touchpoint: Page shell, block templates, query templates, detail templates, and theme assets.
_id_: id-9c41ff3e-3676-448c-bdd3-e610a2e283cd
---

This repository demonstrates that split directly. The routing, indexing, build, publish, and rollback logic live in the package code. The visible site styling and markup live under `example/templates/` and `example/assets/public/`.

That means a consuming project can replace its page shell, choose a new block card layout, or ship a completely different theme without editing the engine internals. The package should own behavior contracts. The project should own presentation decisions.

When you customize Lydex, start by asking which layer really needs to change. If the route and data contract stay the same, you probably only need a template or theme override. That keeps customization local and keeps the engine reusable.