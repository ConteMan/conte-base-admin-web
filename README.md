# conte-base-admin-web

> ConteBase 管理后台前端执行仓，供管理员维护个人中枢内容与系统治理能力。

本仓直接基于 `divixbrowser-admin-web` 的成熟 Vben Admin 工程骨架剪裁，保留其布局、权限接入、动态菜单、多语言与页面基线。

---

## 快速启动

```bash
# 1. 安装依赖（基于 pnpm workspace）
pnpm install

# 2. 进入管理端子应用目录
cd apps/admin

# 3. 创建本地联调配置（按需修改）
cp .env.example .env.development

# 3.1 如需本地执行生产构建，再补一份本地构建配置
cp .env.example .env.production

# 4. 启动开发服务器
pnpm dev
```

服务启动后访问 `http://localhost:5173`，使用 ConteBase 管理端账号登录。

## 终端协作与可观测入口

- 首选启动方式：在 `apps/admin/` 下执行 `pnpm dev`
- 首选观察面：当前终端 stdout / stderr
- 默认访问地址：`http://localhost:5173`
- 推荐验证命令：`pnpm typecheck`
- 页面联调命令：`pnpm test:e2e`
- 如 dev server 不在当前协作终端，建议保留稳定日志文件：

```bash
mkdir -p ../../tmp/dev-logs
pnpm dev 2>&1 | tee ../../tmp/dev-logs/admin-web.dev.log
```

联调前请确认 `apps/admin/.env.development` 中的 `VITE_ADMIN_API_PROXY_TARGET` 与本地 `conte-base-service` 端口一致。

---

## 常用命令

由于基于 Monorepo，**日常开发命令均在 `apps/admin/` 目录下执行**：

| 命令 | 说明 |
| :--- | :--- |
| `pnpm dev` | 启动本地开发服务器 |
| `pnpm build` | 执行生产构建（会自动预构建 workspace 依赖，依赖 `apps/admin/.env.production`） |
| `pnpm env:check:example` | 校验 `.env.example` 是否覆盖代码里使用的环境变量 |
| `pnpm test:e2e` | 执行 Playwright 页面联调测试，默认使用独立端口 `5175` |
| `pnpm typecheck` | 执行 TypeScript 类型检查 |

*(如果在根目录，推荐使用 `pnpm run build:admin` 构建管理端)*

Playwright e2e 需要先启动 `conte-base-service`，并通过环境变量提供测试账号：

```bash
CONTE_BASE_E2E_ADMIN_USERNAME='<username>' \
CONTE_BASE_E2E_ADMIN_PASSWORD='<password>' \
CONTE_BASE_E2E_ADMIN_TOTP_SECRET='<totp-secret>' \
pnpm test:e2e
```

---

## 目录结构

本仓库保留了框架的 Monorepo 结构，但仅包含一个业务 App 和部分公共库。

```
conte-base-admin-web/
├── apps/
│   └── admin/               # ⚡️ 唯一业务子应用（管理后台）
│       ├── src/
│       │   ├── api/         # 后端 API 对接封装（auth/user/order 等）
│       │   ├── views/       # 页面组件（按业务模块分目录）
│       │   ├── stores/      # Pinia 状态管理
│       │   ├── router/      # 路由配置（接入后端动态路由 accessMode: backend）
│       │   └── ...
│       ├── .env.example     # 环境变量模板（唯一源）
│       ├── .env.development # 本地开发覆盖（不提交）
│       ├── .env.production  # 本地生产构建 / 联调覆盖（不提交）
│       └── package.json
├── packages/                # 📦 Vben 框架共享包库（UI/Hooks/请求/权限等基础包）
├── docs/                    # 📚 本项目相关实施层文档
├── pnpm-workspace.yaml      # pnpm workspace 配置
└── package.json             # 根级 package 依赖
```

---

## 相关文档

- [本地开发指南](docs/development.md)
- [本地规则索引](docs/rules/README.md)
- [本地开发观察面规则](docs/rules/development-observability.md)
- [Git 与交付规则](docs/rules/git-and-delivery.md)
- [DxVxeGrid 使用说明](docs/dx-vxe-grid-usage.md)
- [统一元数据单格式使用说明](docs/metadata-consumption.md)
- [CRUD 表单 Schema 迁移手册](docs/form-schema-migration.md)
- [环境变量配置说明](docs/env-vars.md)

ConteBase 控制面权威路径：

- `../conte-base-doc/projects/admin-web.md` — 子项目职责说明
- `../conte-base-doc/control-panels/admin-surface.md` — 后台入口总表
- `../conte-base-doc/feature/006-v1-product-and-admin-boundary.md` — V1 产品边界
- `../conte-base-doc/feature/007-admin-architecture-and-topology.md` — 后台架构与仓库拓扑
