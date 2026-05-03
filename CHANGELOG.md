# Changelog

All notable changes to `divixbrowser-admin-web` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- **个人中心（账号设置）(F-ADMIN-011)**：
  - 新增 `/account/settings` 页面，支持查看当前账号信息（用户名、角色、邮箱、上次登录时间与 IP）。
  - 新增用户下拉菜单“账号设置”入口，登录后可直接进入个人中心页面。
  - 新增 `changePasswordApi` 与账号设置表单，支持旧密码校验后修改新密码。
- **统一元数据单格式 (F-PLATFORM-020)**：
  - 新增 `apps/admin/src/composables/useMetadataResource.ts` 作为统一标准资源层，页面只消费 `items / selectOptions / getLabel / refresh` 等统一结果。
  - `useEnum / useLookup / useDict` 统一转为兼容包装，保留旧调用习惯但返回同一套标准结果。
  - 同一轮渲染中的多个 `useEnum / useLookup` 通过批量加载器自动合并为一次 `/meta/catalogs` 请求，降低后端压力。
  - `system/config` 页面拆分为 `composable`，集中承接元数据选项、表单和动作逻辑。
  - 新增 `docs/metadata-consumption.md`，说明统一元数据单格式、迁移规则与页面接入方式。
  - 在仓库 `README.md` 与本地开发指南中补充入口链接，方便开发者直接找到使用手册。
- **数据字典管理 (F-ADMIN-008)**：
  - 新增数据字典 API 模块、`useDict(catalogKey)` 组合式封装与字典选项缓存。
  - 新增“数据字典管理”页面，采用“左栏分组 + 目录列表 + 字典项二级页”结构。
  - 新增字典项维护二级路由 `DictionaryItems`，支持字典项新增、编辑、删除与状态管理。

### Fixed
- **Common 组件可靠性修复（第一阶段）(F-ADMIN-024)**：
  - `DxDateTime` 修复 `format` 入参失效问题，支持按外部指定格式渲染日期。
  - `DxMetaTag` 与 `DxStatusTag` 统一值比较口径，避免 `1`/`"1"` 等场景渲染不一致。
  - `DxFormDrawer / DxFormModal` 对 `$attrs` 同名事件做显式合并，避免内部关闭逻辑被外部监听覆盖。
  - `DxBooleanTag` 默认文案切换为 i18n（`system.common.trueText/falseText`），不再硬编码英文。
  - `DxPasswordInput` 移除 `value` 默认空字符串，保持“未填写字段 = undefined”的语义。
  - `DxVxeGrid` 让 `wrapper` 生效并移除深度监听，减少无效 `setState` 调用。
- **动态路由参数访问判定修复 (F-ADMIN-023)**：
  - 新增 `apps/admin/src/router/path-matcher.ts`，统一封装可访问路由匹配逻辑。
  - 权限守卫改为结合 `router.resolve().matched` 判定可访问性，兼容 `/system/dictionary/:catalogKey/items` 这类动态参数路由。
  - 刷新页面与登录 redirect 回跳到动态路径时，不再因字符串精确比较误判后回落首页。
- **登录后跳转 404 修复 (F-ADMIN-004)**：将 `api/core/user.ts` 中 `homePath` 及 `preferences.ts` 中 `defaultHomePath` 均由 `/dashboard` 更正为 `/system/menu`，确保使用后端动态路由（`accessMode: 'backend'`）时登录后能正确跳转到菜单管理页。

### Changed
- **系统管理模块命名优化 (F-ADMIN-021)**：
  - “标准参考数据”统一改为“标准数据”，覆盖菜单、页签、面包屑、页面标题与描述。
  - “审计查询 / 审计日志”统一收口为“操作日志 / Operation Log”展示口径。
- **管理员封禁原因接入字典 (F-ADMIN-008)**：
  - 管理员管理页封禁操作改为弹窗表单，提交时必须选择封禁原因。
  - 封禁原因改为通过 `useDict('admin_user_ban_reason')` 动态读取，不再使用页面内硬编码枚举。
- **UI 基础清理 (F-ADMIN-005 P0)**：
  - 右上角下拉菜单移除 Vben 文档/GitHub/Issues 链接，个人中心暂隐藏。
  - 下拉菜单邮箱改为读取管理员真实邮箱，移除 `Pro` 标签。
  - 通知铃铛清空假数据（空数组）。
  - 隐藏时区选择器（`widget.timezone: false`）。
  - 删除 Vben dashboard 残留文件（`dashboard.ts` + `views/dashboard/`）。
- **i18n 国际化 (F-ADMIN-005 P1)**：
  - 新增 `locales/langs/zh-CN/system.json` 和 `en-US/system.json` 翻译文件。
  - 菜单管理页和角色管理页全部文案替换为 `$t()` 调用，支持中英文切换。
  - `AGENTS.md` 新增 i18n 强制规范章节。
- **动态菜单 i18n (F-ADMIN-006)**：
  - 新增通用工具 `utils/i18n-field.ts`（`resolveI18n` + `useI18nField`）。
  - `RouteMeta` 新增 `titleI18n` 字段，动态路由加载时按 locale 解析菜单标题。
  - 菜单管理表单由 `titleEn` 改为 `titleI18n`，支持中英文独立编辑。

### Added
- 初始化 Vue-Vben-Admin v5.6.0 框架（基于 Ant Design Vue）
- 精简子应用，仅保留 `apps/admin`
- 实施层开发文档（`docs/development.md` 和 `docs/env-vars.md`）
- 引入后端基础 API，支持鉴权管理路由（`accessMode: 'backend'`）
- 增加基础鉴权路由及拦截逻辑（对接 `POST /api/v1/admin/auth/login` 等）
- **管理员认证对接真实后端 (Admin Auth)**：
  - 对接后端 `POST /admin/auth/login`，登录后存储 Access Token + Refresh Token。
  - 对接后端 `GET /admin/auth/me`，登录后获取管理员信息并映射到框架 `UserInfo`。
  - 对接后端 `POST /admin/auth/logout`，登出时吊销 Refresh Token。
  - 启用框架内置 Refresh Token 无感续期机制（`enableRefreshToken: true`）。
  - Vite Proxy 配置修正，确保 `/api` 正确转发到后端 8080 端口。
- **管理后台 RBAC 前端模块**：
  - 新增 `api/modules/menu` 与 `api/modules/role`，完成菜单管理与角色管理接口封装。
  - 新增 `views/system/menu/index.vue`，支持菜单树查询、新增、编辑、删除。
  - 新增 `views/system/role/index.vue`，支持角色查询、新增、编辑、删除、分配菜单权限。
  - 新增 `router/routes/modules/system.ts` 作为系统管理静态 fallback 路由。
  - 对接 `GET /admin/access-codes`，登录后写入权限码用于按钮级权限显示控制。
  - `getUserInfoApi` 改为优先使用后端真实角色字段（若无则回退登录返回角色）。
