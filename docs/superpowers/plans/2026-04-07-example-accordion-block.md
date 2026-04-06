# Example Accordion Block Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 example 站点中新增 `accordionItem` block，支持折叠列表结构、单项展开交互，并为 `example/lydex.config.js` 的每个项补英文注释。

**Architecture:** 复用现有单条 block 声明模型，让连续的 `accordionItem` 在页面渲染时自动包成一个 accordion 组。交互放在 example theme JS，样式放在 example theme CSS，不改 block 解析语法。

**Tech Stack:** Node.js, CommonJS, Express rendering, node:test

---

### Task 1: 写 example 页面失败测试

**Files:**
- Modify: `test/server/create-app.test.js`

- [ ] **Step 1: 写测试，要求 `/blocks` 渲染 accordion 结构**
- [ ] **Step 2: 写测试，要求 theme app.js 包含 accordion 初始化代码**
- [ ] **Step 3: 运行目标测试并确认失败**

### Task 2: 实现 accordion block

**Files:**
- Modify: `example/lydex.config.js`
- Modify: `example/content/blocks.md`
- Modify: `src/server/register-page-routes.js`
- Create: `example/templates/blocks/accordion-item.html`
- Modify: `example/assets/public/components.css`
- Modify: `example/assets/public/app.js`

- [ ] **Step 1: 新增 `accordionItem` block 配置**
- [ ] **Step 2: 给 `example/lydex.config.js` 全量补英文注释**
- [ ] **Step 3: 新增 block 模板与内容示例**
- [ ] **Step 4: 让连续项自动形成 accordion wrapper**
- [ ] **Step 5: 实现单项展开/收起交互**
- [ ] **Step 6: 再跑目标测试直到通过**
