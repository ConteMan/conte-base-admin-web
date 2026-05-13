import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
  RouteRecordStringComponent,
} from '@vben/types';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';

import { getAllMenusApi } from '#/api';
import { BasicLayout, IFrameView } from '#/layouts';
import { SYSTEM_PERMISSION_CODES } from '#/constants';
import { resolveI18n } from '#/utils/i18n-field';

const forbiddenComponent = () => import('#/views/_core/fallback/forbidden.vue');

/**
 * 递归遍历路由树，将 meta.titleI18n 按当前 locale 解析到 meta.title
 */
function applyI18nToRoutes(
  routes: RouteRecordStringComponent[] | null | undefined,
): RouteRecordStringComponent[] {
  if (!routes) return [];
  return routes.map((route) => {
    if (route.meta?.titleI18n) {
      route.meta.title = resolveI18n(
        route.meta.titleI18n as Record<string, string>,
        route.meta.title as string,
      );
    }
    if (route.children?.length) {
      route.children = applyI18nToRoutes(route.children);
    }
    return route;
  });
}

function ensureDictionaryItemRoute(
  routes: RouteRecordStringComponent[] | null | undefined,
): RouteRecordStringComponent[] {
  if (!routes) return [];

  return routes.map((route) => {
    if (route.name === 'System') {
      const children = route.children ? [...route.children] : [];
      const exists = children.some((child) => child.name === 'DictionaryItems');

      if (!exists) {
        children.push({
          component: '/system/dictionary/items',
          meta: {
            activePath: '/system/dictionary',
            authority: [SYSTEM_PERMISSION_CODES.dictQuery],
            hideInMenu: true,
            title: '字典项维护',
            titleI18n: {
              'en-US': 'Dictionary Items',
              'zh-CN': '字典项维护',
            },
          },
          name: 'DictionaryItems',
          path: '/system/dictionary/:catalogKey/items',
        });
      }

      route.children = children;
    }

    if (route.children?.length) {
      route.children = ensureDictionaryItemRoute(route.children);
    }

    return route;
  });
}

function ensureContentNoteEditorRoutes(
  routes: RouteRecordStringComponent[] | null | undefined,
): RouteRecordStringComponent[] {
  if (!routes) return [];

  return routes.map((route) => {
    if (route.name === 'Content') {
      const children = route.children ? [...route.children] : [];
      const hasCreate = children.some(
        (child) => child.name === 'ContentNoteCreate',
      );
      const hasEdit = children.some(
        (child) => child.name === 'ContentNoteEdit',
      );

      if (!hasCreate) {
        children.push({
          component: '/content/notes/form',
          meta: {
            activePath: '/content/notes',
            authority: [SYSTEM_PERMISSION_CODES.contentNoteCreate],
            hideInMenu: true,
            title: '新建笔记',
            titleI18n: {
              'en-US': 'New Note',
              'zh-CN': '新建笔记',
            },
          },
          name: 'ContentNoteCreate',
          path: '/content/notes/create',
        });
      }

      if (!hasEdit) {
        children.push({
          component: '/content/notes/form',
          meta: {
            activePath: '/content/notes',
            authority: [SYSTEM_PERMISSION_CODES.contentNoteUpdate],
            hideInMenu: true,
            title: '编辑笔记',
            titleI18n: {
              'en-US': 'Edit Note',
              'zh-CN': '编辑笔记',
            },
          },
          name: 'ContentNoteEdit',
          path: '/content/notes/:id/edit',
        });
      }

      route.children = children;
    }

    if (route.children?.length) {
      route.children = ensureContentNoteEditorRoutes(route.children);
    }

    return route;
  });
}

function hasRouteName(
  routes: RouteRecordStringComponent[] | null | undefined,
  routeName: string,
): boolean {
  if (!routes) return false;

  for (const route of routes) {
    if (route.name === routeName) {
      return true;
    }
    if (route.children?.length && hasRouteName(route.children, routeName)) {
      return true;
    }
  }

  return false;
}

function appendAccountSettingsToSystem(
  routes: RouteRecordStringComponent[] | null | undefined,
): RouteRecordStringComponent[] {
  if (!routes) return [];

  return routes.map((route) => {
    if (route.name === 'System') {
      const children = route.children ? [...route.children] : [];
      const exists = children.some((child) => child.name === 'AccountSettings');

      if (!exists) {
        children.push({
          component: '/account/settings/index',
          meta: {
            activePath: '/system',
            hideInMenu: true,
            title: '账号设置',
            titleI18n: {
              'en-US': 'Account Settings',
              'zh-CN': '账号设置',
            },
          },
          name: 'AccountSettings',
          path: '/account/settings',
        });
      }

      route.children = children;
    }

    if (route.children?.length) {
      route.children = appendAccountSettingsToSystem(route.children);
    }

    return route;
  });
}

async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  const pageMap: ComponentRecordType = import.meta.glob('../views/**/*.vue');

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
  };

  return await generateAccessible(preferences.app.accessMode, {
    ...options,
    fetchMenuListAsync: async () => {
      const menus = await getAllMenusApi();
      const augmentedMenus = appendAccountSettingsToSystem(
        ensureContentNoteEditorRoutes(ensureDictionaryItemRoute(menus)),
      );
      if (!hasRouteName(augmentedMenus, 'AccountSettings')) {
        throw new Error('系统菜单缺少账号设置挂载点，请检查后端 /meta/menus 返回值');
      }
      // 根据当前 locale 解析 titleI18n → title
      return applyI18nToRoutes(augmentedMenus);
    },
    // 可以指定没有权限跳转403页面
    forbiddenComponent,
    // 如果 route.meta.menuVisibleWithForbidden = true
    layoutMap,
    pageMap,
  });
}

export { generateAccess };
