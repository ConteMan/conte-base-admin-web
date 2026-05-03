import type {
  MetaCatalogItem,
  MetaCatalogValue,
  MetaEnumNamespace,
  MetaEnumSummary,
} from '#/api';
import type { Ref } from 'vue';
import type DxVxeGrid from '#/components/common/DxVxeGrid.vue';

import { computed, nextTick, ref } from 'vue';

import { formatEmpty } from '@vben/utils';

import { getMetaCatalog, getMetaEnums } from '#/api';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { $t } from '#/locales';

type VbenVxeGridProps = Parameters<typeof useVbenVxeGrid>[0];

interface EnumRegistryQueryForm {
  keyword?: string;
  namespace?: MetaEnumNamespace;
}

interface DisplayOption {
  color: string;
  label: string;
  value: string;
}

const defaultNamespace: MetaEnumNamespace = 'admin';

function normalizeNamespace(value?: string | null): MetaEnumNamespace {
  return value === 'client' ? 'client' : defaultNamespace;
}

function resolveOption(options: DisplayOption[], value?: string | null) {
  if (!value) {
    return undefined;
  }

  return options.find((item) => item.value === value);
}

function formatPairs(value?: Record<string, unknown>) {
  if (!value || Object.keys(value).length === 0) {
    return [];
  }

  return Object.entries(value).map(([key, entryValue]) => ({
    key,
    value:
      typeof entryValue === 'string'
        ? entryValue
        : JSON.stringify(entryValue),
  }));
}

function formatMetaValue(value: MetaCatalogValue['value']) {
  return typeof value === 'string' ? value : String(value);
}

export function useEnumRegistryList(
  gridRef: Ref<InstanceType<typeof DxVxeGrid> | undefined>,
) {
  const detailVisible = ref(false);
  const detailLoading = ref(false);
  const detailCatalog = ref<MetaCatalogItem | null>(null);
  const detailSummary = ref<MetaEnumSummary | null>(null);

  const namespaceOptions = computed<DisplayOption[]>(() => [
    {
      color: 'blue',
      label: $t('system.enumRegistry.namespaces.admin'),
      value: 'admin',
    },
    {
      color: 'purple',
      label: $t('system.enumRegistry.namespaces.client'),
      value: 'client',
    },
  ]);

  const kindOptions = computed<DisplayOption[]>(() => [
    {
      color: 'geekblue',
      label: $t('system.enumRegistry.kinds.enum'),
      value: 'enum',
    },
  ]);

  const sourceOptions = computed<DisplayOption[]>(() => [
    {
      color: 'cyan',
      label: $t('system.enumRegistry.sources.code'),
      value: 'code',
    },
  ]);

  const detailValues = computed(() => detailCatalog.value?.values ?? []);

  const detailTitle = computed(() => {
    const name = detailSummary.value?.name ?? '';
    return $t('system.enumRegistry.detailTitle', { name });
  });

  function getNamespaceOption(value?: string | null) {
    return (
      resolveOption(namespaceOptions.value, value) ?? {
        color: 'default',
        label: value || formatEmpty(undefined),
        value: value || '',
      }
    );
  }

  function getKindOption(value?: string | null) {
    return (
      resolveOption(kindOptions.value, value) ?? {
        color: 'default',
        label: value || formatEmpty(undefined),
        value: value || '',
      }
    );
  }

  function getSourceOption(value?: string | null) {
    return (
      resolveOption(sourceOptions.value, value) ?? {
        color: 'default',
        label: value || formatEmpty(undefined),
        value: value || '',
      }
    );
  }

  function openDetail(record: MetaEnumSummary) {
    detailSummary.value = record;
    detailCatalog.value = null;
    detailVisible.value = true;

    detailLoading.value = true;
    void (async () => {
      try {
        detailCatalog.value = await getMetaCatalog(record.name, true);
      } catch (error) {
        console.error(`[meta] load enum catalog failed: ${record.name}`, error);
      } finally {
        detailLoading.value = false;
      }
    })();
  }

  function closeDetail() {
    detailVisible.value = false;
    detailSummary.value = null;
    detailCatalog.value = null;
  }

  async function initialize() {
    await nextTick();
    await gridRef.value?.gridApi?.formApi.setValues({
      keyword: '',
      namespace: defaultNamespace,
    });
    await gridRef.value?.gridApi?.query({
      keyword: '',
      namespace: defaultNamespace,
    });
  }

  const gridOptions = computed<VbenVxeGridProps>(() => ({
    gridOptions: {
      emptyText: $t('system.enumRegistry.emptyState'),
      height: 'auto',
      pagerConfig: {
        pageSize: 20,
        pageSizes: [20, 50, 100],
      },
      proxyConfig: {
        autoLoad: false,
        ajax: {
          query: async ({ page }: any, formValues: EnumRegistryQueryForm) => {
            return await getMetaEnums({
              keyword: formValues?.keyword?.trim() || undefined,
              namespace: normalizeNamespace(formValues?.namespace),
              page: page.currentPage,
              pageSize: page.pageSize,
            });
          },
        },
      },
      rowConfig: {
        isHover: true,
        keyField: 'name',
      },
      columns: [
        {
          title: $t('system.enumRegistry.columns.name'),
          field: 'name',
          minWidth: 220,
        },
        {
          field: 'description',
          title: $t('system.enumRegistry.columns.description'),
          minWidth: 280,
          slots: { default: 'description' },
        },
        {
          field: 'namespace',
          title: $t('system.enumRegistry.columns.namespace'),
          width: 120,
          slots: { default: 'namespace' },
        },
        {
          field: 'kind',
          title: $t('system.enumRegistry.columns.kind'),
          width: 120,
          slots: { default: 'kind' },
        },
        {
          field: 'source',
          title: $t('system.enumRegistry.columns.source'),
          width: 120,
          slots: { default: 'source' },
        },
        {
          field: 'version',
          title: $t('system.enumRegistry.columns.version'),
          width: 120,
        },
        {
          field: 'valueCount',
          title: $t('system.enumRegistry.columns.valueCount'),
          width: 120,
        },
        {
          fixed: 'right',
          title: $t('system.enumRegistry.columns.actions'),
          width: 120,
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
          component: 'Input',
          componentProps: {
            allowClear: true,
            placeholder: $t('system.enumRegistry.keywordPlaceholder'),
          },
          fieldName: 'keyword',
          label: $t('system.enumRegistry.keyword'),
        },
        {
          component: 'Select',
          componentProps: {
            allowClear: false,
            style: {
              minWidth: '120px',
            },
            options: namespaceOptions.value,
            placeholder: $t('system.enumRegistry.namespacePlaceholder'),
          },
          fieldName: 'namespace',
          label: $t('system.enumRegistry.namespace'),
        },
      ],
    },
  }));

  return {
    closeDetail,
    detailCatalog,
    detailLoading,
    detailSummary,
    detailTitle,
    detailValues,
    detailVisible,
    formatMetaValue,
    formatPairs,
    getKindOption,
    getNamespaceOption,
    getSourceOption,
    gridOptions,
    initialize,
    namespaceOptions,
    openDetail,
    sourceOptions,
  };
}
