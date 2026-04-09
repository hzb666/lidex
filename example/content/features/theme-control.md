---
title: Theme Control
description: Keep the visual system in project-owned theme files instead of coupling style decisions to the engine runtime.
eyebrow: Feature Detail
lead: A Lidex site can change brand, motion, shell styling, and query presentation without forking the core package.
heroImage: /assets/public/favicon.svg
heroAlt: Lidex feature icon
kicker: Theme control
summary: Own the shell, cards, and query output without rewriting the engine.
proof: Theme + query templates
why: Visual changes stay local to the site, so engine upgrades do not become redesign projects.
touchpoint: Theme assets, shared shell styles, block cards, and query templates.
_id_: id-1db6ee2b-7c46-4e5b-9a63-3d6bb9f6e511
---

Lidex keeps presentation decisions in the site layer on purpose. The engine handles routing, indexing, and content assembly. The project theme decides how those routed pages feel once they reach the browser.

That separation gives you room to change typography, spacing, color, interaction scripts, or query card styling without rewriting the runtime. You can keep the content model stable while the site evolves visually around it.

When you want a new visual identity, start with the theme files and templates first. If the content contract and routes still make sense, the engine should stay untouched.