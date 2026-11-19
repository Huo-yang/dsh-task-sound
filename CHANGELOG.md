# 更新记录 / Changelog

## [Unreleased]

## [0.2.1] - 2026-11-20

### 修复 / Fixed

- 将 npm 包名修正为账号作用域下的 `@huo-yang/dsh-task-sound`，确保公共 registry 可发布和安装。
- Corrected the npm identity to the account-owned `@huo-yang/dsh-task-sound` scope for public publishing and installation.

## [0.2.0] - 2026-11-20

### 功能 / Features

- 新增提醒范围配置：可提醒全部主会话，或仅提醒选中工作区中的主会话；未分组会话在工作区白名单模式下不提醒。
- 工作区白名单使用 DSH 稳定工作区 ID；已删除工作区不会误匹配其他项目，并会在配置页下次保存时清理。
- Added an all-sessions or workspace-whitelist notification scope, with safe handling for ungrouped sessions and deleted workspace registrations.

### 工程 / Project

- 新增 npm 公共发布元数据，并支持通过 npm 包名安装。
- Added public npm publishing metadata and package-name installation.
- 放宽安装兼容性：支持 Node.js 22 及以上，不再以开发期 DSH 会话与工作区包的精确版本限制安装；CI 改为验证最低 Node.js 版本。
- Broadened installation compatibility to Node.js 22+, removed exact development-only DSH session/workspace peer locks, and moved CI to the minimum supported Node.js version.
- 按统一 DSH 插件仓库契约补齐架构、测试、发布文档、Issue 模板和文档链接检查，并停止跟踪可重复生成的 `lib/`。
- Aligned repository documentation, templates, validation, generated-file handling, and immutable Release automation with the shared DSH plugin repository contract.

## [0.1.0] - 2026-10-03

### 功能 / Features

- 主 DSH 会话成功完成且达到时长阈值后发送 Windows 通知。
- 自动忽略子代理、失败、取消和未达到阈值的任务。
- 通知标题使用完成会话的会话名，声音由 Windows 通知设置管理。
- 在 DSH 原生插件配置页提供启用开关、最短任务时长和测试提醒。
- 插件名称与简介提供中英文，并跟随 DSH 语言设置切换。

Send a Windows notification after an eligible main-session turn completes, ignore subagent and unsuccessful turns, use the session name as the notification title, expose native DSH settings, and localize plugin metadata in English and Chinese.
