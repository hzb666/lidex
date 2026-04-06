# Reserved Field Metadata Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一正文 block 保留字段为 `_xx_` 形式，使用 `_page_` 取代旧的 `page` 分页保留字段，并在 preview/build 时输出一份受管元数据 JSON 供排障使用。

**Architecture:** 在内容解析层集中收口保留字段规则，把 `_page_` 作为条件性系统字段接入分页排序校验。受管内容同步阶段复用现有 page/node 扫描结果，生成 `.lydex/managed-content.json`，由 preview/build 共用同一套写入逻辑。

**Tech Stack:** Node.js, CommonJS, node:test, 现有 Lydex content/build/server 模块

---

## Chunk 1: 保留字段与分页切换

### Task 1: 先写 `_page_` 语义切换的失败测试

**Files:**
- Modify: `test/content/build-content-index.test.js`

- [ ] **Step 1: 写测试，要求启用分页时接受 `_page_`**
- [ ] **Step 2: 运行目标测试，确认当前实现失败**
- [ ] **Step 3: 写最小实现，把分页保留字段从 `page` 切到 `_page_`**
- [ ] **Step 4: 再跑目标测试，确认通过**

### Task 2: 写测试，要求旧 `page` 退回普通字段

**Files:**
- Modify: `test/content/build-content-index.test.js`

- [ ] **Step 1: 写测试，验证未声明的 `page` 会按普通字段报 undeclared**
- [ ] **Step 2: 运行目标测试，确认当前实现失败**
- [ ] **Step 3: 调整字段校验逻辑，只为 `_page_` 保留分页语义**
- [ ] **Step 4: 再跑目标测试，确认通过**

## Chunk 2: 受管元数据 JSON

### Task 3: 先写 build 阶段元数据文件测试

**Files:**
- Modify: `test/build/build-site.test.js`
- Modify: `src/content/managed-content.js`
- Create: `src/content/managed-metadata.js`

- [ ] **Step 1: 写测试，要求 `buildSite()` 后存在 `.lydex/managed-content.json` 且包含 `_id_`、resolved slug、slug 来源字段、其他保留字段**
- [ ] **Step 2: 运行目标测试，确认当前实现失败**
- [ ] **Step 3: 实现元数据收集与写盘逻辑，并接到 `synchronizeManagedContent()`**
- [ ] **Step 4: 再跑目标测试，确认通过**

### Task 4: 补 preview 阶段写盘测试

**Files:**
- Modify: `test/server/create-app.test.js`

- [ ] **Step 1: 写测试，要求 `createApp()` 后同样写出 `.lydex/managed-content.json`**
- [ ] **Step 2: 运行目标测试，确认当前实现失败**
- [ ] **Step 3: 复用已有同步逻辑，不额外分叉 preview/build 行为**
- [ ] **Step 4: 再跑目标测试，确认通过**

## Chunk 3: 示例与文档收尾

### Task 5: 更新 README、example、template 中的 `_page_`

**Files:**
- Modify: `README.md`
- Modify: `example/content/*.md`
- Modify: `packages/create-lydex/templates/default/content/*.md`

- [ ] **Step 1: 将正文示例里的 `page:` 改成 `_page_:`，并说明正文保留字段统一用 `_xx_`**
- [ ] **Step 2: 定向检查是否还残留旧保留字段说明**

### Task 6: 跑定向回归

**Files:**
- Test: `test/content/build-content-index.test.js`
- Test: `test/build/build-site.test.js`
- Test: `test/server/create-app.test.js`

- [ ] **Step 1: 运行内容索引相关测试**
- [ ] **Step 2: 运行 build 相关测试**
- [ ] **Step 3: 运行 preview/server 相关测试**
- [ ] **Step 4: 如结果通过，再总结变更与剩余风险**
