<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import type { MenuRecordRaw, RouteRecordRaw } from '@vben/types';

import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import {
  BasicLayout,
  LockScreen,
  Notification,
  UserDropdown,
} from '@vben/layouts';
import { preferences } from '@vben/preferences';
import { useAccessStore, useTabbarStore, useUserStore } from '@vben/stores';

import { useAuthStore } from '#/store';
import { $t } from '#/locales';
import { resolveI18n } from '#/utils/i18n-field';
import LoginForm from '#/views/_core/authentication/login.vue';

const notifications = ref<NotificationItem[]>([]);
const userStore = useUserStore();
const router = useRouter();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const tabbarStore = useTabbarStore();
const { destroyWatermark, updateWatermark } = useWatermark();

/**
 * 递归更新 MenuRecordRaw 树的 name（侧边栏显示文本）
 * meta.titleI18n 存在 route 的 meta 中，但 MenuRecordRaw 只有 name/path
 * 需要通过 path 匹配 accessRoutes 获取 titleI18n
 */
function resolveMenuNames(
  menus: MenuRecordRaw[],
  routeMap: Map<string, Record<string, string>>,
) {
  for (const menu of menus) {
    const i18nEntry = routeMap.get(menu.path);
    if (i18nEntry) {
      menu.name = resolveI18n(i18nEntry, menu.name);
    }
    if (menu.children?.length) {
      resolveMenuNames(menu.children, routeMap);
    }
  }
}

/**
 * 递归从路由树中收集 path → titleI18n 映射，同时更新 meta.title
 */
function buildI18nMap(
  routes: RouteRecordRaw[],
  map: Map<string, Record<string, string>>,
) {
  for (const route of routes) {
    const meta = route.meta as Record<string, any> | undefined;
    if (meta?.titleI18n) {
      map.set(route.path, meta.titleI18n as Record<string, string>);
      meta.title = resolveI18n(
        meta.titleI18n as Record<string, string>,
        (meta.title as string) || '',
      );
    }
    if (route.children?.length) {
      buildI18nMap(route.children, map);
    }
  }
}

// 监听语言切换，重新解析菜单标题
watch(
  () => preferences.app.locale,
  () => {
    const routes = accessStore.accessRoutes;
    const menus = accessStore.accessMenus;
    if (!routes.length || !menus.length) return;

    // 1. 从 accessRoutes 中收集 titleI18n 映射 + 更新 route meta.title
    const i18nMap = new Map<string, Record<string, string>>();
    buildI18nMap(routes, i18nMap);

    // 2. 用映射更新 accessMenus 的 name（侧边栏显示文本）
    resolveMenuNames(menus, i18nMap);

    // 3. 更新标签页标题
    for (const tab of tabbarStore.tabs) {
      const meta = tab.meta as Record<string, any>;
      if (meta?.titleI18n) {
        meta.title = resolveI18n(
          meta.titleI18n as Record<string, string>,
          (meta.title as string) || '',
        );
      }
    }

    // 4. 触发 Pinia 响应式更新
    accessStore.setAccessMenus([...menus]);
    accessStore.setAccessRoutes([...routes]);
    tabbarStore.setUpdateTime();
  },
);
const showDot = computed(() =>
  notifications.value.some((item) => !item.isRead),
);

const menus = computed(() => {
  const locale = preferences.app.locale;
  void locale;

  return [
    {
      handler: () => {
        void router.push('/account/settings');
      },
      icon: 'lucide:user-cog',
      text: $t('system.account.entry'),
    },
  ];
});

const avatar = computed(() => {
  return userStore.userInfo?.avatar ?? preferences.app.defaultAvatar;
});

async function handleLogout() {
  await authStore.logout(false);
}

function handleNoticeClear() {
  notifications.value = [];
}

function markRead(id: number | string) {
  const item = notifications.value.find((item) => item.id === id);
  if (item) {
    item.isRead = true;
  }
}

function remove(id: number | string) {
  notifications.value = notifications.value.filter((item) => item.id !== id);
}

function handleMakeAll() {
  notifications.value.forEach((item) => (item.isRead = true));
}
watch(
  () => ({
    enable: preferences.app.watermark,
    content: preferences.app.watermarkContent,
  }),
  async ({ enable, content }) => {
    if (enable) {
      await updateWatermark({
        content:
          content ||
          `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        :text="userStore.userInfo?.realName"
        :description="userStore.userInfo?.desc || userStore.userInfo?.username"
        @logout="handleLogout"
      />
    </template>
    <template #notification>
      <Notification
        :dot="showDot"
        :notifications="notifications"
        @clear="handleNoticeClear"
        @read="(item) => item.id && markRead(item.id)"
        @remove="(item) => item.id && remove(item.id)"
        @make-all="handleMakeAll"
      />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
