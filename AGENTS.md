# AGENTS.md — conte-base-admin-web

## 项目定位

ConteBase 管理后台 Web 项目，基于 Vben Admin、Vue 3、TypeScript、Pinia 与后台标准页骨架。

## 开工前必做

1. 先确认当前分支，不允许直接在 `main` 上开发。
2. 先阅读 `/Users/conteman/Projects/conte-base/conte-base-doc/AGENTS.md`。
3. 先确认对应需求文档存在，至少包括 F-006、F-007、F-008。
4. 开始编码前，先告知用户当前分支、需求文档与计划修改文件。
5. 若任务属于后台列表页 / CRUD 页面 / 配置页，优先复用 Vben 与既有标准页骨架。
6. 若任务涉及枚举、字典、配置、状态文案或参考数据，先完成数据分层判断。

## 必守规则

- 禁止在 `main` 分支直接提交或推送。
- 禁止把新需求直接叠加到旧 feature 分支。
- 后台标准列表页不得绕开统一骨架自建整套壳层。
- 所有用户可见文案默认走 i18n，不直接硬编码。
- 本仓是执行仓，不在本仓维护全局需求、路线图和任务看板。
- 提交前必须至少运行本仓 `scripts/selftest.sh`。
- Commit scope 不得使用仓库名；应写业务域、模块名或技术关注点，例如 `legal`、`auth`、`locale`。

## 本地规则索引

- [规则索引总览](docs/rules/README.md)
- [Git 与交付规则](docs/rules/git-and-delivery.md)
- [页面基线与布局规则](docs/rules/page-baseline.md)
- [表单、详情与 i18n 规则](docs/rules/form-and-i18n.md)
- [数据消费与元数据入口规则](docs/rules/data-consumption.md)

## 外部权威参考

以下文档优先作为权威来源：

- `/Users/conteman/Projects/conte-base/conte-base-doc/projects/admin-web.md`
- `/Users/conteman/Projects/conte-base/conte-base-doc/control-panels/admin-surface.md`
- `/Users/conteman/Projects/conte-base/conte-base-doc/decisions/ADR-010-admin-architecture-aligned-with-divixbrowser.md`
- `../reference-divixbrowser/divixbrowser-doc/projects/admin-web.md`
- `../reference-divixbrowser/divixbrowser-doc/control-panels/admin-surface.md`
