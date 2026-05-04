import type { RouteRecordStringComponent } from '@vben/types';

import { requestClient } from '#/api/request';

interface BackendMenuItem {
  children?: BackendMenuItem[];
  component?: string;
  icon?: string;
  key: string;
  path: string;
  permission_code?: string;
  route_name: string;
  title: string;
  title_i18n?: Record<string, string>;
}

const componentMap: Record<string, string> = {
  adminAuditLogs: '/system/audit-log/index',
  adminConfig: '/system/config/index',
  adminDictionaries: '/system/dictionary/index',
  adminLinks: '/_core/fallback/coming-soon',
  adminNow: '/_core/fallback/coming-soon',
  adminPermissions: '/system/menu/index',
  adminProfile: '/_core/fallback/coming-soon',
  adminProjects: '/_core/fallback/coming-soon',
  adminRoles: '/system/role/index',
  adminSiteSettings: '/_core/fallback/coming-soon',
  adminUsers: '/system/admin/index',
};

function normalizeComponent(item: BackendMenuItem, isGroup: boolean): string {
  if (isGroup) {
    return 'BasicLayout';
  }

  const mappedComponent = componentMap[item.route_name];
  if (mappedComponent) {
    return mappedComponent;
  }

  if (typeof item.component === 'string' && item.component.trim()) {
    return item.component
      .replace(/^\/views/u, '')
      .replace(/\.vue$/u, '');
  }

  return '/_core/fallback/coming-soon';
}

function resolveTitle(item: BackendMenuItem) {
  return {
    title: item.title,
    titleI18n: item.title_i18n || {
      'en-US': item.title,
      'zh-CN': item.title,
    },
  };
}

function mapMenuItems(items: BackendMenuItem[]): RouteRecordStringComponent[] {
  return items.map((item, index) => {
    const children = item.children?.length ? mapMenuItems(item.children) : undefined;
    const isGroup = Boolean(children?.length);

    return {
      children,
      component: normalizeComponent(item, isGroup),
      meta: {
        authority: item.permission_code ? [item.permission_code] : undefined,
        icon: item.icon || (item.key.startsWith('content') ? 'lucide:files' : 'lucide:settings'),
        order: index + 1,
        ...resolveTitle(item),
      },
      name: isGroup ? (item.route_name || item.key) : item.route_name,
      path: item.path,
    };
  });
}

export async function getAllMenusApi() {
  const result = await requestClient.get<{ items: BackendMenuItem[] }>('/meta/menus');
  return mapMenuItems(result.items || []);
}
