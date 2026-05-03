FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm -F @divixbrowser/admin-web run build

FROM nginx:1.27-alpine

COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
