import type {
  CreateDictionaryCatalogRequest,
  CreateDictionaryGroupRequest,
  DictionaryCatalogItem,
  DictionaryGroupItem,
  UpdateDictionaryCatalogRequest,
  UpdateDictionaryGroupRequest,
} from '#/api';
import type DxVxeGrid from '#/components/common/DxVxeGrid.vue';

import { computed, markRaw, nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { IconifyIcon } from '@vben/icons';
import { useAccessStore } from '@vben/stores';

import { Button, Empty, Popover, message } from 'ant-design-vue';

import {
  createDictionaryCatalog,
  createDictionaryGroup,
  getDictionaryCatalogs,
  getDictionaryGroups,
  updateDictionaryCatalog,
  updateDictionaryGroup,
} from '#/api';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { z } from '#/adapter/form';
import {
  ENABLED_STATUS,
  SYSTEM_PERMISSION_CODES,
} from '#/constants';
import { $t } from '#/locales';
import { useEnum } from '#/composables/useMeta';
import type { DxFormSchema, DxSchemaFormExpose } from '#/components/common';
import { DxMetaSelect } from '#/components/common';

type VbenVxeGridProps = Parameters<typeof useVbenVxeGrid>[0];

interface CatalogQueryForm {
  keyword?: string;
  status?: number;
}

interface GroupFormValues {
  description?: string;
  key: string;
  name: string;
  status: number;
}

interface CatalogFormValues {
  description?: string;
  groupId: number | undefined;
  key: string;
  name: string;
  status: number;
}

function buildGroupFormDefaults(): GroupFormValues {
  return {
    description: '',
    key: '',
    name: '',
    status: ENABLED_STATUS,
  };
}

function buildCatalogFormDefaults(
  activeGroupId: number | null,
  groups: DictionaryGroupItem[],
): CatalogFormValues {
  return {
    description: '',
    groupId: activeGroupId ?? groups[0]?.id,
    key: '',
    name: '',
    status: ENABLED_STATUS,
  };
}

export function useDictionaryPage(
  gridRef: { value: InstanceType<typeof DxVxeGrid> | undefined },
) {
  const router = useRouter();
  const accessStore = useAccessStore();
  const { hasAccessByCodes } = useAccess();

  const groups = ref<DictionaryGroupItem[]>([]);
  const activeGroupId = ref<null | number>(null);
  const loadingGroups = ref(false);

  const groupDrawerOpen = ref(false);
  const groupDrawerSaving = ref(false);
  const editingGroup = ref<DictionaryGroupItem | null>(null);
  const groupFormRef = ref<DxSchemaFormExpose | null>(null);
  const groupFormResetValues = ref<GroupFormValues | null>(null);

  const catalogDrawerOpen = ref(false);
  const catalogDrawerSaving = ref(false);
  const editingCatalog = ref<DictionaryCatalogItem | null>(null);
  const catalogFormRef = ref<DxSchemaFormExpose | null>(null);
  const catalogFormResetValues = ref<CatalogFormValues | null>(null);

  function hasAnyCode(codes: string[]) {
    if (!accessStore.isAccessChecked) {
      return false;
    }
    return hasAccessByCodes(codes);
  }

  const canCreateGroup = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.dictQuery,
      SYSTEM_PERMISSION_CODES.dictGroupCreate,
    ]),
  );
  const canUpdateGroup = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.dictQuery,
      SYSTEM_PERMISSION_CODES.dictGroupUpdate,
    ]),
  );
  const canCreateCatalog = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.dictQuery,
      SYSTEM_PERMISSION_CODES.dictCatalogCreate,
    ]),
  );
  const canUpdateCatalog = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.dictQuery,
      SYSTEM_PERMISSION_CODES.dictCatalogUpdate,
    ]),
  );
  const canManageItems = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.dictQuery,
      SYSTEM_PERMISSION_CODES.dictItemQuery,
    ]),
  );

  const visibleGroups = computed(() => groups.value);

  const statusOptions = useEnum('dictionary_status').selectOptions;

  const groupSelectOptions = computed(() =>
    groups.value.map((item) => ({
      disabled: item.status !== ENABLED_STATUS,
      label: item.name,
      value: item.id,
    })),
  );

  const groupDrawerTitle = computed(() =>
    editingGroup.value
      ? $t('system.dictionary.actions.editGroup')
      : $t('system.dictionary.actions.addGroup'),
  );

  const catalogDrawerTitle = computed(() =>
    editingCatalog.value
      ? $t('system.dictionary.actions.editCatalog')
      : $t('system.dictionary.actions.addCatalog'),
  );

  const groupFormSchema = computed<DxFormSchema[]>(() => [
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: $t('system.dictionary.groupFields.key'),
      },
      defaultValue: '',
      fieldName: 'key',
      label: $t('system.dictionary.groupFields.key'),
      required: true,
      rules: z
        .string({
          required_error: $t('system.dictionary.groupFields.key'),
        })
        .trim()
        .min(1, {
          message: $t('system.dictionary.groupFields.key'),
        }),
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: $t('system.dictionary.groupFields.name'),
      },
      defaultValue: '',
      fieldName: 'name',
      label: $t('system.dictionary.groupFields.name'),
      required: true,
      rules: z
        .string({
          required_error: $t('system.dictionary.groupFields.name'),
        })
        .trim()
        .min(1, {
          message: $t('system.dictionary.groupFields.name'),
        }),
    },
    {
      component: 'Textarea',
      componentProps: {
        autoSize: { minRows: 4, maxRows: 8 },
        placeholder: $t('system.dictionary.groupFields.description'),
      },
      defaultValue: '',
      fieldName: 'description',
      label: $t('system.dictionary.groupFields.description'),
    },
    {
      component: markRaw(DxMetaSelect),
      modelPropName: 'value',
      componentProps: {
        allowClear: false,
        options: statusOptions.value,
      },
      defaultValue: ENABLED_STATUS,
      fieldName: 'status',
      label: $t('system.dictionary.groupFields.status'),
      required: true,
    },
  ]);

  const catalogFormSchema = computed<DxFormSchema[]>(() => [
    {
      component: 'Select',
      componentProps: {
        allowClear: false,
        options: groupSelectOptions.value,
        placeholder: $t('system.dictionary.catalogFields.group'),
      },
      defaultValue: activeGroupId.value ?? groups.value[0]?.id,
      fieldName: 'groupId',
      label: $t('system.dictionary.catalogFields.group'),
      required: true,
      rules: z
        .number({
          required_error: $t('system.dictionary.validation.groupRequired'),
        })
        .finite({
          message: $t('system.dictionary.validation.groupRequired'),
        }),
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: $t('system.dictionary.catalogFields.key'),
      },
      defaultValue: '',
      fieldName: 'key',
      label: $t('system.dictionary.catalogFields.key'),
      required: true,
      rules: z
        .string({
          required_error: $t('system.dictionary.catalogFields.key'),
        })
        .trim()
        .min(1, {
          message: $t('system.dictionary.catalogFields.key'),
        }),
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: $t('system.dictionary.catalogFields.name'),
      },
      defaultValue: '',
      fieldName: 'name',
      label: $t('system.dictionary.catalogFields.name'),
      required: true,
      rules: z
        .string({
          required_error: $t('system.dictionary.catalogFields.name'),
        })
        .trim()
        .min(1, {
          message: $t('system.dictionary.catalogFields.name'),
        }),
    },
    {
      component: 'Textarea',
      componentProps: {
        autoSize: { minRows: 4, maxRows: 8 },
        placeholder: $t('system.dictionary.catalogFields.description'),
      },
      defaultValue: '',
      fieldName: 'description',
      label: $t('system.dictionary.catalogFields.description'),
    },
    {
      component: markRaw(DxMetaSelect),
      modelPropName: 'value',
      componentProps: {
        allowClear: false,
        options: statusOptions.value,
      },
      defaultValue: ENABLED_STATUS,
      fieldName: 'status',
      label: $t('system.dictionary.catalogFields.status'),
      required: true,
    },
  ]);

  async function loadGroups() {
    loadingGroups.value = true;
    try {
      const response = await getDictionaryGroups();
      groups.value = response.items;
      if (
        activeGroupId.value &&
        response.items.some((item) => item.id === activeGroupId.value)
      ) {
        return;
      }
      activeGroupId.value = response.items[0]?.id ?? null;
    } finally {
      loadingGroups.value = false;
    }
  }

  async function queryGrid(extra: Record<string, unknown> = {}) {
    await gridRef.value?.gridApi?.query({
      groupId: activeGroupId.value ?? undefined,
      ...extra,
    });
  }

  async function initialize() {
    await loadGroups();
    await nextTick();
    if (!activeGroupId.value) {
      return;
    }
    await queryGrid();
  }

  async function handleGroupChange(groupId: number) {
    activeGroupId.value = groupId;
    await queryGrid({
      groupId,
    });
  }

  async function openCreateGroup() {
    editingGroup.value = null;
    groupFormResetValues.value = buildGroupFormDefaults();
    groupDrawerOpen.value = true;
  }

  async function openEditGroup(group: DictionaryGroupItem) {
    editingGroup.value = group;
    groupFormResetValues.value = {
      description: group.description || '',
      key: group.key,
      name: group.name,
      status: group.status,
    };
    groupDrawerOpen.value = true;
  }

  async function submitGroup() {
    try {
      const validation = await groupFormRef.value?.validate();
      if (!validation) {
        return;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[dictionary] submitGroup validate error', error);
      }
      return;
    }

    const values = await groupFormRef.value?.getValues<GroupFormValues>();
    if (!values) {
      return;
    }

    groupDrawerSaving.value = true;
    try {
      const payload:
        | CreateDictionaryGroupRequest
        | UpdateDictionaryGroupRequest = {
        description: values.description?.trim() || undefined,
        key: values.key.trim(),
        name: values.name.trim(),
        status: values.status,
      };

      if (editingGroup.value) {
        await updateDictionaryGroup(editingGroup.value.id, payload);
        message.success($t('system.dictionary.messages.groupUpdateSuccess'));
      } else {
        await createDictionaryGroup(payload);
        message.success($t('system.dictionary.messages.groupCreateSuccess'));
      }

      groupDrawerOpen.value = false;
      await loadGroups();
      await queryGrid();
    } finally {
      groupDrawerSaving.value = false;
    }
  }

  async function openCreateCatalog() {
    editingCatalog.value = null;
    catalogFormResetValues.value = buildCatalogFormDefaults(
      activeGroupId.value,
      groups.value,
    );
    catalogDrawerOpen.value = true;
  }

  async function openEditCatalog(catalog: DictionaryCatalogItem) {
    editingCatalog.value = catalog;
    catalogFormResetValues.value = {
      description: catalog.description || '',
      groupId: catalog.groupId,
      key: catalog.key,
      name: catalog.name,
      status: catalog.status,
    };
    catalogDrawerOpen.value = true;
  }

  async function submitCatalog() {
    try {
      const validation = await catalogFormRef.value?.validate();
      if (!validation) {
        return;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[dictionary] submitCatalog validate error', error);
      }
      return;
    }

    const values = await catalogFormRef.value?.getValues<CatalogFormValues>();
    if (!values) {
      return;
    }

    catalogDrawerSaving.value = true;
    try {
      const payload:
        | CreateDictionaryCatalogRequest
        | UpdateDictionaryCatalogRequest = {
        description: values.description?.trim() || undefined,
        groupId: values.groupId!,
        key: values.key.trim(),
        name: values.name.trim(),
        status: values.status,
      };

      if (editingCatalog.value) {
        await updateDictionaryCatalog(editingCatalog.value.id, payload);
        message.success($t('system.dictionary.messages.catalogUpdateSuccess'));
      } else {
        await createDictionaryCatalog(payload);
        message.success($t('system.dictionary.messages.catalogCreateSuccess'));
      }

      catalogDrawerOpen.value = false;
      await loadGroups();
      await queryGrid();
    } finally {
      catalogDrawerSaving.value = false;
    }
  }

  function goToItems(record: DictionaryCatalogItem) {
    void router.push({
      name: 'DictionaryItems',
      params: {
        catalogKey: record.key,
      },
    });
  }

  const gridOptions = computed<VbenVxeGridProps>(() => ({
    gridOptions: {
      height: 'auto',
      pagerConfig: {
        pageSize: 20,
        pageSizes: [20, 50, 100],
      },
      rowConfig: { isHover: true, keyField: 'id' },
      proxyConfig: {
        autoLoad: false,
        ajax: {
          query: async (
            { page }: { page: { currentPage: number; pageSize: number } },
            formValues: CatalogQueryForm,
          ) => {
            return await getDictionaryCatalogs({
              groupId: activeGroupId.value ?? undefined,
              keyword: formValues?.keyword?.trim() || undefined,
              page: page.currentPage,
              pageSize: page.pageSize,
              status: formValues?.status,
            });
          },
        },
      },
      toolbarConfig: {
        custom: true,
        refresh: true,
        search: true,
        zoom: true,
      },
      columns: [
        { title: $t('system.dictionary.columns.seq'), type: 'seq', width: 60 },
        {
          field: 'name',
          minWidth: 180,
          title: $t('system.dictionary.columns.name'),
        },
        {
          field: 'key',
          minWidth: 180,
          title: $t('system.dictionary.columns.key'),
        },
        {
          field: 'status',
          minWidth: 100,
          slots: { default: 'status' },
          title: $t('system.dictionary.columns.status'),
        },
        {
          field: 'itemCount',
          minWidth: 100,
          title: $t('system.dictionary.columns.itemCount'),
        },
        {
          field: 'updatedAt',
          minWidth: 180,
          slots: { default: 'updatedAt' },
          title: $t('system.dictionary.columns.updatedAt'),
        },
        {
          fixed: 'right',
          minWidth: 180,
          slots: { default: 'actions' },
          title: $t('system.dictionary.columns.actions'),
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
          component: 'Input',
          componentProps: {
            allowClear: true,
            style: {
              minWidth: '220px',
              width: '220px',
            },
          },
          fieldName: 'keyword',
          label: $t('system.dictionary.catalogKeyword'),
        },
        {
          component: 'Select',
          componentProps: {
            allowClear: true,
            options: statusOptions.value,
            placeholder: $t('system.dictionary.statusPlaceholder'),
            style: {
              minWidth: '180px',
              width: '180px',
            },
          },
          fieldName: 'status',
          label: $t('system.dictionary.catalogStatus'),
        },
      ],
    },
    separator: false,
  }));

  return {
    Button,
    Empty,
    IconifyIcon,
    Popover,
    activeGroupId,
    canCreateCatalog,
    canCreateGroup,
    canManageItems,
    canUpdateCatalog,
    canUpdateGroup,
    catalogDrawerOpen,
    catalogDrawerSaving,
    catalogDrawerTitle,
    catalogFormResetValues,
    catalogFormRef,
    catalogFormSchema,
    goToItems,
    gridOptions,
    groupDrawerOpen,
    groupDrawerSaving,
    groupDrawerTitle,
    groupFormResetValues,
    groupFormRef,
    groupFormSchema,
    groupSelectOptions,
    handleGroupChange,
    initialize,
    loadingGroups,
    openCreateCatalog,
    openCreateGroup,
    openEditCatalog,
    openEditGroup,
    queryGrid,
    statusOptions,
    submitCatalog,
    submitGroup,
    visibleGroups,
  };
}
