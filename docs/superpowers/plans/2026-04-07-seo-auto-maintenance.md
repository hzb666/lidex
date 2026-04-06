# SEO Auto Maintenance Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 page/detail 页面自动维护 SEO metadata，并在 build/preview 中自动维护 `sitemap.xml` 和 `robots.txt`。

**Architecture:** 新增独立 SEO 解析层，基于 page/detail 上下文计算回退后的 SEO 元数据，再由页面渲染和 build/preview 入口共享。模板不强制改造，优先通过渲染后注入 `<head>` 的方式兼容现有 page shell。

**Tech Stack:** Node.js, CommonJS, node:test, Express

---

### Task 1: 写 build 侧失败测试

**Files:**
- Modify: `test/build/build-site.test.js`

- [ ] **Step 1: 写测试，要求 build 输出 canonical/OG/Twitter metadata**
- [ ] **Step 2: 写测试，要求 build 输出 `sitemap.xml` 和 `robots.txt`**
- [ ] **Step 3: 运行目标测试并确认失败**

### Task 2: 写 preview 侧失败测试

**Files:**
- Modify: `test/server/create-app.test.js`

- [ ] **Step 1: 写测试，要求 preview 页面注入 metadata**
- [ ] **Step 2: 写测试，要求 preview 暴露 `/sitemap.xml` 和 `/robots.txt`**
- [ ] **Step 3: 运行目标测试并确认失败**

### Task 3: 实现 SEO 元数据解析和页面注入

**Files:**
- Create: `src/seo/resolve-seo.js`
- Create: `src/seo/render-seo-head.js`
- Modify: `src/server/register-page-routes.js`
- Modify: `src/server/register-detail-routes.js`
- Modify: `src/build/build-site.js`

- [ ] **Step 1: 实现 `seo.*` 平铺键读取和默认回退**
- [ ] **Step 2: 实现现有 HTML 的 `<head>` 注入/替换**
- [ ] **Step 3: 跑目标测试直到通过**

### Task 4: 实现 sitemap 和 robots 自动维护

**Files:**
- Create: `src/seo/build-sitemap.js`
- Create: `src/seo/build-robots.js`
- Create: `src/server/register-seo-routes.js`
- Modify: `src/build/build-site.js`
- Modify: `src/server/create-app.js`

- [ ] **Step 1: 实现 build 输出 `sitemap.xml` 和 `robots.txt`**
- [ ] **Step 2: 实现 preview 路由**
- [ ] **Step 3: 处理 `adminPath` 与 `noindex` 过滤**
- [ ] **Step 4: 跑目标测试直到通过**

### Task 5: 更新文档与回归

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 增加 `site.siteUrl` 与 `seo.*` 字段说明**
- [ ] **Step 2: 说明 `sitemap.xml` 与 `robots.txt` 的自动维护行为**
- [ ] **Step 3: 运行定向回归并汇总剩余风险**
