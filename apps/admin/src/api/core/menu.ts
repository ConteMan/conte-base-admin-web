import type { RouteRecordStringComponent } from '@vben/types';

import { requestClient } from '#/api/request';

interface BackendMenuItem {
  key: string;
  path: string;
  route_name: string;
  title_key: string;
  permission_code?: string;
  children?: BackendMenuItem[];
}

const titleMap: Record<
  string,
  {
    enUS: string;
    zhCN: string;
  }
> = {
  'menu.content': { enUS: 'Content', zhCN: '内容管理' },
  'menu.system': { enUS: 'System', zhCN: '系统管理' },
  'menu.content.profile': { enUS: 'Profile', zhCN: '个人资料' },
  'menu.content.projects': { enUS: 'Projects', zhCN: '项目管理' },
  'menu.content.links': { enUS: 'Links', zhCN: '链接管理' },
  'menu.content.now': { enUS: 'Now', zhCN: 'Now 管理' },
  'menu.content.siteSettings': { enUS: 'Site Settings', zhCN: '站点配置' },
  'menu.system.adminUsers': { enUS: 'Admins', zhCN: '管理员' },
  'menu.system.roles': { enUS: 'Roles', zhCN: '角色权限' },
  'menu.system.permissions': { enUS: 'Permissions Metadata', zhCN: '菜单与权限元数据' },
  'menu.system.config': { enUS: 'System Config', zhCN: '系统配置' },
  'menu.system.dictionaries': { enUS: 'Dictionaries', zhCN: '字典与枚举' },
  'menu.system.auditLogs': { enUS: 'Audit Logs', zhCN: '审计日志' },
};

const componentMap: Record<string, string> = {
  adminProfile: '/_core/fallback/coming-soon',
  adminProjects: '/_core/fallback/coming-soon',
  adminLinks: '/_core/fallback/coming-soon',
  adminNow: '/_core/fallback/coming-soon',
  adminSiteSettings: '/_core/fallback/coming-soon',
  adminUsers: '/_core/fallback/coming-soon',
  adminRoles: '/_core/fallback/coming-soon',
  adminPermissions: '/_core/fallback/coming-soon',
  adminConfig: '/_core/fallback/coming-soon',
  adminDictionaries: '/_core/fallback/coming-soon',
  adminAuditLogs: '/_core/fallback/coming-soon',
};

function resolveTitle(titleKey: string) {
  const item = titleMap[titleKey];
  if (!item) {
    return {
      title: titleKey,
      titleI18n: {
        'en-US': titleKey,
        'zh-CN': titleKey,
      },
    };
  }
  return {
    title: item.zhCN,
    titleI18n: {
      'en-US': item.enUS,
      'zh-CN': item.zhCN,
    },
  };
}

function mapMenuItems(items: BackendMenuItem[]): RouteRecordStringComponent[] {
  return items.map((item, index) => {
    const title = resolveTitle(item.title_key);
    const children = item.children?.length ? mapMenuItems(item.children) : undefined;
    const isGroup = Boolean(children?.length);

    return {
      component: isGroup ? 'BasicLayout' : componentMap[item.route_name] || '/_core/fallback/coming-soon',
      meta: {
        authority: item.permission_code ? [item.permission_code] : undefined,
        icon: item.key.startsWith('content') ? 'lucide:files' : 'lucide:settings',
        order: index + 1,
        ...title,
      },
      name: isGroup ? (item.key === 'content' ? 'Content' : 'System') : item.route_name,
      path: item.path,
      children,
    };
  });
}

export async function getAllMenusApi() {
  const result = await requestClient.get<{ items: BackendMenuItem[] }>('/meta/menus');
  return mapMenuItems(result.items || []);
}
