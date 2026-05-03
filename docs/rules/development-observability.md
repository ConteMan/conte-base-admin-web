# 本地开发观察面规则

## 终端优先

- 日常联调默认在 `apps/admin/` 下执行 `pnpm dev`。
- 首选观察面是当前终端 stdout / stderr，不优先依赖 IDE 内置控制台。
- 默认访问地址：`http://localhost:5666`

## Ready 信号

- Vite 输出可访问的本地地址。
- 页面可正常打开，且 `/api` 代理指向的管理端后端可连通。

## 推荐验证

- 类型检查：`pnpm typecheck`
- 管理端联调前，确认 `apps/admin/.env.development` 中的 `VITE_ADMIN_API_PROXY_TARGET` 与当前 `divixbrowser-service` 管理端端口一致。

## 日志兜底

- 如果 `pnpm dev` 不运行在当前协作终端，建议保留一份稳定日志文件：

```bash
mkdir -p ../../tmp/dev-logs
pnpm dev 2>&1 | tee ../../tmp/dev-logs/admin-web.dev.log
```

- 建议日志路径：`tmp/dev-logs/admin-web.dev.log`
