import type {
  ReferenceDataCatalogItem,
  ReferenceDataItemListResponse,
} from '#/api';
import type { Ref } from 'vue';
import type DxVxeGrid from '#/components/common/DxVxeGrid.vue';

import { computed, nextTick, ref } from 'vue';

import { formatEmpty } from '@vben/utils';

import { getReferenceDataCatalogs, getReferenceDataItems } from '#/api';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { $t } from '#/locales';

type VbenVxeGridProps = Parameters<typeof useVbenVxeGrid>[0];

export function useReferenceDataList(
  gridRef: Ref<InstanceType<typeof DxVxeGrid> | undefined>,
) {
  const catalogs = ref<ReferenceDataCatalogItem[]>([]);
  const defaultCatalogKey = ref('');
  const activeCatalogKey = ref('');
  const loadingCatalogs = ref(false);

  const selectedCatalogMeta = computed(() => {
    return catalogs.value.find((item) => item.key === activeCatalogKey.value);
  });

  const catalogOptions = computed(() => {
    return catalogs.value.map((item) => ({
      label: `${item.title} (${item.key})`,
      value: item.key,
    }));
  });

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

  async function syncCatalogField(force = false) {
    if (!defaultCatalogKey.value) {
      return;
    }

    const currentValues = await gridRef.value?.gridApi?.formApi.getValues();
    if (!force && currentValues?.catalog) {
      return;
    }

    await gridRef.value?.gridApi?.formApi.setFieldValue(
      'catalog',
      defaultCatalogKey.value,
    );
  }

  async function queryGrid(params: Record<string, unknown> = {}) {
    const normalizedParams = { ...params };
    if (!normalizedParams.catalog && defaultCatalogKey.value) {
      normalizedParams.catalog = defaultCatalogKey.value;
      await syncCatalogField(true);
    }
    await gridRef.value?.gridApi?.query(normalizedParams);
  }

  async function loadCatalogs() {
    loadingCatalogs.value = true;
    try {
      const response = await getReferenceDataCatalogs();
      catalogs.value = response.items;
      if (!defaultCatalogKey.value && response.items.length > 0) {
        defaultCatalogKey.value = response.items[0]!.key;
      }
    } finally {
      loadingCatalogs.value = false;
    }
  }

  async function handleCatalogChange(value: unknown) {
    if (typeof value !== 'string') {
      return;
    }

    activeCatalogKey.value = value;
    const formValues = await gridRef.value?.gridApi?.formApi.getValues();
    await queryGrid({
      ...(formValues ?? {}),
      catalog: value,
    });
  }

  async function initialize() {
    await loadCatalogs();
    if (!defaultCatalogKey.value) {
      return;
    }

    activeCatalogKey.value = defaultCatalogKey.value;
    await nextTick();
    await gridRef.value?.gridApi?.formApi.setValues({
      catalog: defaultCatalogKey.value,
      label: '',
      value: '',
    });
    await queryGrid({
      catalog: defaultCatalogKey.value,
      label: '',
      value: '',
    });
  }

  const gridOptions = computed<VbenVxeGridProps>(() => ({
    gridOptions: {
      height: 'auto',
      pagerConfig: {
        pageSize: 50,
        pageSizes: [20, 50, 100, 200],
      },
      rowConfig: { isHover: true, keyField: 'value' },
      proxyConfig: {
        autoLoad: false,
        ajax: {
          query: async ({ page }: any, formValues: Record<string, string>) => {
            const catalog = formValues?.catalog || defaultCatalogKey.value;

            if (!catalog) {
              return {
                catalog: selectedCatalogMeta.value,
                items: [],
                total: 0,
              } as ReferenceDataItemListResponse;
            }

            activeCatalogKey.value = catalog;

            if (!formValues?.catalog) {
              await syncCatalogField(true);
            }

            return await getReferenceDataItems(catalog, {
              includeI18n: true,
              label: formValues?.label?.trim() || undefined,
              page: page.currentPage,
              pageSize: page.pageSize,
              value: formValues?.value?.trim() || undefined,
            });
          },
        },
      },
      columns: [
        {
          title: $t('system.referenceData.columns.seq'),
          type: 'seq',
          width: 60,
        },
        {
          field: 'value',
          minWidth: 140,
          title: $t('system.referenceData.columns.value'),
        },
        {
          field: 'label',
          minWidth: 220,
          title: $t('system.referenceData.columns.label'),
        },
        {
          field: 'labelI18n',
          minWidth: 260,
          slots: { default: 'labelI18n' },
          title: $t('system.referenceData.columns.labelI18n'),
        },
        {
          field: 'sortOrder',
          title: $t('system.referenceData.columns.sortOrder'),
          visible: false,
          width: 100,
        },
        {
          field: 'extra',
          minWidth: 260,
          slots: { default: 'extra' },
          title: $t('system.referenceData.columns.extra'),
          visible: false,
        },
        {
          fixed: 'right',
          minWidth: 120,
          slots: { default: 'actions' },
          title: $t('system.referenceData.columns.actions'),
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
            allowClear: false,
            loading: loadingCatalogs.value,
            onChange: (value: unknown) => {
              void handleCatalogChange(value);
            },
            options: catalogOptions.value,
            placeholder: $t('system.referenceData.catalogPlaceholder'),
            style: {
              minWidth: '260px',
              width: '260px',
            },
          },
          defaultValue: defaultCatalogKey.value || undefined,
          fieldName: 'catalog',
          label: $t('system.referenceData.catalog'),
        },
        {
          component: 'Input',
          componentProps: {
            allowClear: true,
            style: {
              minWidth: '170px',
              width: '170px',
            },
          },
          fieldName: 'value',
          label: $t('system.referenceData.valueSearch'),
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
          fieldName: 'label',
          label: $t('system.referenceData.labelSearch'),
        },
      ],
    },
    separator: false,
  }));

  return {
    formatEmpty,
    formatPairs,
    gridOptions,
    initialize,
    selectedCatalogMeta,
  };
}
