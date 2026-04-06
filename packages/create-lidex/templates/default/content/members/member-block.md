---
title: Member Block
description: The member block shows how a declaration can open a dedicated Markdown detail page.
eyebrow: Declaration Pattern
lead: Detail-enabled declaration
heroImage: /assets/placeholders/avatar.webp
heroAlt: Member block placeholder
role: Detail-enabled declaration
year: Fields: title, name, role, year
summary: The member block demonstrates how list fields connect to a title-derived Markdown detail document.
focus: Inline declarations, slug generation, merged fields
email: member-block@lidex.example
---

This example keeps the `member` block shaped like a profile card, but the underlying pattern is broader. A block item lives inside the list page, while a second Markdown file with the derived slug carries the richer context for the detail route.

In configuration, that behavior comes from `hasDetailPage`, `contentDir`, `slugField`, `slugSourceField`, `_id_`, `_slug_`, `route`, and `detailTemplate`. In templates, the detail page receives the merged field set directly, so placeholders such as `{{title}}`, `{{summary}}`, and `{{{bodyHtml}}}` stay simple.

