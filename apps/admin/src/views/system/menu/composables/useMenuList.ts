import type { MenuTreeItem } from '#/api/modules/menu';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useAccessStore } from '@vben/stores';

import { getMenuManageList } from '#/api';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useEnum } from '#/composables/useMeta';
import { SYSTEM_PERMISSION_CODES } from '#/constants';
import { $t } from '#/locales';

type VbenVxeGridProps = Parameters<typeof useVbenVxeGrid>[0];

interface ParentTreeNode {
  children?: ParentTreeNode[];
  key: number;
  title: string;
  value: number;
}

export function useMenuList() {
  const loading = ref(false);
  const menuTree = ref<MenuTreeItem[]>([]);

  const accessStore = useAccessStore();
  const { hasAccessByCodes } = useAccess();
  const menuTypeEnum = useEnum('menu_type');

  function hasAnyCode(codes: string[]) {
    if (!accessStore.accessCodes.length) {
      return true;
    }
    return hasAccessByCodes(codes);
  }

  const canCreate = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.menuManage,
      SYSTEM_PERMISSION_CODES.menuCreate,
    ]),
  );
  const canEdit = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.menuManage,
      SYSTEM_PERMISSION_CODES.menuUpdate,
    ]),
  );
  const canDelete = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.menuManage,
      SYSTEM_PERMISSION_CODES.menuDelete,
    ]),
  );

  const menuTypeOptions = menuTypeEnum.selectOptions;
  const statusOptions = useEnum('is_active').selectOptions;
  const hiddenOptions = useEnum('is_hidden').selectOptions;

  function buildParentTree(nodes: MenuTreeItem[]): ParentTreeNode[] {
    return nodes
      .filter((node) => node.type === 'menu')
      .map((node) => ({
        children: node.children ? buildParentTree(node.children) : [],
        key: node.id,
        title: node.title,
        value: node.id,
      }));
  }

  const parentTreeData = computed<ParentTreeNode[]>(() =>
    buildParentTree(menuTree.value),
  );

  const gridOptions = computed<VbenVxeGridProps>(() => ({
    gridOptions: {
      data: menuTree.value,
      loading: loading.value,
      height: 'auto',
      pagerConfig: {
        enabled: false,
      },
      rowConfig: {
        isHover: true,
        keyField: 'id',
      },
      treeConfig: {
        childrenField: 'children',
        expandAll: true,
        transform: false,
      } as any,
      columns: [
        {
          title: $t('system.menu.columns.title'),
          field: 'title',
          align: 'left',
          headerAlign: 'left',
          minWidth: 260,
          fixed: 'left',
          treeNode: true,
        },
        {
          title: $t('system.menu.columns.type'),
          field: 'type',
          width: 110,
          slots: { default: 'type' },
        },
        {
          title: $t('system.menu.columns.icon'),
          field: 'icon',
          width: 90,
          slots: { default: 'icon' },
        },
        {
          title: $t('system.menu.columns.route'),
          field: 'routePath',
          minWidth: 220,
          slots: { default: 'routePath' },
        },
        {
          title: $t('system.menu.columns.permissionCode'),
          field: 'permissionCode',
          minWidth: 180,
          slots: { default: 'permissionCode' },
        },
        {
          title: $t('system.menu.apiPath'),
          field: 'apiPath',
          minWidth: 220,
          slots: { default: 'apiPath' },
        },
        {
          title: $t('system.menu.columns.sortOrder'),
          field: 'sortOrder',
          width: 90,
        },
        {
          title: $t('system.menu.columns.hidden'),
          field: 'isHidden',
          width: 110,
          slots: { default: 'isHidden' },
        },
        {
          title: $t('system.menu.columns.status'),
          field: 'isActive',
          width: 110,
          slots: { default: 'isActive' },
        },
        {
          title: $t('system.menu.form.createdAt'),
          field: 'createdAt',
          width: 180,
          slots: { default: 'createdAt' },
        },
        {
          title: $t('system.menu.form.updatedAt'),
          field: 'updatedAt',
          width: 180,
          slots: { default: 'updatedAt' },
        },
        {
          title: $t('system.menu.columns.actions'),
          fixed: 'right',
          width: 220,
          slots: { default: 'actions' },
        },
      ],
    },
    separator: false,
  }));

  async function loadMenus() {
    loading.value = true;
    try {
      menuTree.value = await getMenuManageList();
    } finally {
      loading.value = false;
    }
  }

  return {
    canCreate,
    canDelete,
    canEdit,
    gridOptions,
    loadMenus,
    hiddenOptions,
    menuTypeOptions,
    parentTreeData,
    statusOptions,
  };
}
