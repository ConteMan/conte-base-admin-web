<script lang="ts" setup>
import type { BreadcrumbStyleType, MenuRecordRaw } from '@vben/types';

import type { IBreadcrumb } from '@vben-core/shadcn-ui';

import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { $t } from '@vben/locales';
import { useAccessStore } from '@vben/stores';

import { VbenBreadcrumbView } from '@vben-core/shadcn-ui';

interface Props {
  hideWhenOnlyOne?: boolean;
  showHome?: boolean;
  showIcon?: boolean;
  type?: BreadcrumbStyleType;
}

const props = withDefaults(defineProps<Props>(), {
  showHome: false,
  showIcon: false,
  type: 'normal',
});

const accessStore = useAccessStore();
const route = useRoute();
const router = useRouter();

function resolveMenuChain(path: string) {
  const menu = accessStore.getMenuByPath(path);
  if (!menu) {
    return [];
  }

  return [...(menu.parents || []), menu.path]
    .map((itemPath) => accessStore.getMenuByPath(itemPath))
    .filter((item): item is MenuRecordRaw => Boolean(item));
}

const breadcrumbs = computed((): IBreadcrumb[] => {
  const matched = route.matched;

  const resultBreadcrumb: IBreadcrumb[] = [];

  for (const match of matched) {
    const { meta, path } = match;
    const { hideChildrenInMenu, hideInBreadcrumb, icon, name, title } =
      meta || {};
    if (hideInBreadcrumb || hideChildrenInMenu || !path) {
      continue;
    }

    resultBreadcrumb.push({
      icon,
      path: path || route.path,
      title: title ? $t((title || name) as string) : '',
    });
  }

  const activePath = route.meta?.activePath;
  if (typeof activePath === 'string' && activePath) {
    const currentPaths = new Set(resultBreadcrumb.map((item) => item.path));
    const activeMenuChain = resolveMenuChain(activePath)
      .filter((item) => !currentPaths.has(item.path))
      .map((item) => ({
        icon: item.icon,
        path: item.path,
        title: item.name,
      }));

    if (activeMenuChain.length > 0) {
      const currentPage = resultBreadcrumb.pop();
      resultBreadcrumb.push(...activeMenuChain);
      if (currentPage) {
        resultBreadcrumb.push(currentPage);
      }
    }
  }

  if (props.showHome) {
    resultBreadcrumb.unshift({
      icon: 'mdi:home-outline',
      isHome: true,
      path: '/',
    });
  }
  if (props.hideWhenOnlyOne && resultBreadcrumb.length === 1) {
    return [];
  }

  return resultBreadcrumb;
});

function handleSelect(path: string) {
  router.push(path);
}
</script>
<template>
  <VbenBreadcrumbView
    :breadcrumbs="breadcrumbs"
    :show-icon="showIcon"
    :style-type="type"
    class="ml-2"
    @select="handleSelect"
  />
</template>
