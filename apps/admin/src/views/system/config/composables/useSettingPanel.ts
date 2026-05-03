import type { ConfigGroupItem, SystemSettingItem } from '#/api';
import type { ComputedRef, Ref } from 'vue';

import { computed, markRaw, ref } from 'vue';

import { formatEmpty } from '@vben/utils';

import { message, Modal } from 'ant-design-vue';

import {
  createSystemSetting,
  deleteSystemSetting,
  updateSystemSetting,
  updateSystemSettingStatus,
  updateSystemSettingValue,
} from '#/api';
import { DxMetaSelect } from '#/components/common';
import type { DxSchemaFormExpose, DxFormSchema } from '#/components/common';
import { z } from '#/adapter/form';
import {
  DISABLED_STATUS,
  ENABLED_STATUS,
  SETTING_OBJECT_TYPE_CONFIG,
  SETTING_OBJECT_TYPE_FLAG,
  SETTING_VALUE_TYPE_BOOLEAN,
  SETTING_VALUE_TYPE_JSON,
  SETTING_VALUE_TYPE_NUMBER,
  SETTING_VALUE_TYPE_STRING,
  type ConfigStatus,
  type SettingObjectType,
  type SettingValueType,
  isEnabledStatus,
} from '#/constants';
import { $t } from '#/locales';

import SettingValueField from '../components/SettingValueField.vue';
import { useConfigMetadataOptions } from './useConfigMetadataOptions';

interface SettingFormValues {
  description?: string;
  groupId: number | undefined;
  key: string;
  objectType: SettingObjectType;
  sortOrder: number | undefined;
  status: ConfigStatus;
  title: string;
  value: boolean | number | string | undefined;
  valueType: SettingValueType;
}

interface UseSettingPanelOptions {
  activeGroupId: Ref<number | null>;
  canDeleteSetting: ComputedRef<boolean>;
  canToggleSettingStatus: ComputedRef<boolean>;
  canUpdateSetting: ComputedRef<boolean>;
  canUpdateSettingValue: ComputedRef<boolean>;
  groups: Ref<ConfigGroupItem[]>;
  queryGrid: () => Promise<void>;
  reloadData: () => Promise<void>;
}

function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function buildJSONValue(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

function buildSettingFormDefaults(
  activeGroupId: Ref<number | null>,
  groups: Ref<ConfigGroupItem[]>,
): SettingFormValues {
  return {
    description: '',
    groupId: activeGroupId.value ?? groups.value[0]?.id,
    key: '',
    objectType: SETTING_OBJECT_TYPE_CONFIG,
    sortOrder: 0,
    status: ENABLED_STATUS,
    title: '',
    value: '',
    valueType: SETTING_VALUE_TYPE_STRING,
  };
}

function buildSettingValueByType(
  row: SystemSettingItem,
): boolean | number | string | undefined {
  if (row.valueType === SETTING_VALUE_TYPE_BOOLEAN) {
    return Boolean(row.value);
  }
  if (row.valueType === SETTING_VALUE_TYPE_NUMBER) {
    return typeof row.value === 'number'
      ? row.value
      : row.value !== null && row.value !== undefined && row.value !== ''
        ? Number(row.value)
        : undefined;
  }
  if (row.valueType === SETTING_VALUE_TYPE_JSON) {
    return buildJSONValue(row.value);
  }
  return row.value == null ? '' : String(row.value);
}

function buildDefaultSettingValue(
  valueType: SettingValueType,
): boolean | number | string | undefined {
  switch (valueType) {
    case SETTING_VALUE_TYPE_BOOLEAN:
      return false;
    case SETTING_VALUE_TYPE_NUMBER:
      return undefined;
    case SETTING_VALUE_TYPE_JSON:
      return '{\n\n}';
    default:
      return '';
  }
}

function resolveSettingValue(
  values: SettingFormValues,
): boolean | number | Record<string, any> | string | undefined {
  switch (values.valueType) {
    case SETTING_VALUE_TYPE_BOOLEAN:
      return Boolean(values.value);
    case SETTING_VALUE_TYPE_JSON: {
      const raw = typeof values.value === 'string' ? values.value.trim() : '';
      const input = raw || 'null';
      try {
        return JSON.parse(input);
      } catch {
        message.error($t('system.config.validation.jsonInvalid'));
        return undefined;
      }
    }
    case SETTING_VALUE_TYPE_NUMBER: {
      if (
        values.value === undefined ||
        values.value === null ||
        values.value === ''
      ) {
        message.error($t('system.config.validation.numberRequired'));
        return undefined;
      }
      const resolved =
        typeof values.value === 'number' ? values.value : Number(values.value);
      if (Number.isNaN(resolved)) {
        message.error($t('system.config.validation.numberRequired'));
        return undefined;
      }
      return resolved;
    }
    default:
      return typeof values.value === 'string'
        ? values.value
        : values.value == null
          ? ''
          : String(values.value);
  }
}

export function useSettingPanel(options: UseSettingPanelOptions) {
  const metadataOptions = useConfigMetadataOptions();

  const settingFormRef = ref<DxSchemaFormExpose | null>(null);
  const settingDrawerOpen = ref(false);
  const settingDrawerMode = ref<'create' | 'edit'>('create');
  const settingDrawerSaving = ref(false);
  const editingSetting = ref<SystemSettingItem | null>(null);
  const settingFormResetValues = ref<SettingFormValues | null>(null);
  const togglingSettingKeys = ref<string[]>([]);
  const settingFormHydrating = ref(false);

  const groupSelectOptions = computed(() =>
    options.groups.value.map((group) => ({
      disabled: group.status !== ENABLED_STATUS,
      label: group.name,
      value: group.id,
    })),
  );

  const isCreateSettingMode = computed(
    () => settingDrawerMode.value === 'create',
  );

  const settingDrawerTitle = computed(() => {
    return isCreateSettingMode.value
      ? $t('system.config.drawer.createSettingTitle')
      : $t('system.config.drawer.editSettingTitle', {
          title: editingSetting.value?.title || '',
        });
  });

  const settingFormSchema = computed<DxFormSchema[]>(() => {
    const isCreateMode = isCreateSettingMode.value;
    return [
      {
        component: 'Input',
        componentProps: {
          allowClear: true,
          disabled: !isCreateMode,
          placeholder: $t('system.config.fields.key'),
        },
        defaultValue: '',
        fieldName: 'key',
        label: $t('system.config.fields.key'),
        rules: z
          .string({
            required_error: $t('system.config.validation.keyRequired'),
          })
          .trim()
          .min(1, {
            message: $t('system.config.validation.keyRequired'),
          }),
        required: true,
      },
      {
        component: 'Input',
        componentProps: {
          allowClear: true,
          placeholder: $t('system.config.fields.title'),
        },
        defaultValue: '',
        fieldName: 'title',
        label: $t('system.config.fields.title'),
        rules: z
          .string({
            required_error: $t('system.config.validation.titleRequired'),
          })
          .trim()
          .min(1, {
            message: $t('system.config.validation.titleRequired'),
          }),
        required: true,
      },
      {
        component: 'Textarea',
        componentProps: {
          autoSize: { minRows: 3, maxRows: 6 },
          placeholder: $t('system.config.fields.description'),
        },
        defaultValue: '',
        fieldName: 'description',
        label: $t('system.config.fields.description'),
      },
      {
        component: 'Select',
        componentProps: {
          allowClear: false,
          options: groupSelectOptions.value,
          placeholder: $t('system.config.fields.group'),
        },
        defaultValue: options.activeGroupId.value ?? options.groups.value[0]?.id,
        fieldName: 'groupId',
        label: $t('system.config.fields.group'),
        required: true,
      },
      {
        component: markRaw(DxMetaSelect),
        modelPropName: 'value',
        componentProps: {
          allowClear: false,
          disabled: !isCreateMode,
          options: metadataOptions.settingObjectTypeEnum.selectOptions.value,
        },
        defaultValue: SETTING_OBJECT_TYPE_CONFIG,
        fieldName: 'objectType',
        label: $t('system.config.fields.objectType'),
        required: true,
      },
      {
        component: markRaw(DxMetaSelect),
        modelPropName: 'value',
        componentProps: (values: Record<string, any>) => {
          const objectType = values.objectType as SettingObjectType | undefined;
          const allowValues =
            objectType === SETTING_OBJECT_TYPE_FLAG
              ? [SETTING_VALUE_TYPE_BOOLEAN]
              : [
                  SETTING_VALUE_TYPE_JSON,
                  SETTING_VALUE_TYPE_NUMBER,
                  SETTING_VALUE_TYPE_STRING,
                ];
          return {
            allowClear: false,
            allowValues,
            disabled: !isCreateMode || objectType === SETTING_OBJECT_TYPE_FLAG,
            options: metadataOptions.settingValueTypeEnum.selectOptions.value,
          };
        },
        defaultValue: SETTING_VALUE_TYPE_STRING,
        dependencies: {
          trigger: (values: Record<string, any>, formApi: any) => {
            if (settingFormHydrating.value) {
              return;
            }
            if (values.objectType === SETTING_OBJECT_TYPE_FLAG) {
              void formApi.setFieldValue(
                'valueType',
                SETTING_VALUE_TYPE_BOOLEAN,
                false,
              );
              void formApi.setFieldValue(
                'value',
                buildDefaultSettingValue(SETTING_VALUE_TYPE_BOOLEAN),
                false,
              );
              return;
            }

            if (values.valueType === SETTING_VALUE_TYPE_BOOLEAN) {
              void formApi.setFieldValue(
                'valueType',
                SETTING_VALUE_TYPE_STRING,
                false,
              );
              void formApi.setFieldValue(
                'value',
                buildDefaultSettingValue(SETTING_VALUE_TYPE_STRING),
                false,
              );
              return;
            }

            const nextValue = buildDefaultSettingValue(values.valueType as SettingValueType);
            if (values.value !== nextValue) {
              void formApi.setFieldValue('value', nextValue, false);
            }
          },
          triggerFields: ['objectType', 'valueType'],
        },
        fieldName: 'valueType',
        label: $t('system.config.fields.valueType'),
        required: true,
      },
      {
        component: markRaw(SettingValueField),
        modelPropName: 'value',
        componentProps: (values: Record<string, any>) => {
          return {
            placeholder: $t('system.config.fields.value'),
            valueType: values.valueType as SettingValueType,
          };
        },
        defaultValue: '',
        dependencies: {
          rules: (values: Record<string, any>) => {
            if (values.valueType !== SETTING_VALUE_TYPE_JSON) {
              return null;
            }
            return z
              .string()
              .min(1, { message: $t('system.config.validation.jsonInvalid') })
              .refine((value) => {
                try {
                  JSON.parse(value || 'null');
                  return true;
                } catch {
                  return false;
                }
              }, $t('system.config.validation.jsonInvalid'));
          },
          triggerFields: ['valueType'],
        },
        fieldName: 'value',
        label: $t('system.config.fields.value'),
        required: true,
      },
      {
        component: 'InputNumber',
        componentProps: {
          class: 'w-full',
          min: 0,
        },
        defaultValue: 0,
        fieldName: 'sortOrder',
        label: $t('system.config.fields.sortOrder'),
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
        label: $t('system.config.fields.status'),
        required: true,
      },
    ];
  });

  // 只负责加载设置值，不掺杂列表刷新与弹窗提交逻辑。
  function buildFormValues(row: SystemSettingItem): SettingFormValues {
    return {
      description: row.description || '',
      groupId: row.groupId,
      key: row.key,
      objectType: row.objectType,
      sortOrder: row.sortOrder ?? 0,
      status: row.status,
      title: row.title,
      value: buildSettingValueByType(row),
      valueType: row.valueType,
    };
  }

  // 打开新增设置弹窗时，切回创建模式并清空所有字段。
  async function openCreateSetting() {
    settingDrawerMode.value = 'create';
    editingSetting.value = null;
    settingFormHydrating.value = true;
    settingFormResetValues.value = buildSettingFormDefaults(
      options.activeGroupId,
      options.groups,
    );
    settingDrawerOpen.value = true;
  }

  // 打开编辑设置弹窗时，先重置再回填，避免脏状态残留。
  async function openEditSetting(row: SystemSettingItem) {
    editingSetting.value = row;
    settingDrawerMode.value = 'edit';
    settingFormHydrating.value = true;
    settingFormResetValues.value = buildFormValues(row);
    settingDrawerOpen.value = true;
  }

  // reset-values 完成回填后，解除联动屏蔽。
  function handleSettingFormResetValuesApplied() {
    settingFormHydrating.value = false;
  }

  // 新增/编辑设置提交入口，内部根据模式分流到不同 API。
  async function submitSetting() {
    const validation = await settingFormRef.value?.validate();
    if (!validation) {
      return;
    }

    const values = await settingFormRef.value?.getValues<SettingFormValues>();
    if (!values) {
      return;
    }

    const nextValue = resolveSettingValue(values);
    if (nextValue === undefined) {
      return;
    }

    settingDrawerSaving.value = true;
    try {
      if (isCreateSettingMode.value) {
        await createSystemSetting({
          description: normalizeText(values.description || ''),
          groupId: values.groupId!,
          key: values.key.trim(),
          objectType: values.objectType,
          sortOrder: values.sortOrder ?? 0,
          status: values.status,
          title: values.title.trim(),
          value: nextValue,
          valueType: values.valueType,
        });
        message.success($t('system.config.messages.createSettingSuccess'));
      } else if (editingSetting.value) {
        await updateSystemSetting(editingSetting.value.id, {
          description: normalizeText(values.description || ''),
          groupId: values.groupId!,
          objectType: values.objectType,
          sortOrder: values.sortOrder ?? 0,
          status: values.status,
          title: values.title.trim(),
          valueType: values.valueType,
        });
        await updateSystemSettingValue(editingSetting.value.key, {
          value: nextValue,
        });
        message.success($t('system.config.messages.updateSettingSuccess'));
      }

      settingDrawerOpen.value = false;
      await options.reloadData();
    } finally {
      settingDrawerSaving.value = false;
    }
  }

  // 维护开关类型设置的异步状态，避免重复点击。
  function setToggling(key: string, loading: boolean) {
    if (loading) {
      togglingSettingKeys.value = [
        ...new Set([...togglingSettingKeys.value, key]),
      ];
      return;
    }
    togglingSettingKeys.value = togglingSettingKeys.value.filter(
      (item) => item !== key,
    );
  }

  // 切换 flag 型设置值时，单独走值更新接口。
  async function executeToggleFlag(row: SystemSettingItem) {
    setToggling(row.key, true);
    try {
      await updateSystemSettingValue(row.key, {
        value: !Boolean(row.value),
      });
      message.success($t('system.config.messages.updateSettingValueSuccess'));
      await options.queryGrid();
    } finally {
      setToggling(row.key, false);
    }
  }

  // 在开关切换前弹一次确认，防止误操作。
  function requestToggleFlag(row: SystemSettingItem) {
    if (!options.canUpdateSettingValue.value || row.status !== ENABLED_STATUS) {
      return;
    }

    Modal.confirm({
      content: Boolean(row.value)
        ? $t('system.config.confirmToggleOff')
        : $t('system.config.confirmToggleOn'),
      title: $t('system.config.confirmToggleTitle', { title: row.title }),
      onOk: async () => {
        await executeToggleFlag(row);
      },
    });
  }

  // 仅切换设置状态，不影响其他元信息。
  async function handleSettingStatusChange(row: SystemSettingItem) {
    const nextStatus = isEnabledStatus(row.status)
      ? DISABLED_STATUS
      : ENABLED_STATUS;
    await updateSystemSettingStatus(row.id, { status: nextStatus });
    message.success($t('system.config.messages.updateSettingStatusSuccess'));
    await options.reloadData();
  }

  // 内置设置不允许删除，其他情况统一走确认弹窗。
  function requestDeleteSetting(row: SystemSettingItem) {
    if (row.isSystem) {
      return;
    }
    Modal.confirm({
      content: $t('system.config.confirmSettingDelete', { title: row.title }),
      title: $t('system.config.confirmDeleteTitle'),
      onOk: async () => {
        await deleteSystemSetting(row.id);
        message.success($t('system.config.messages.deleteSettingSuccess'));
        await options.reloadData();
      },
    });
  }

  // 组装当前行可见操作，模板层只关心这个结果，不再自己拼动作。
  function buildRowActions(row: SystemSettingItem) {
    return [
      {
        hidden: !canEditSetting.value,
        key: 'edit',
        label: $t('system.config.actions.edit'),
        onClick: () => openEditSetting(row),
      },
      {
        confirmTitle: isEnabledStatus(row.status)
          ? $t('system.config.confirmSettingDisable', { title: row.title })
          : $t('system.config.confirmSettingEnable', { title: row.title }),
        hidden: !options.canToggleSettingStatus.value,
        key: 'toggleStatus',
        label: isEnabledStatus(row.status)
          ? $t('system.config.actions.disable')
          : $t('system.config.actions.enable'),
        onClick: () => handleSettingStatusChange(row),
      },
      {
        hidden: !options.canDeleteSetting.value || row.isSystem,
        key: 'delete',
        label: $t('system.config.actions.delete'),
        onClick: () => requestDeleteSetting(row),
      },
    ];
  }

  // 按当前值类型把表格里的 value 转成可读字符串。
  function formatSettingValue(row: SystemSettingItem) {
    if (row.value === null || row.value === undefined || row.value === '') {
      return formatEmpty(undefined);
    }
    if (row.valueType === SETTING_VALUE_TYPE_JSON) {
      return JSON.stringify(row.value);
    }
    return String(row.value);
  }

  const canEditSetting = computed(
    () => options.canUpdateSetting.value || options.canUpdateSettingValue.value,
  );

  return {
    buildRowActions,
    canEditSetting,
    editingSetting,
    formatSettingValue,
    groupSelectOptions,
    handleSettingStatusChange,
    isCreateSettingMode,
    openCreateSetting,
    openEditSetting,
    requestDeleteSetting,
    requestToggleFlag,
    settingDrawerMode,
    settingDrawerOpen,
    settingDrawerSaving,
    settingDrawerTitle,
    settingFormResetValues,
    settingFormRef,
    settingFormSchema,
    submitSetting,
    togglingSettingKeys,
    handleSettingFormResetValuesApplied,
  };
}
