# SEO Auto Maintenance Design

**Goal**

为 Lydex 增加一层自动维护的 SEO 基础设施，在不要求作者逐页手写完整 `<head>` 的前提下，统一维护页面 metadata、`sitemap.xml` 和 `robots.txt`。

**Scope**

- 支持 `site.siteUrl` 作为绝对 URL 基础
- 支持 page frontmatter 与 detail frontmatter 中的 `seo.*` 平铺键
- 自动维护 `title`、`description`、canonical、Open Graph、Twitter Card
- build 输出 `sitemap.xml` 与 `robots.txt`
- preview 提供 `/sitemap.xml` 与 `/robots.txt`
- `seo.keywords` 可自定义，但默认不输出 `<meta name="keywords">`

**Fallback Rules**

- `seo.title` -> `title`
- `seo.description` -> `description` -> `lead` -> `summary`
- `seo.image` -> `heroImage` -> `coverImage`
- `seo.imageAlt` -> `heroAlt` -> `title`
- `seo.canonical` -> `site.siteUrl + route`
- `seo.noindex` -> `false`
- `seo.keywords` -> empty list

**Out of Scope**

- 第一阶段不做 JSON-LD
- 第一阶段不做 hreflang
- 第一阶段不做 AI crawler 专项策略
