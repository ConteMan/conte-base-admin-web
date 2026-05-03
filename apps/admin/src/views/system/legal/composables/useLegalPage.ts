import type {
  CreateLegalVersionRequest,
  LegalDocumentItem,
  LegalDocumentType,
  LegalLocaleOption,
  LegalVersionItem,
  UpdateLegalVersionRequest,
} from '#/api';
import type DxVxeGrid from '#/components/common/DxVxeGrid.vue';

import { computed, markRaw, nextTick, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useAccessStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import {
  createLegalVersion,
  getLegalDocuments,
  getLegalLocaleOptions,
  getLegalVersions,
  publishLegalVersion,
  updateLegalVersion,
} from '#/api';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { z } from '#/adapter/form';
import {
  type DxDetailItem,
  DxTiptap,
  type DxFormSchema,
  type DxSchemaFormExpose,
} from '#/components/common';
import { SYSTEM_PERMISSION_CODES } from '#/constants';
import { $t } from '#/locales';
import { useEnum } from '#/composables/useMeta';

type VbenVxeGridProps = Parameters<typeof useVbenVxeGrid>[0];
type VersionFormMode = 'create' | 'edit' | 'view';

interface VersionQueryForm {
  locale?: string;
}

interface VersionFormValues {
  content: string;
  effectiveAt?: string;
  locale: string;
  summary?: string;
  title: string;
  version: string;
}

const DEFAULT_LOCALE_OPTIONS: LegalLocaleOption[] = [
  {
    label: '简体中文',
    labelI18n: {
      'en-US': 'Simplified Chinese',
      'zh-CN': '简体中文',
    },
    value: 'zh-CN',
  },
  {
    label: 'English',
    labelI18n: {
      'en-US': 'English',
      'zh-CN': 'English',
    },
    value: 'en-US',
  },
];

function buildVersionFormDefaults(locale = 'zh-CN'): VersionFormValues {
  return {
    content: '',
    effectiveAt: '',
    locale,
    summary: '',
    title: '',
    version: '',
  };
}

function normalizeOptionalText(value?: string) {
  const trimmed = value?.trim() || '';
  return trimmed || undefined;
}

export function useLegalPage(gridRef: {
  value: InstanceType<typeof DxVxeGrid> | undefined;
}) {
  const accessStore = useAccessStore();
  const { hasAccessByCodes } = useAccess();

  const documents = ref<LegalDocumentItem[]>([]);
  const activeDocumentType = ref<LegalDocumentType>('terms_of_use');
  const loadingDocuments = ref(false);

  const versionDrawerOpen = ref(false);
  const versionDrawerSaving = ref(false);
  const versionDrawerMode = ref<VersionFormMode>('create');
  const editingVersion = ref<LegalVersionItem | null>(null);
  const versionFormRef = ref<DxSchemaFormExpose | null>(null);
  const versionFormResetValues = ref<VersionFormValues | null>(null);
  const localeOptions = ref(
    DEFAULT_LOCALE_OPTIONS.map((item) => ({
      label: item.label,
      value: item.value,
    })),
  );

  const legalTypeEnum = useEnum('legal_document_type');
  const legalStatusEnum = useEnum('legal_version_status');

  function hasAnyCode(codes: string[]) {
    if (!accessStore.isAccessChecked) {
      return false;
    }
    return hasAccessByCodes(codes);
  }

  const canQuery = computed(() =>
    hasAnyCode([SYSTEM_PERMISSION_CODES.legalContentQuery]),
  );
  const canEdit = computed(() =>
    canQuery.value && hasAnyCode([SYSTEM_PERMISSION_CODES.legalContentEdit]),
  );
  const canPublish = computed(() =>
    canQuery.value &&
      hasAnyCode([SYSTEM_PERMISSION_CODES.legalContentPublish]),
  );

  const activeDocument = computed(() => {
    return documents.value.find(
      (item) => item.type === activeDocumentType.value,
    );
  });
  const selectedVersion = computed(() => editingVersion.value);

  const legalTypeOptions = legalTypeEnum.selectOptions;
  const statusOptions = legalStatusEnum.selectOptions;

  const versionDrawerTitle = computed(() => {
    switch (versionDrawerMode.value) {
      case 'create': {
        return $t('system.legal.actions.addVersion');
      }
      case 'edit': {
        return $t('system.legal.actions.editVersion');
      }
      default: {
        return $t('system.legal.detailTitle');
      }
    }
  });

  const isEditingVersion = computed(() => versionDrawerMode.value === 'edit');
  const isViewingVersion = computed(() => versionDrawerMode.value === 'view');
  const isReadonlyVersion = computed(() => isViewingVersion.value);

  const versionFormSchema = computed<DxFormSchema[]>(() => [
    {
      component: 'Select',
      componentProps: {
        allowClear: false,
        disabled: isEditingVersion.value,
        options: localeOptions.value,
        showSearch: true,
      },
      defaultValue: 'zh-CN',
      fieldName: 'locale',
      label: $t('system.legal.fields.locale'),
      required: true,
      rules: z
        .string({
          required_error: $t('system.legal.validation.localeRequired'),
        })
        .trim()
        .min(1, {
          message: $t('system.legal.validation.localeRequired'),
        }),
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        disabled: isEditingVersion.value,
      },
      defaultValue: '',
      fieldName: 'version',
      help: $t('system.legal.fieldHelp.version'),
      label: $t('system.legal.fields.version'),
      required: true,
      rules: z
        .string({
          required_error: $t('system.legal.validation.versionRequired'),
        })
        .trim()
        .min(1, {
          message: $t('system.legal.validation.versionRequired'),
        }),
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
      },
      defaultValue: '',
      fieldName: 'title',
      label: $t('system.legal.fields.title'),
      required: true,
      rules: z
        .string({
          required_error: $t('system.legal.validation.titleRequired'),
        })
        .trim()
        .min(1, {
          message: $t('system.legal.validation.titleRequired'),
        }),
    },
    {
      component: 'Textarea',
      componentProps: {
        autoSize: { minRows: 3, maxRows: 6 },
      },
      defaultValue: '',
      fieldName: 'summary',
      label: $t('system.legal.fields.summary'),
    },
    {
      component: 'DatePicker',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        format: 'YYYY-MM-DD HH:mm:ss',
        showTime: true,
        valueFormat: 'YYYY-MM-DDTHH:mm:ssZ',
      },
      defaultValue: '',
      fieldName: 'effectiveAt',
      help: $t('system.legal.fieldHelp.effectiveAt'),
      label: $t('system.legal.fields.effectiveAt'),
    },
    {
      component: markRaw(DxTiptap),
      componentProps: {},
      defaultValue: '',
      fieldName: 'content',
      help: $t('system.legal.fieldHelp.content'),
      label: $t('system.legal.fields.content'),
      required: true,
      rules: z
        .string({
          required_error: $t('system.legal.validation.contentRequired'),
        })
        .trim()
        .min(1, {
          message: $t('system.legal.validation.contentRequired'),
        }),
    },
  ]);

  async function loadDocuments() {
    if (!canQuery.value) {
      documents.value = [];
      return;
    }

    loadingDocuments.value = true;
    try {
      const response = await getLegalDocuments();
      documents.value = response.items;

      if (
        documents.value.length > 0 &&
        !documents.value.some((item) => item.type === activeDocumentType.value)
      ) {
        activeDocumentType.value = documents.value[0]!.type;
      }
    } finally {
      loadingDocuments.value = false;
    }
  }

  async function loadLocaleOptions() {
    if (!canQuery.value) {
      localeOptions.value = DEFAULT_LOCALE_OPTIONS.map((item) => ({
        label: item.label,
        value: item.value,
      }));
      return;
    }

    const response = await getLegalLocaleOptions();
    if (response.options.length === 0) {
      localeOptions.value = DEFAULT_LOCALE_OPTIONS.map((item) => ({
        label: item.label,
        value: item.value,
      }));
      return;
    }

    localeOptions.value = response.options.map((item) => ({
      label: item.label,
      value: item.value,
    }));
  }

  async function queryGrid(params: Partial<VersionQueryForm> = {}) {
    if (!canQuery.value) {
      return;
    }

    const values = await gridRef.value?.gridApi?.formApi.getValues();
    await gridRef.value?.gridApi?.query({
      ...(values ?? {}),
      ...params,
    });
  }

  async function initialize() {
    if (!canQuery.value) {
      documents.value = [];
      return;
    }

    await Promise.all([loadDocuments(), loadLocaleOptions()]);
    await nextTick();
    await queryGrid();
  }

  async function refreshPage() {
    if (!canQuery.value) {
      documents.value = [];
      return;
    }

    await loadDocuments();
    await queryGrid();
  }

  async function handleDocumentChange(type: LegalDocumentType) {
    if (!canQuery.value) {
      return;
    }

    activeDocumentType.value = type;
    await queryGrid();
  }

  function getDocumentLabel(item: LegalDocumentItem) {
    return (
      legalTypeOptions.value.find((option) => option.value === item.type)
        ?.label ||
      item.name ||
      item.type
    );
  }

  function getLocaleLabel(locale: string) {
    return (
      localeOptions.value.find((option) => option.value === locale)?.label ||
      DEFAULT_LOCALE_OPTIONS.find((option) => option.value === locale)?.label ||
      locale
    );
  }

  const versionDetailItems = computed<DxDetailItem[]>(() => {
    const item = selectedVersion.value;
    return [
      {
        key: 'locale',
        label: $t('system.legal.fields.locale'),
        value: item ? getLocaleLabel(item.locale) : undefined,
      },
      {
        key: 'version',
        label: $t('system.legal.fields.version'),
        value: item?.version,
      },
      {
        key: 'title',
        label: $t('system.legal.fields.title'),
        value: item?.title,
      },
      {
        key: 'summary',
        label: $t('system.legal.fields.summary'),
        value: item?.summary,
      },
      {
        key: 'status',
        label: $t('system.legal.columns.status'),
      },
      {
        key: 'effectiveAt',
        help: $t('system.legal.fieldHelp.effectiveAt'),
        label: $t('system.legal.fields.effectiveAt'),
      },
      {
        key: 'publishedAt',
        label: $t('system.legal.columns.publishedAt'),
      },
      {
        key: 'updatedAt',
        label: $t('system.legal.columns.updatedAt'),
      },
    ];
  });

  function getCurrentVersionText(item: LegalDocumentItem) {
    if (item.currentVersions.length === 0) {
      return $t('system.legal.noPublishedVersion');
    }

    return item.currentVersions
      .map(
        (version) => `${getLocaleLabel(version.locale)} · ${version.version}`,
      )
      .join(' / ');
  }

  async function openCreateVersion() {
    if (!canQuery.value) {
      return;
    }

    const values =
      await gridRef.value?.gridApi?.formApi.getValues<VersionQueryForm>();
    const defaultLocale =
      normalizeOptionalText(values?.locale) ||
      localeOptions.value[0]?.value ||
      'zh-CN';
    versionDrawerMode.value = 'create';
    editingVersion.value = null;
    versionFormResetValues.value = buildVersionFormDefaults(defaultLocale);
    versionDrawerOpen.value = true;
  }

  async function openEditVersion(item: LegalVersionItem) {
    versionDrawerMode.value = 'edit';
    editingVersion.value = item;
    versionFormResetValues.value = {
      content: item.content,
      effectiveAt: item.effectiveAt || '',
      locale: item.locale,
      summary: item.summary || '',
      title: item.title,
      version: item.version,
    };
    versionDrawerOpen.value = true;
  }

  async function openViewVersion(item: LegalVersionItem) {
    versionDrawerMode.value = 'view';
    editingVersion.value = item;
    versionFormResetValues.value = {
      content: item.content,
      effectiveAt: item.effectiveAt || '',
      locale: item.locale,
      summary: item.summary || '',
      title: item.title,
      version: item.version,
    };
    versionDrawerOpen.value = true;
  }

  function buildVersionPayload(
    values: VersionFormValues,
  ): CreateLegalVersionRequest {
    return {
      content: values.content.trim(),
      effectiveAt: normalizeOptionalText(values.effectiveAt),
      locale: values.locale.trim(),
      summary: normalizeOptionalText(values.summary),
      title: values.title.trim(),
      version: values.version.trim(),
    };
  }

  async function submitVersion() {
    if (isReadonlyVersion.value) {
      return;
    }

    try {
      const validation = await versionFormRef.value?.validate();
      if (!validation) {
        return;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[legal] submitVersion validate error', error);
      }
      return;
    }

    const values = await versionFormRef.value?.getValues<VersionFormValues>();
    if (!values) {
      return;
    }

    versionDrawerSaving.value = true;
    try {
      const payload = buildVersionPayload(values);
      if (versionDrawerMode.value === 'create') {
        await createLegalVersion(activeDocumentType.value, payload);
        message.success($t('system.legal.messages.versionCreateSuccess'));
      } else if (editingVersion.value) {
        const updatePayload: UpdateLegalVersionRequest = {
          content: payload.content,
          effectiveAt: payload.effectiveAt,
          summary: payload.summary,
          title: payload.title,
        };
        await updateLegalVersion(editingVersion.value.id, updatePayload);
        message.success($t('system.legal.messages.versionUpdateSuccess'));
      }

      closeVersionDrawer();
      await refreshPage();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[legal] submitVersion request error', error);
      }
    } finally {
      versionDrawerSaving.value = false;
    }
  }

  async function handlePublishVersion(item: LegalVersionItem) {
    try {
      await publishLegalVersion(item.id);
      message.success($t('system.legal.messages.versionPublishSuccess'));
      await refreshPage();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[legal] publishVersion request error', error);
      }
    }
  }

  function closeVersionDrawer() {
    versionDrawerOpen.value = false;
    editingVersion.value = null;
    versionDrawerMode.value = 'create';
    versionFormResetValues.value = null;
  }

  const gridOptions = computed<VbenVxeGridProps>(() => ({
    gridOptions: {
      height: 'auto',
      rowConfig: { isHover: true, keyField: 'id' },
      proxyConfig: {
        autoLoad: false,
        ajax: {
          query: async ({ page }: any, formValues: VersionQueryForm) => {
            if (!canQuery.value || !activeDocumentType.value) {
              return {
                items: [],
                total: 0,
              };
            }

            return await getLegalVersions(activeDocumentType.value, {
              locale: normalizeOptionalText(formValues?.locale),
              page: page.currentPage,
              pageSize: page.pageSize,
            });
          },
        },
      },
      columns: [
        {
          title: $t('system.legal.columns.seq'),
          type: 'seq',
          width: 60,
        },
        {
          field: 'locale',
          formatter: ({ cellValue }: { cellValue: string }) =>
            getLocaleLabel(cellValue),
          minWidth: 120,
          title: $t('system.legal.columns.locale'),
        },
        {
          field: 'version',
          minWidth: 140,
          title: $t('system.legal.columns.version'),
        },
        {
          field: 'title',
          minWidth: 220,
          title: $t('system.legal.columns.title'),
        },
        {
          field: 'status',
          minWidth: 120,
          slots: { default: 'status' },
          title: $t('system.legal.columns.status'),
        },
        {
          field: 'effectiveAt',
          minWidth: 180,
          slots: { default: 'effectiveAt' },
          title: $t('system.legal.columns.effectiveAt'),
        },
        {
          field: 'publishedAt',
          minWidth: 180,
          slots: { default: 'publishedAt' },
          title: $t('system.legal.columns.publishedAt'),
        },
        {
          field: 'updatedAt',
          minWidth: 180,
          slots: { default: 'updatedAt' },
          title: $t('system.legal.columns.updatedAt'),
        },
        {
          fixed: 'right',
          minWidth: 180,
          slots: { default: 'actions' },
          title: $t('system.legal.columns.actions'),
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
          component: 'Select',
          componentProps: {
            allowClear: true,
            options: localeOptions.value,
            placeholder: $t('system.legal.localeFilterPlaceholder'),
            showSearch: true,
            style: {
              minWidth: '200px',
              width: '200px',
            },
          },
          fieldName: 'locale',
          label: $t('system.legal.localeFilter'),
        },
      ],
    },
    separator: false,
  }));

  return {
    activeDocument,
    activeDocumentType,
    canEdit,
    canPublish,
    canQuery,
    documents,
    getCurrentVersionText,
    getDocumentLabel,
    getLocaleLabel,
    gridOptions,
    handleDocumentChange,
    handlePublishVersion,
    initialize,
    loadingDocuments,
    closeVersionDrawer,
    selectedVersion,
    openCreateVersion,
    openEditVersion,
    openViewVersion,
    refreshPage,
    isReadonlyVersion,
    statusOptions,
    submitVersion,
    versionDetailItems,
    versionDrawerOpen,
    versionDrawerSaving,
    versionDrawerTitle,
    versionFormRef,
    versionFormResetValues,
    versionFormSchema,
  };
}
