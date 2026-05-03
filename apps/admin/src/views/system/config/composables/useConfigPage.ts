import type { ConfigGroupItem } from '#/api';

import { computed, markRaw, nextTick, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useAccessStore } from '@vben/stores';

import { message, Modal } from 'ant-design-vue';

import {
  createConfigGroup,
  deleteConfigGroup,
  getConfigGroups,
  getSystemSettings,
  updateConfigGroup,
} from '#/api';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import type { DxSchemaFormExpose, DxFormSchema } from '#/components/common';
import { DxMetaSelect } from '#/components/common';
import { z } from '#/adapter/form';
import {
  ENABLED_STATUS,
  SYSTEM_PERMISSION_CODES,
  type ConfigStatus,
  type SettingObjectType,
} from '#/constants';
import { $t } from '#/locales';

import { useEnum } from '#/composables/useMeta';

import { useConfigMetadataOptions } from './useConfigMetadataOptions';
import { useSettingPanel } from './useSettingPanel';

type VbenVxeGridProps = Parameters<typeof useVbenVxeGrid>[0];
type GroupFormMode = 'create' | 'edit';

interface GridQueryForm {
  groupId?: number;
  keyword?: string;
  objectType?: SettingObjectType;
}

interface GroupFormValues {
  code: string;
  description?: string;
  name: string;
  sortOrder: number;
  status: ConfigStatus;
}

function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function buildGroupFormDefaults(): GroupFormValues {
  return {
    code: '',
    description: undefined,
    name: '',
    sortOrder: 0,
    status: ENABLED_STATUS,
  };
}

export function useConfigPage() {
  const gridRef = ref<any>();
  const groupFormRef = ref<DxSchemaFormExpose | null>(null);

  const accessStore = useAccessStore();
  const { hasAccessByCodes } = useAccess();

  const metadataOptions = useConfigMetadataOptions();

  const groups = ref<ConfigGroupItem[]>([]);
  const activeGroupId = ref<number | null>(null);
  const groupDrawerOpen = ref(false);
  const groupDrawerMode = ref<GroupFormMode>('create');
  const groupDrawerSaving = ref(false);
  const editingGroup = ref<ConfigGroupItem | null>(null);
  const groupFormResetValues = ref<GroupFormValues | null>(null);

  const groupDrawerTitle = computed(() => {
    return groupDrawerMode.value === 'create'
      ? $t('system.config.drawer.createGroupTitle')
      : $t('system.config.drawer.editGroupTitle', {
          name: editingGroup.value?.name || '',
        });
  });

  function hasAnyCode(codes: string[]) {
    if (!accessStore.isAccessChecked) {
      return false;
    }
    return hasAccessByCodes(codes);
  }

  // 统一收口配置分组的增删改权限判断，避免模板层重复写权限组合。
  const canCreateGroup = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.configManage,
      SYSTEM_PERMISSION_CODES.configGroupCreate,
    ]),
  );
  const canUpdateGroup = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.configManage,
      SYSTEM_PERMISSION_CODES.configGroupUpdate,
    ]),
  );
  const canDeleteGroup = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.configManage,
      SYSTEM_PERMISSION_CODES.configGroupDelete,
    ]),
  );
  const canCreateSetting = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.configManage,
      SYSTEM_PERMISSION_CODES.configCreate,
    ]),
  );
  const canUpdateSetting = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.configManage,
      SYSTEM_PERMISSION_CODES.configUpdate,
    ]),
  );
  const canDeleteSetting = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.configManage,
      SYSTEM_PERMISSION_CODES.configDelete,
    ]),
  );
  const canToggleSettingStatus = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.configManage,
      SYSTEM_PERMISSION_CODES.configSetStatus,
    ]),
  );
  const canUpdateSettingValue = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.configManage,
      SYSTEM_PERMISSION_CODES.configUpdateValue,
    ]),
  );

  const isSystemEnum = useEnum('is_system');
  const isSystemOptions = isSystemEnum.selectOptions;

  const groupFormSchema = computed<DxFormSchema[]>(() => [
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: $t('system.config.groupFields.code'),
      },
      defaultValue: '',
      fieldName: 'code',
      label: $t('system.config.groupFields.code'),
      rules: z
        .string({
          required_error: $t('system.config.validation.groupCodeRequired'),
        })
        .trim()
        .min(1, {
          message: $t('system.config.validation.groupCodeRequired'),
        }),
      required: true,
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: $t('system.config.groupFields.name'),
      },
      defaultValue: '',
      fieldName: 'name',
      label: $t('system.config.groupFields.name'),
      rules: z
        .string({
          required_error: $t('system.config.validation.groupNameRequired'),
        })
        .trim()
        .min(1, {
          message: $t('system.config.validation.groupNameRequired'),
        }),
      required: true,
    },
    {
      component: 'Textarea',
      componentProps: {
        autoSize: { minRows: 4, maxRows: 8 },
        placeholder: $t('system.config.groupFields.description'),
      },
      defaultValue: '',
      fieldName: 'description',
      label: $t('system.config.groupFields.description'),
    },
    {
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 0,
      },
      defaultValue: 0,
      fieldName: 'sortOrder',
      label: $t('system.config.groupFields.sortOrder'),
      required: true,
    },
    {
      component: markRaw(DxMetaSelect),
      modelPropName: 'value',
      componentProps: {
        allowClear: false,
        options: metadataOptions.configStatusEnum.selectOptions.value,
      },
      defaultValue: ENABLED_STATUS,
      fieldName: 'status',
      label: $t('system.config.groupFields.status'),
      required: true,
    },
  ]);

  // 先拉分组，再保证当前激活分组有效，避免表格请求落在空 groupId 上。
  async function ensureActiveGroup(groupsList: ConfigGroupItem[]) {
    if (groupsList.length === 0) {
      activeGroupId.value = null;
      return;
    }
    if (
      activeGroupId.value &&
      groupsList.some((item) => item.id === activeGroupId.value)
    ) {
      return;
    }
    activeGroupId.value = groupsList[0]?.id ?? null;
  }

  // 只负责加载左侧分组列表，不夹带表格分页逻辑。
  async function loadGroups() {
    const response = await getConfigGroups();
    groups.value = response.items;
    await ensureActiveGroup(response.items);
  }

  // 统一合并查询表单和外部参数，确保分组切换、搜索和分页能共享同一条查询链路。
  const queryGrid = async (params: Partial<GridQueryForm> = {}) => {
    const currentValues = await gridRef.value?.gridApi?.formApi.getValues();
    await gridRef.value?.gridApi?.query({
      ...(currentValues ?? {}),
      ...params,
      groupId: params.groupId ?? activeGroupId.value ?? undefined,
    });
  };

  // 重新拉取分组并刷新表格，供新增/编辑/删除后的回填使用。
  async function reloadData() {
    await loadGroups();
    await queryGrid();
  }

  // 页面初始化时先建立分组基线，再触发表格首屏查询。
  async function initialize() {
    await loadGroups();
    await nextTick();
    await gridRef.value?.gridApi?.formApi.setValues({
      keyword: '',
      objectType: undefined,
    });
    await queryGrid({ keyword: '', objectType: undefined });
  }

  // 切换左侧分组时只更新当前 groupId，并让表格重新查询。
  async function handleGroupChange(groupId: number) {
    activeGroupId.value = groupId;
    await queryGrid({ groupId });
  }

  // 打开新增分组弹窗时，切回创建模式并清空表单状态。
  async function openCreateGroup() {
    editingGroup.value = null;
    groupDrawerMode.value = 'create';
    groupFormResetValues.value = buildGroupFormDefaults();
    groupDrawerOpen.value = true;
  }

  // 打开编辑分组弹窗时，把当前行数据回填到表单。
  async function openEditGroup(group: ConfigGroupItem) {
    editingGroup.value = group;
    groupDrawerMode.value = 'edit';
    groupFormResetValues.value = {
      code: group.code,
      description: group.description || undefined,
      name: group.name,
      sortOrder: group.sortOrder ?? 0,
      status: group.status,
    };
    groupDrawerOpen.value = true;
  }

  // 提交分组表单，内部负责区分新增和编辑两条写入路径。
  async function submitGroup() {
    const validation = await groupFormRef.value?.validate();
    if (!validation) {
      return;
    }

    const values = await groupFormRef.value?.getValues<GroupFormValues>();
    if (!values) {
      return;
    }

    groupDrawerSaving.value = true;
    try {
      const payload = {
        code: values.code.trim(),
        description: normalizeText(values.description || ''),
        name: values.name.trim(),
        sortOrder: values.sortOrder ?? 0,
        status: values.status,
      };

      if (groupDrawerMode.value === 'create') {
        const response = await createConfigGroup(payload);
        activeGroupId.value = response.id;
        message.success($t('system.config.messages.createGroupSuccess'));
      } else if (editingGroup.value) {
        await updateConfigGroup(editingGroup.value.id, payload);
        message.success($t('system.config.messages.updateGroupSuccess'));
      }

      groupDrawerOpen.value = false;
      await reloadData();
    } finally {
      groupDrawerSaving.value = false;
    }
  }

  // 系统内置分组不能删除，避免破坏配置基线。
  function requestDeleteGroup(group: ConfigGroupItem) {
    if (group.isSystem) {
      return;
    }
    Modal.confirm({
      content: $t('system.config.confirmGroupDelete', { name: group.name }),
      title: $t('system.config.confirmDeleteTitle'),
      onOk: async () => {
        await deleteConfigGroup(group.id);
        message.success($t('system.config.messages.deleteGroupSuccess'));
        await reloadData();
      },
    });
  }

  const visibleGroups = computed(() => {
    return groups.value;
  });

  const gridOptions = computed<VbenVxeGridProps>(() => ({
    formOptions: {
      actionWrapperClass: 'ml-auto',
      commonConfig: {
        formItemClass: 'mb-0 flex-none',
        labelClass: 'w-auto',
      },
      layout: 'inline',
      schema: [
        {
          component: 'Input',
          componentProps: {
            allowClear: true,
          },
          fieldName: 'keyword',
          label: $t('system.config.keywordLabel'),
        },
        {
          component: 'Select',
          componentProps: {
            allowClear: true,
            options: metadataOptions.settingObjectTypeEnum.selectOptions.value,
            placeholder: $t('system.config.objectTypePlaceholder'),
            style: {
              minWidth: '160px',
            },
          },
          fieldName: 'objectType',
          label: $t('system.config.objectTypeLabel'),
        },
      ],
      showCollapseButton: false,
      wrapperClass: 'w-full gap-4 flex-row',
    },
    gridOptions: {
      columns: [
        {
          field: 'title',
          minWidth: 180,
          title: $t('system.config.columns.title'),
        },
        {
          field: 'key',
          minWidth: 240,
          title: $t('system.config.columns.key'),
        },
        {
          field: 'objectType',
          title: $t('system.config.columns.objectType'),
          width: 120,
          slots: { default: 'objectType' },
        },
        {
          field: 'value',
          minWidth: 260,
          title: $t('system.config.columns.currentValue'),
          slots: { default: 'currentValue' },
        },
        {
          field: 'isSystem',
          title: $t('system.config.columns.isSystem'),
          width: 120,
          titleSuffix: {
            content: $t('system.config.systemBuiltinTooltip'),
            iconStatus: 'warning',
          },
          slots: { default: 'isSystem' },
        },
        {
          field: 'status',
          title: $t('system.config.columns.status'),
          width: 100,
          slots: { default: 'status' },
        },
        {
          field: 'updatedAt',
          title: $t('system.config.columns.updatedAt'),
          width: 180,
          slots: { default: 'updatedAt' },
        },
        {
          fixed: 'right',
          title: $t('system.config.columns.actions'),
          width: 190,
          slots: { default: 'actions' },
        },
      ],
      height: 'auto',
      proxyConfig: {
        ajax: {
          query: async (
            { page }: { page: { currentPage: number; pageSize: number } },
            formValues: GridQueryForm,
          ) => {
            return await getSystemSettings({
              groupId: activeGroupId.value ?? undefined,
              keyword: formValues?.keyword?.trim() || undefined,
              objectType: formValues?.objectType ?? undefined,
              page: page.currentPage,
              pageSize: page.pageSize,
            });
          },
        },
        autoLoad: false,
      },
      rowConfig: { isHover: true, keyField: 'id' },
      toolbarConfig: {
        custom: true,
        refresh: true,
        search: true,
        zoom: true,
      },
    },
    separator: false,
  }));

  const settingPanel = useSettingPanel({
    activeGroupId,
    canDeleteSetting,
    canToggleSettingStatus,
    canUpdateSetting,
    canUpdateSettingValue,
    groups,
    queryGrid,
    reloadData,
  });

  onMounted(() => {
    void isSystemEnum.refresh();
    void initialize();
  });

  return {
    ...metadataOptions,
    ...settingPanel,
    activeGroupId,
    canCreateGroup,
    canCreateSetting,
    canDeleteGroup,
    canDeleteSetting,
    canToggleSettingStatus,
    canUpdateGroup,
    canUpdateSetting,
    canUpdateSettingValue,
    editingGroup,
    groupDrawerMode,
    groupDrawerOpen,
    groupDrawerSaving,
    groupFormResetValues,
    groupFormRef,
    groupFormSchema,
    gridOptions,
    gridRef,
    handleGroupChange,
    initialize,
    isSystemOptions,
    loadGroups,
    openCreateGroup,
    openEditGroup,
    queryGrid,
    reloadData,
    requestDeleteGroup,
    groupDrawerTitle,
    submitGroup,
    visibleGroups,
  };
}
