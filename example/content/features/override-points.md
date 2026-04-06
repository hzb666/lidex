---
title: Override Points
description: Lidex keeps rendering layers separate so each layer can evolve without collapsing into one large template.
eyebrow: Feature Detail
lead: Customization stays maintainable when each layer has a clear responsibility and a clear lookup key.
heroImage: /assets/public/favicon.svg
heroAlt: Lidex feature icon
kicker: Layered rendering
summary: Separate page shells, block cards, query templates, and detail layouts.
proof: Clean boundaries
why: You can change one surface without accidentally rewriting all the others.
touchpoint: Configuration keys, template lookup, theme resolution, and per-layer overrides.
_id_: id-75529c79-3c66-430e-b3fc-83a6079b5649
---

This example exposes the main override points you need in real work. `pageShell` controls outer structure, block templates control list items, detail templates control routed long-form pages, query templates control alternate indexed views, and the theme controls the visual system.

Those layers stay independent on purpose. The homepage query card is not forced to reuse the original `news` block template, and the `feature` detail page is not forced to reuse the `feature` list card. That independence is what keeps Lidex flexible without turning it into a giant monolithic template.

When you document a custom site for other people, explain those override points explicitly. It makes future maintenance much easier because contributors know whether a change belongs in config, content, template markup, or theme CSS.