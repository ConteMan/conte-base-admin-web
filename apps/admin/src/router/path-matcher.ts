import type { RouteRecordRaw, Router } from 'vue-router';

interface RouteIdentityIndex {
  pathTemplates: Set<string>;
  routeNames: Set<string>;
}

const TRAILING_SLASH_RE = /\/+$/u;

function normalizePath(rawPath: string): string {
  const path = rawPath.split(/[?#]/u)[0] || '/';
  if (path === '/') {
    return path;
  }
  return path.replace(TRAILING_SLASH_RE, '') || '/';
}

function resolveRoutePath(parentPath: string, routePath: string): string {
  if (!routePath) {
    return parentPath || '/';
  }

  if (routePath.startsWith('/')) {
    return routePath;
  }

  if (!parentPath || parentPath === '/') {
    return `/${routePath}`;
  }

  return `${parentPath.replace(TRAILING_SLASH_RE, '')}/${routePath}`;
}

function collectRouteIdentities(
  routes: RouteRecordRaw[] | null | undefined,
  index: RouteIdentityIndex,
  parentPath = '',
) {
  if (!routes?.length) {
    return;
  }

  for (const route of routes) {
    const resolvedPath = normalizePath(
      resolveRoutePath(parentPath, route.path || ''),
    );

    if (resolvedPath) {
      index.pathTemplates.add(resolvedPath);
    }

    if (typeof route.name === 'string' && route.name) {
      index.routeNames.add(route.name);
    }

    if (route.children?.length) {
      collectRouteIdentities(route.children, index, resolvedPath);
    }
  }
}

function createRouteIdentityIndex(routes: RouteRecordRaw[]): RouteIdentityIndex {
  const index: RouteIdentityIndex = {
    pathTemplates: new Set<string>(),
    routeNames: new Set<string>(),
  };

  collectRouteIdentities(routes, index);
  return index;
}

/**
 * 判断目标路径是否命中当前用户可访问路由。
 * 先做静态路径匹配，再通过 vue-router 的 matched 结果兼容动态参数路由。
 */
function isPathAccessibleByRoutes(
  targetPath: string,
  routes: RouteRecordRaw[],
  router: Router,
): boolean {
  if (!targetPath) {
    return false;
  }

  const routeIndex = createRouteIdentityIndex(routes);
  const resolvedTarget = router.resolve(targetPath);
  const normalizedTargetPath = normalizePath(resolvedTarget.path);

  if (routeIndex.pathTemplates.has(normalizedTargetPath)) {
    return true;
  }

  return resolvedTarget.matched.some((record) => {
    if (typeof record.name === 'string' && routeIndex.routeNames.has(record.name)) {
      return true;
    }
    return routeIndex.pathTemplates.has(normalizePath(record.path));
  });
}

export { isPathAccessibleByRoutes };
