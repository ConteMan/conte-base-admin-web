import type { MenuNodeType, MenuTreeItem } from '#/api/modules/menu';
import type {
  CreateMenuRequest,
  UpdateMenuRequest,
} from '#/api/modules/menu';
import type { ComputedRef } from 'vue';

import { computed, markRaw, ref } from 'vue';

import { message, TreeSelect } from 'ant-design-vue';

import { createMenu, updateMenu } from '#/api';
import { z } from '#/adapter/form';
import type {
  DxMetaOption,
  DxSchemaFormExpose,
  DxFormSchema,
} from '#/components/common';
import { DxMetaSelect } from '#/components/common';
import {
  ENABLED_STATUS,
} from '#/constants';
import { $t } from '#/locales';

import { IconPicker } from '@vben/common-ui';

interface MenuFormValues {
  apiMethod?: string;
  apiPath?: string;
  component?: string;
  icon?: string;
  isActive: boolean;
  isHidden: boolean;
  parentId: null | number;
  permissionCode?: string;
  routeName?: string;
  routePath?: string;
  sortOrder: number;
  title: string;
  titleI18nEn?: string;
  type: MenuNodeType;
}

interface ParentTreeNode {
  children?: ParentTreeNode[];
  key: number;
  title: string;
  value: number;
}

interface UseMenuFormOptions {
  hiddenOptions: ComputedRef<DxMetaOption[]>;
  menuTypeOptions: ComputedRef<DxMetaOption[]>;
  parentTreeData: ComputedRef<ParentTreeNode[]>;
  statusOptions: ComputedRef<DxMetaOption[]>;
}

function buildMenuFormDefaults(parentId: null | number = null): MenuFormValues {
  return {
    apiMethod: '',
    apiPath: '',
    component: '',
    icon: '',
    isActive: true,
    isHidden: false,
    parentId,
    permissionCode: '',
    routeName: '',
    routePath: '',
    sortOrder: 100,
    title: '',
    titleI18nEn: '',
    type: 'menu',
  };
}

function normalizeText(value?: string) {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed : undefined;
}

export function useMenuForm(
  reload: () => Promise<void>,
  options: UseMenuFormOptions,
) {
  const saving = ref(false);
  const formVisible = ref(false);
  const formRef = ref<DxSchemaFormExpose | null>(null);
  const editingId = ref<null | number>(null);
  const formResetValues = ref<MenuFormValues | null>(null);

  const isEditing = computed(() => editingId.value !== null);

  const formSchema = computed<DxFormSchema[]>(() => [
    {
      component: markRaw(DxMetaSelect),
      modelPropName: 'value',
      componentProps: {
        allowClear: false,
        options: options.menuTypeOptions.value,
      },
      defaultValue: 'menu',
      fieldName: 'type',
      label: $t('system.menu.nodeType'),
      required: true,
      rules: z
        .string({
          required_error: $t('system.menu.typeRequired'),
        })
        .min(1, {
          message: $t('system.menu.typeRequired'),
        }),
    },
    {
      component: markRaw(TreeSelect),
      modelPropName: 'value',
      componentProps: {
        allowClear: true,
        placeholder: $t('system.menu.parentPlaceholder'),
        treeData: options.parentTreeData.value,
        treeDefaultExpandAll: true,
      },
      defaultValue: null,
      fieldName: 'parentId',
      label: $t('system.menu.parentNode'),
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: $t('system.menu.titlePlaceholder'),
      },
      defaultValue: '',
      fieldName: 'title',
      label: $t('system.menu.titleLabel'),
      required: true,
      rules: z
        .string({
          required_error: $t('system.menu.titleRequired'),
        })
        .trim()
        .min(1, {
          message: $t('system.menu.titleRequired'),
        }),
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: $t('system.menu.titleEnPlaceholder'),
      },
      defaultValue: '',
      fieldName: 'titleI18nEn',
      label: $t('system.menu.titleEn'),
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: $t('system.menu.routeNamePlaceholder'),
      },
      defaultValue: '',
      fieldName: 'routeName',
      label: $t('system.menu.routeName'),
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: $t('system.menu.routePathPlaceholder'),
      },
      defaultValue: '',
      fieldName: 'routePath',
      label: $t('system.menu.routePath'),
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: $t('system.menu.componentPlaceholder'),
      },
      defaultValue: '',
      fieldName: 'component',
      label: $t('system.menu.component'),
    },
    {
      component: markRaw(IconPicker),
      modelPropName: 'value',
      componentProps: {
        pageSize: 96,
        prefix: 'lucide',
      },
      defaultValue: '',
      fieldName: 'icon',
      label: $t('system.menu.icon'),
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: $t('system.menu.permissionCodePlaceholder'),
      },
      defaultValue: '',
      fieldName: 'permissionCode',
      label: $t('system.menu.permissionCodeLabel'),
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: $t('system.menu.apiPathPlaceholder'),
      },
      defaultValue: '',
      dependencies: {
        if: (values: Record<string, any>) => values.type === 'button',
        triggerFields: ['type'],
      },
      fieldName: 'apiPath',
      label: $t('system.menu.apiPath'),
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: $t('system.menu.apiMethodPlaceholder'),
      },
      defaultValue: '',
      dependencies: {
        if: (values: Record<string, any>) => values.type === 'button',
        triggerFields: ['type'],
      },
      fieldName: 'apiMethod',
      label: $t('system.menu.apiMethod'),
    },
    {
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        max: 9999,
        min: 0,
      },
      defaultValue: 100,
      fieldName: 'sortOrder',
      label: $t('system.menu.sortOrderLabel'),
    },
    {
      component: markRaw(DxMetaSelect),
      modelPropName: 'value',
      componentProps: {
        allowClear: false,
        options: options.hiddenOptions.value,
      },
      defaultValue: false,
      fieldName: 'isHidden',
      label: $t('system.menu.hideMenu'),
    },
    {
      component: markRaw(DxMetaSelect),
      modelPropName: 'value',
      componentProps: {
        allowClear: false,
        options: options.statusOptions.value,
      },
      defaultValue: ENABLED_STATUS,
      dependencies: {
        if: () => isEditing.value,
        triggerFields: ['type'],
      },
      fieldName: 'isActive',
      label: $t('system.menu.enableStatus'),
    },
  ]);

  function resetForm() {
    editingId.value = null;
    formResetValues.value = null;
  }

  async function openCreate(parentId: null | number = null) {
    resetForm();
    formResetValues.value = buildMenuFormDefaults(parentId);
    formVisible.value = true;
  }

  async function openEdit(record: MenuTreeItem) {
    editingId.value = record.id;
    formResetValues.value = {
      apiMethod: record.apiMethod || '',
      apiPath: record.apiPath || '',
      component: record.component || '',
      icon: record.icon || '',
      isActive: record.isActive ?? true,
      isHidden: record.isHidden ?? false,
      parentId: record.parentId ?? null,
      permissionCode: record.permissionCode || '',
      routeName: record.routeName || '',
      routePath: record.routePath || '',
      sortOrder: record.sortOrder ?? 100,
      title: record.title || '',
      titleI18nEn: record.titleI18n?.['en-US'] || record.titleEn || '',
      type: (record.type || 'menu') as MenuNodeType,
    };
    formVisible.value = true;
  }

  function buildCreatePayload(values: MenuFormValues): CreateMenuRequest {
    return {
      apiMethod: normalizeText(values.apiMethod),
      apiPath: normalizeText(values.apiPath),
      component: normalizeText(values.component),
      icon: normalizeText(values.icon),
      isHidden: values.isHidden,
      parentId: values.parentId,
      permissionCode: normalizeText(values.permissionCode),
      routeName: normalizeText(values.routeName),
      routePath: normalizeText(values.routePath),
      sortOrder: values.sortOrder,
      title: values.title.trim(),
      titleI18n: {
        'en-US': values.titleI18nEn?.trim() || values.title.trim(),
        'zh-CN': values.title.trim(),
      },
      type: values.type,
    };
  }

  function buildUpdatePayload(values: MenuFormValues): UpdateMenuRequest {
    return {
      ...buildCreatePayload(values),
      isActive: values.isActive,
    };
  }

  async function onSubmit() {
    const validation = await formRef.value?.validate();
    if (!validation) {
      return;
    }

    const values = await formRef.value?.getValues<MenuFormValues>();
    if (!values) {
      return;
    }

    saving.value = true;
    try {
      if (isEditing.value && editingId.value !== null) {
        await updateMenu(editingId.value, buildUpdatePayload(values));
        message.success($t('system.menu.updateSuccess'));
      } else {
        await createMenu(buildCreatePayload(values));
        message.success($t('system.menu.createSuccess'));
      }
      formVisible.value = false;
      await reload();
    } finally {
      saving.value = false;
    }
  }

  function onCloseModal() {
    formVisible.value = false;
    resetForm();
  }

  return {
    formRef,
    formResetValues,
    formSchema,
    formVisible,
    isEditing,
    onCloseModal,
    onSubmit,
    openCreate,
    openEdit,
    saving,
  };
}
