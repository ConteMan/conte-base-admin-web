import type { MenuTreeItem } from '#/api/modules/menu';
import type { DataNode } from 'ant-design-vue/es/tree';
import type { Ref } from 'vue';
import type DxVxeGrid from '#/components/common/DxVxeGrid.vue';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useAccessStore } from '@vben/stores';

import { getMenuManageList, getRoleList } from '#/api';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useEnum } from '#/composables/useMeta';
import { SYSTEM_PERMISSION_CODES } from '#/constants';
import { $t } from '#/locales';

type VbenVxeGridProps = Parameters<typeof useVbenVxeGrid>[0];

export function useRoleList(
  gridRef: Ref<InstanceType<typeof DxVxeGrid> | undefined>,
) {
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
      SYSTEM_PERMISSION_CODES.roleManage,
      SYSTEM_PERMISSION_CODES.roleCreate,
    ]),
  );
  const canEdit = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.roleManage,
      SYSTEM_PERMISSION_CODES.roleUpdate,
    ]),
  );
  const canDelete = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.roleManage,
      SYSTEM_PERMISSION_CODES.roleDelete,
    ]),
  );
  const canAssign = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.roleManage,
      SYSTEM_PERMISSION_CODES.roleGrant,
    ]),
  );

  const isSystemEnum = useEnum('is_system');
  const isSystemOptions = isSystemEnum.selectOptions;

  function getMenuTypeLabel(type: MenuTreeItem['type']) {
    const fallback =
      type === 'button'
        ? $t('system.role.menuTypeButton')
        : $t('system.role.menuTypeMenu');
    return menuTypeEnum.getLabel(type, fallback);
  }

  function convertMenuToTree(list: MenuTreeItem[]): DataNode[] {
    return list.map((item) => ({
      children: item.children ? convertMenuToTree(item.children) : undefined,
      key: item.id,
      title: `${item.title} (${getMenuTypeLabel(item.type)})`,
    }));
  }

  const permissionTreeData = computed<DataNode[]>(() =>
    convertMenuToTree(menuTree.value),
  );

  const gridOptions = computed<VbenVxeGridProps>(() => ({
    gridOptions: {
      height: 'auto',
      pagerConfig: {
        pageSize: 20,
      },
      rowConfig: {
        isHover: true,
        keyField: 'id',
      },
      proxyConfig: {
        autoLoad: true,
        ajax: {
          query: async ({ page }: any, formValues: Record<string, string>) => {
            return await getRoleList({
              page: page.currentPage,
              pageSize: page.pageSize,
              code: formValues?.code?.trim() || undefined,
              name: formValues?.name?.trim() || undefined,
            });
          },
        },
      },
      toolbarConfig: {
        search: true,
        custom: true,
        refresh: true,
        zoom: true,
      },
      columns: [
        {
          title: $t('system.role.columns.name'),
          field: 'name',
          minWidth: 180,
        },
        {
          title: $t('system.role.columns.code'),
          field: 'code',
          minWidth: 180,
        },
        {
          title: $t('system.role.columns.description'),
          field: 'description',
          minWidth: 220,
          slots: { default: 'description' },
        },
        {
          title: $t('system.role.columns.isSystem'),
          field: 'isSystem',
          width: 120,
          titleSuffix: {
            content: $t('system.role.systemBuiltin'),
            iconStatus: 'warning',
          },
          slots: { default: 'isSystem' },
        },
        {
          title: $t('system.role.columns.createdAt'),
          field: 'createdAt',
          width: 180,
          slots: { default: 'createdAt' },
        },
        {
          title: $t('system.role.columns.actions'),
          fixed: 'right',
          width: 280,
          slots: { default: 'actions' },
        },
      ],
    },
    formOptions: {
      actionWrapperClass: 'ml-auto',
      commonConfig: {
        formItemClass: 'mb-0 flex-none',
        labelClass: 'w-auto',
      },
      layout: 'inline',
      showCollapseButton: false,
      wrapperClass: 'w-full gap-4 flex-row',
      schema: [
        {
          fieldName: 'name',
          label: $t('system.role.searchName'),
          component: 'Input',
          componentProps: {
            allowClear: true,
          },
        },
        {
          fieldName: 'code',
          label: $t('system.role.searchCode'),
          component: 'Input',
          componentProps: {
            allowClear: true,
          },
        },
      ],
    },
    separator: false,
  }));

  async function loadRoleList() {
    await gridRef.value?.gridApi?.reload();
  }

  async function loadMenuTree() {
    menuTree.value = await getMenuManageList();
  }

  async function initialize() {
    await isSystemEnum.refresh();
    await loadMenuTree();
    await loadRoleList();
  }

  return {
    canAssign,
    canCreate,
    canDelete,
    canEdit,
    isSystemOptions,
    gridOptions,
    initialize,
    loadRoleList,
    permissionTreeData,
  };
}
