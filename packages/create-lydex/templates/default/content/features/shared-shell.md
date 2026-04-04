---
title: Shared Shell
description: A single shell keeps navigation, layout rhythm, and interaction patterns aligned across the site.
eyebrow: Feature Detail
lead: The shell defines the chrome once, then Lydex feeds each route its own header and body content.
heroImage: /assets/public/favicon.svg
heroAlt: Lydex feature icon
kicker: Consistent chrome
summary: Keep navigation, hero framing, and page rhythm aligned across routes.
proof: Shell + routes
why: The site feels coherent even when different page types use different block or query templates underneath.
touchpoint: Shared page shell, per-page frontmatter, theme asset injection, and route registration.
_id_: id-5ceb2732-0cf2-40e1-851c-65d3b7cc6cf2
---

Every route in this example renders through the same page shell template at `example/templates/page-shell.html`. The shell is responsible for the global frame: navigation, head assets, footer, and the common container structure around page content.

Each page still gets its own header because Lydex passes frontmatter such as `title`, `eyebrow`, `lead`, `heroImage`, and `heroAlt` into the header builder. That is how the homepage can keep a full-screen visual treatment while the inner pages use a more compact intro block.

The shell stays powerful precisely because it is not trying to own every card layout. Blocks, details, and queries keep their own templates. The shell just guarantees that all those route types still live inside the same site chrome.
