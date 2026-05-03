# 本地开发指南

> 前置：请先完成 [全局开发环境配置](../../divixbrowser-doc/guides/development.md)。

---

## 1. 入门与基础说明

本仓库包含基于 Vben v5 编写的后台管理界面，内部采用 Monorepo 作为管理方式。所有的**实际业务代码**存放在 `apps/admin/` 目录下。

开发启动必须在此根目录下执行依赖安装，然后进入 `apps/admin/` 继续常规的日常开发。

```bash
git clone <repo-url> divixbrowser-admin-web
cd divixbrowser-admin-web

# 开启 corepack，启用 pnpm 版本控制
npm i -g corepack
corepack enable

# 根目录安装依赖
pnpm install
```

---

## 2. 配置文件获取与修改

在 `apps/admin/` 创建本地覆盖配置（推荐）：
```bash
cd apps/admin
cp .env.example .env.development
```

说明：
- `VITE_GLOB_API_URL`：开发环境推荐 `/api`（走 Vite Proxy）；预发、生产等非开发环境必须改为后端管理端 API 的非同源绝对地址。
- `VITE_ADMIN_API_PROXY_TARGET`：本地 Vite 代理目标地址，默认建议 `http://localhost:8081`；当后端管理端口变化时，只需要改 `.env.development`。
- `VITE_ROUTER_HISTORY=history`：本地开发默认与预发 / 生产保持一致，使用 HTML5 History 模式；若刷新出现 404，优先检查是否误用静态站点访问开发产物。
- `VITE_NITRO_MOCK=false`：关闭模板 mock 服务，避免联调链路冲突。
- `.env.development` 仅用于本地，不提交 Git；如需模拟生产配置，可复制为 `.env.production`。

本需求冻结的部署口径如下：
- Admin-Web 预发 / 生产环境以域名根路径部署。
- 非开发环境 `VITE_GLOB_API_URL` 不使用同源 `/api` 前缀。
- 静态站点需要提供等价于 `try_files $uri $uri/ /index.html;` 的 History fallback。

---

## 3. 启动开发服务器

开发调试主要是在 `apps/admin/` 子目录：

```bash
cd apps/admin
pnpm dev
# 默认端口：http://localhost:5666
```

### 3.1 终端协作与日志兜底

- 首选观察面：当前终端 stdout / stderr
- 推荐验证命令：`pnpm typecheck`
- 联调前确认 `apps/admin/.env.development` 中的 `VITE_ADMIN_API_PROXY_TARGET` 与本地管理端后端端口一致

如果 `pnpm dev` 不运行在当前协作终端，建议保留一份稳定日志文件：

```bash
mkdir -p ../../tmp/dev-logs
pnpm dev 2>&1 | tee ../../tmp/dev-logs/admin-web.dev.log
```

更多约定见 [`docs/rules/development-observability.md`](./rules/development-observability.md)。

---

## 4. 全量命令说明

大多数情况下你只需要在 `apps/admin/` 里使用：

| 命令 | 说明 | 适用场景 |
| :--- | :--- | :--- |
| `pnpm install` | 整个工程的依赖装载（根目录执行） | 初次加载或依赖修改后 |
| `pnpm dev` | 启动开发服务器 | 日常开发、联调 |
| `pnpm build` | 在 `apps/admin` 构建（自动预构建 workspace 依赖） | 快速本地打包验证 |
| `pnpm run build:admin` | 在仓库根目录构建 admin 子应用 | CI / 发布前标准构建 |
| `pnpm typecheck` | 运行 TS 类型检查 | 确保不报错再提交 PR |
| `pnpm env:check:example` | 校验 `.env.example` 完整性 | 新增环境变量或排查漏配时 |
| `pnpm clean` | 深度清理 npm 缓存及各类临时文件 | 框架出错无从下手时 |

---

## 5. 页面列表基线

管理后台新的列表页默认优先使用 `DxVxeGrid`，不要再单独手写 `Table + 查询表单 + Pagination`。

- 组件使用说明：[`docs/dx-vxe-grid-usage.md`](./dx-vxe-grid-usage.md)
- 统一元数据单格式使用说明：[`docs/metadata-consumption.md`](./metadata-consumption.md)
- CRUD 表单 Schema 迁移手册：[`docs/form-schema-migration.md`](./form-schema-migration.md)
- 当前参考页面：
  - `apps/admin/src/views/system/admin/index.vue`
  - `apps/admin/src/views/system/config/index.vue`
  - `apps/admin/src/views/system/reference-data/index.vue`

---

## 6. FAQ 常见问题

**Q: 新增依赖包装在哪里？**  
A: 需要提供给各个包统一复用的核心工具放入 `packages/*/package.json`（一般不需要），只有**当前应用**需要的第三方模块，直接到 `apps/admin/` 下执行 `pnpm install <库名>` 即可。

**Q: 本地访问后端遇到 CORS 跨域问题怎么排查？**  
A: 开发环境优先使用 `.env.development` 中的 `VITE_GLOB_API_URL=/api` 加 `VITE_ADMIN_API_PROXY_TARGET` 方案；若改为直连绝对地址，请确保本地运行的 `divixbrowser-service` 已放行对应来源。

**Q: 为何不使用 pnpm-workspace 直接启动所有的服务？**  
A: 我们为了不增加多组件理解负担，移除了除 admin 以外多余的其他 UI 开发包。我们提倡聚焦 `apps/admin/` 去做单页面处理。
