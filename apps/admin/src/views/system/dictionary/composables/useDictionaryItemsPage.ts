import type {
  CreateDictionaryItemRequest,
  DictionaryCatalogDetail,
  DictionaryItem,
  UpdateDictionaryItemRequest,
} from '#/api';
import type { Ref } from 'vue';
import type DxVxeGrid from '#/components/common/DxVxeGrid.vue';

import { computed, markRaw, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { useAccessStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import {
  createDictionaryItem,
  deleteDictionaryItem,
  getDictionaryItems,
  updateDictionaryItem,
} from '#/api';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { z } from '#/adapter/form';
import {
  ENABLED_STATUS,
  SYSTEM_PERMISSION_CODES,
} from '#/constants';
import { $t } from '#/locales';
import { useEnum } from '#/composables/useMeta';
import type {
  DxFormSchema,
  DxSchemaFormExpose,
} from '#/components/common';
import { DxMetaSelect } from '#/components/common';

type VbenVxeGridProps = Parameters<typeof useVbenVxeGrid>[0];

interface ItemQueryForm {
  label?: string;
  status?: number;
  value?: string;
}

interface ItemFormValues {
  extraJson?: string;
  label: string;
  primaryLocale: string;
  sortOrder: number;
  status: number;
  value: string;
}

interface TranslationFormItem {
  id: number;
  label: string;
  locale: string;
}

const DEFAULT_PRIMARY_LOCALE = 'zh-CN';

const DEFAULT_LOCALE_OPTIONS = [
  { label: 'zh-CN', value: 'zh-CN' },
  { label: 'en-US', value: 'en-US' },
  { label: 'ja-JP', value: 'ja-JP' },
  { label: 'ko-KR', value: 'ko-KR' },
  { label: 'zh-TW', value: 'zh-TW' },
];

function buildItemFormDefaults(
  primaryLocale = DEFAULT_PRIMARY_LOCALE,
): ItemFormValues {
  return {
    extraJson: '{}',
    label: '',
    primaryLocale,
    sortOrder: 0,
    status: ENABLED_STATUS,
    value: '',
  };
}

function buildJSONValue(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

export function useDictionaryItemsPage(
  gridRef: Ref<InstanceType<typeof DxVxeGrid> | undefined>,
) {
  const route = useRoute();
  const router = useRouter();
  const accessStore = useAccessStore();
  const { hasAccessByCodes } = useAccess();

  const catalogKey = computed(() => String(route.params.catalogKey || ''));
  const catalogMeta = ref<DictionaryCatalogDetail | null>(null);

  const itemDrawerOpen = ref(false);
  const itemDrawerSaving = ref(false);
  const editingItem = ref<DictionaryItem | null>(null);
  const itemFormRef = ref<DxSchemaFormExpose | null>(null);
  const itemFormResetValues = ref<ItemFormValues | null>(null);
  const itemPrimaryLocale = ref(DEFAULT_PRIMARY_LOCALE);
  const translations = ref<TranslationFormItem[]>([]);
  const translationSeed = ref(0);

  function hasAnyCode(codes: string[]) {
    if (!accessStore.isAccessChecked) {
      return false;
    }
    return hasAccessByCodes(codes);
  }

  const canCreateItem = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.dictQuery,
      SYSTEM_PERMISSION_CODES.dictItemCreate,
    ]),
  );
  const canUpdateItem = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.dictQuery,
      SYSTEM_PERMISSION_CODES.dictItemUpdate,
    ]),
  );
  const canDeleteItem = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.dictQuery,
      SYSTEM_PERMISSION_CODES.dictItemDelete,
    ]),
  );

  const statusOptions = useEnum('dictionary_status').selectOptions;

  const itemDrawerTitle = computed(() =>
    editingItem.value
      ? $t('system.dictionary.actions.editItem')
      : $t('system.dictionary.actions.addItem'),
  );

  const localeOptions = computed(() => DEFAULT_LOCALE_OPTIONS);

  const itemFormSchema = computed<DxFormSchema[]>(() => [
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: $t('system.dictionary.itemFields.label'),
      },
      defaultValue: '',
      fieldName: 'label',
      label: $t('system.dictionary.itemFields.label'),
      required: true,
      rules: z
        .string({
          required_error: $t('system.dictionary.itemFields.label'),
        })
        .trim()
        .min(1, {
          message: $t('system.dictionary.itemFields.label'),
        }),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: localeOptions.value,
        placeholder: $t('system.dictionary.itemFields.primaryLocalePlaceholder'),
        showSearch: true,
      },
      defaultValue: DEFAULT_PRIMARY_LOCALE,
      fieldName: 'primaryLocale',
      label: $t('system.dictionary.itemFields.primaryLocale'),
      required: true,
      rules: z
        .string({
          required_error: $t('system.dictionary.validation.primaryLocaleRequired'),
        })
        .trim()
        .min(1, {
          message: $t('system.dictionary.validation.primaryLocaleRequired'),
        }),
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: $t('system.dictionary.itemFields.value'),
      },
      defaultValue: '',
      fieldName: 'value',
      label: $t('system.dictionary.itemFields.value'),
      required: true,
      rules: z
        .string({
          required_error: $t('system.dictionary.itemFields.value'),
        })
        .trim()
        .min(1, {
          message: $t('system.dictionary.itemFields.value'),
        }),
    },
    {
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 0,
      },
      defaultValue: 0,
      fieldName: 'sortOrder',
      label: $t('system.dictionary.itemFields.sortOrder'),
    },
    {
      component: markRaw(DxMetaSelect),
      componentProps: {
        allowClear: false,
        options: statusOptions.value,
      },
      defaultValue: ENABLED_STATUS,
      fieldName: 'status',
      label: $t('system.dictionary.itemFields.status'),
      modelPropName: 'value',
      required: true,
    },
    {
      component: 'Textarea',
      componentProps: {
        autoSize: { minRows: 8, maxRows: 16 },
        placeholder: $t('system.dictionary.itemFields.extra'),
      },
      defaultValue: '{}',
      fieldName: 'extraJson',
      label: $t('system.dictionary.itemFields.extra'),
    },
  ]);

  function createTranslation(locale = '', label = ''): TranslationFormItem {
    translationSeed.value += 1;
    return {
      id: translationSeed.value,
      label,
      locale,
    };
  }

  function detectPrimaryLocale(item: DictionaryItem) {
    const label = item.label.trim();
    const entries = Object.entries(item.labelI18n || {}).filter(
      ([locale, value]) => locale.trim() && value.trim(),
    );

    const zhCnMatch = entries.find(
      ([locale, value]) => locale === DEFAULT_PRIMARY_LOCALE && value === label,
    );
    if (zhCnMatch) {
      return zhCnMatch[0];
    }

    const exactMatch = entries.find(([, value]) => value === label);
    if (exactMatch) {
      return exactMatch[0];
    }

    return DEFAULT_PRIMARY_LOCALE;
  }

  function resetTranslations() {
    translations.value = [];
  }

  async function openCreateItem() {
    editingItem.value = null;
    itemPrimaryLocale.value = DEFAULT_PRIMARY_LOCALE;
    resetTranslations();
    itemFormResetValues.value = buildItemFormDefaults();
    itemDrawerOpen.value = true;
  }

  async function openEditItem(item: DictionaryItem) {
    const primaryLocale = detectPrimaryLocale(item);

    editingItem.value = item;
    itemPrimaryLocale.value = primaryLocale;
    translations.value = Object.entries(item.labelI18n || {})
      .filter(
        ([locale, value]) =>
          locale !== primaryLocale && locale.trim() && value.trim(),
      )
      .map(([locale, value]) => createTranslation(locale, value));
    itemFormResetValues.value = {
      extraJson: buildJSONValue(item.extra ?? {}),
      label: item.label,
      primaryLocale,
      sortOrder: item.sortOrder,
      status: item.status,
      value: item.value,
    };
    itemDrawerOpen.value = true;
  }

  function addTranslation() {
    translations.value = [...translations.value, createTranslation()];
  }

  function removeTranslation(id: number) {
    translations.value = translations.value.filter((item) => item.id !== id);
  }

  function buildLabelI18n(primaryLocale: string, label: string) {
    const locale = primaryLocale.trim();
    if (!locale) {
      message.error($t('system.dictionary.validation.primaryLocaleRequired'));
      return null;
    }

    const labelI18n: Record<string, string> = {
      [locale]: label,
    };
    const localeSet = new Set([locale]);

    for (const translation of translations.value) {
      const translationLocale = translation.locale.trim();
      const translationLabel = translation.label.trim();

      if (!translationLocale && !translationLabel) {
        continue;
      }

      if (!translationLocale) {
        message.error(
          $t('system.dictionary.validation.translationLocaleRequired'),
        );
        return null;
      }

      if (!translationLabel) {
        message.error(
          $t('system.dictionary.validation.translationLabelRequired', {
            locale: translationLocale,
          }),
        );
        return null;
      }

      if (localeSet.has(translationLocale)) {
        message.error(
          $t('system.dictionary.validation.translationLocaleDuplicate', {
            locale: translationLocale,
          }),
        );
        return null;
      }

      localeSet.add(translationLocale);
      labelI18n[translationLocale] = translationLabel;
    }

    return labelI18n;
  }

  function onItemFormValuesChange(
    changedValues: Record<string, any>,
    values?: Record<string, any>,
  ) {
    const locale =
      changedValues.primaryLocale ?? values?.primaryLocale ?? itemPrimaryLocale.value;
    if (typeof locale === 'string' && locale.trim()) {
      itemPrimaryLocale.value = locale;
    }
  }

  async function loadItems(
    formValues: ItemQueryForm,
    page: { currentPage: number; pageSize: number },
  ) {
    const response = await getDictionaryItems({
      catalogKey: catalogKey.value,
      label: formValues?.label?.trim() || undefined,
      page: page.currentPage,
      pageSize: page.pageSize,
      status: formValues?.status,
      value: formValues?.value?.trim() || undefined,
    });
    catalogMeta.value = response.catalog;
    return response;
  }

  async function initialize() {
    await gridRef.value?.gridApi?.query();
  }

  async function queryGrid() {
    await gridRef.value?.gridApi?.query();
  }

  async function submitItem() {
    const validation = await itemFormRef.value?.validate();
    if (!validation) {
      return;
    }

    const values = await itemFormRef.value?.getValues<ItemFormValues>();
    if (!values) {
      return;
    }

    let extra: Record<string, any> | undefined;
    try {
      extra = JSON.parse(values.extraJson || '{}');
    } catch {
      message.error($t('system.dictionary.validation.extraJsonInvalid'));
      return;
    }

    if (!catalogMeta.value) {
      return;
    }

    const labelI18n = buildLabelI18n(values.primaryLocale, values.label.trim());
    if (!labelI18n) {
      return;
    }

    itemDrawerSaving.value = true;
    try {
      const payload: CreateDictionaryItemRequest | UpdateDictionaryItemRequest =
        {
          catalogId: catalogMeta.value.id,
          extra,
          label: values.label.trim(),
          labelI18n,
          sortOrder: values.sortOrder,
          status: values.status,
          value: values.value.trim(),
        };

      if (editingItem.value) {
        await updateDictionaryItem(editingItem.value.id, payload);
        message.success($t('system.dictionary.messages.itemUpdateSuccess'));
      } else {
        await createDictionaryItem(payload);
        message.success($t('system.dictionary.messages.itemCreateSuccess'));
      }

      itemDrawerOpen.value = false;
      await queryGrid();
    } finally {
      itemDrawerSaving.value = false;
    }
  }

  async function removeItem(item: DictionaryItem) {
    await deleteDictionaryItem(item.id);
    message.success($t('system.dictionary.messages.itemDeleteSuccess'));
    await queryGrid();
  }

  function goBack() {
    void router.push('/system/dictionary');
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
            formValues: ItemQueryForm,
          ) => loadItems(formValues, page),
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
          field: 'label',
          minWidth: 180,
          title: $t('system.dictionary.columns.label'),
        },
        {
          field: 'value',
          minWidth: 180,
          title: $t('system.dictionary.columns.value'),
        },
        {
          field: 'sortOrder',
          minWidth: 100,
          title: $t('system.dictionary.columns.sortOrder'),
        },
        {
          field: 'status',
          minWidth: 100,
          slots: { default: 'status' },
          title: $t('system.dictionary.columns.status'),
        },
        {
          field: 'labelI18n',
          minWidth: 220,
          slots: { default: 'labelI18n' },
          title: $t('system.dictionary.columns.labelI18n'),
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
              minWidth: '180px',
              width: '180px',
            },
          },
          fieldName: 'label',
          label: $t('system.dictionary.itemLabelSearch'),
        },
        {
          component: 'Input',
          componentProps: {
            allowClear: true,
            style: {
              minWidth: '180px',
              width: '180px',
            },
          },
          fieldName: 'value',
          label: $t('system.dictionary.itemValueSearch'),
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
    addTranslation,
    canCreateItem,
    canDeleteItem,
    canUpdateItem,
    catalogMeta,
    goBack,
    gridOptions,
    initialize,
    itemDrawerOpen,
    itemDrawerSaving,
    itemDrawerTitle,
    itemFormResetValues,
    itemFormRef,
    itemFormSchema,
    itemPrimaryLocale,
    localeOptions,
    onItemFormValuesChange,
    openCreateItem,
    openEditItem,
    queryGrid,
    removeItem,
    removeTranslation,
    statusOptions,
    submitItem,
    translations,
  };
}
