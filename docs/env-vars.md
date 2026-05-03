# 环境变量配置说明

> 针对 `divixbrowser-admin-web` 的前端环境变量（以 `VITE_` 开头）与环境文件约定进行说明。

当前项目采用“模板唯一源”策略：
- `.env.example`：唯一模板文件，提交至 Git。
- `.env.development`：本地开发覆盖文件，不提交。
- `.env.production`：本地生产联调覆盖文件，不提交。
- `.env.analyze`：仅 `pnpm run build:analyze` 模式使用（开启可视化分析）。

> `pnpm dev` / `pnpm build` 前会执行 `pnpm env:check:example`，自动校验 `.env.example` 是否覆盖代码中实际使用的环境变量。

---

## 前端核心变量列表 (`VITE_*`)

只记录影响运行的重要参数，详细参见 `apps/admin/.env.example`。

| 环境变量名 | 类型 | 说明和用法 | 默认值 (预设) |
| :--- | :--- | :--- | :--- |
| `VITE_APP_TITLE` | `string` | 管理界面的标签页名字以及骨架页标题 | `DivixBrowser Admin` |
| `VITE_APP_ENV` | `'local' \| 'dev-shared' \| 'test' \| 'staging' \| 'prod'` | 前端运行环境标识，用于版本清单、监控环境和排障定位。 | `local` |
| `VITE_APP_NAMESPACE` | `string` | Storage 本地缓存存储前缀防止污染 | `divixbrowser-admin` |
| `VITE_APP_STORE_SECURE_KEY` | `string` | 关键配置缓存（例如权限/登录持久化）所需的 AES 对称加密密钥 | **在部署时必须由 CI 覆盖** |
| `VITE_APP_VERSION` | `string` | 应用兼容版本，参与本地缓存 namespace。普通 CI/CD 构建不应变化，只有缓存结构或兼容策略变化时才调整。 | `1.0.0` |
| `VITE_APP_BUILD_VERSION` | `string` | 构建版本，每次 CI/CD 构建唯一，用于 `version.json`、监控 release 和新版提示。 | `local-build` |
| `VITE_GIT_COMMIT` | `string` | Git Commit 短哈希，推荐 CI 注入，用于 `version.json` 排障定位。 | 空 |
| `VITE_GLOB_API_URL` | `string` | AJAX / Axios 请求调用的目标 API 前缀。开发环境可用 `/api`（配合 Vite Proxy）；预发、生产等非开发环境必须使用后端管理端 API 的非同源绝对地址。 | 开发默认 `/api`，非开发环境示例 `https://admin-api.example.com/api/v1/admin` |
| `VITE_ADMIN_API_PROXY_TARGET` | `string` | Vite 开发服务器将 `/api/*` 代理到后端管理端的目标地址，仅在开发环境且 `VITE_GLOB_API_URL=/api` 时生效。 | `http://localhost:8081` |
| `VITE_ROUTER_HISTORY` | `'history' \| 'hash'` | 前端路由模式。当前 Admin-Web 默认口径为 `history`；只有在部署环境无法提供 History fallback 时，才允许临时切回 `hash`。 | `history` |
| `VITE_NITRO_MOCK` | `boolean` | 是否启用 Vben 模板内置 mock 服务。 | `false`（推荐联调关闭） |
| `VITE_PORT` | `number` | 本地开发服务器端口。 | `5666` |

> 如果 CI 流程中需要在 Docker 打包时替换特定内容，需要注意 Vite 在 `build` 时期就会执行环境变量的“值替换”。因此如有多环境复用同样构建镜像包的诉求，可改用运行时配置文件（或注入 window 变量）的方式以跳过构建时锁定。

补充约束：
- Admin-Web 预发 / 生产环境按域名根路径部署设计，`VITE_BASE` 默认保持 `/`。
- 非开发环境不再把同源 `/api` 作为正式部署口径；`/api` 仅用于本地 Vite Proxy 联调。
- `VITE_PORT` 与 `VITE_ADMIN_API_PROXY_TARGET` 只服务本地 Vite dev，共享开发、测试、预发、生产环境不写。
- `VITE_APP_VERSION` 与 `VITE_APP_BUILD_VERSION` 必须分离：前者是缓存兼容版本，后者是每次构建唯一版本。
- `VITE_SENTRY_RELEASE` 推荐等于 `VITE_APP_BUILD_VERSION`。
- 若非开发环境仍需切回 `hash`，必须同步更新需求文档与部署回退策略，不能只改单个环境变量。
