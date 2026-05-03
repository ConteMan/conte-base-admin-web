import type { AuditLogItem } from '#/api';
import type { Ref } from 'vue';
import type DxVxeGrid from '#/components/common/DxVxeGrid.vue';

import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import { computed, nextTick, ref } from 'vue';

import { formatEmpty } from '@vben/utils';

import { getAuditLogList } from '#/api';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useEnum } from '#/composables/useMeta';
import { $t } from '#/locales';

type VbenVxeGridProps = Parameters<typeof useVbenVxeGrid>[0];

interface AuditLogQueryForm {
  action?: string;
  keyword?: string;
  logCategory?: string;
  operatorId?: number | string;
  targetId?: string;
  timeRange?: [Dayjs | null, Dayjs | null];
}

function createDefaultTimeRange(): [Dayjs, Dayjs] {
  return [dayjs().subtract(24, 'hour'), dayjs()];
}

function normalizeText(value?: null | string) {
  const text = typeof value === 'string' ? value.trim() : undefined;
  return text ? text : undefined;
}

function normalizeUserId(value?: number | string | null) {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

function normalizeTimeRange(timeRange?: [Dayjs | null, Dayjs | null]) {
  const [startAt, endAt] = timeRange ?? [];
  return {
    endAt: endAt ? dayjs(endAt).toISOString() : undefined,
    startAt: startAt ? dayjs(startAt).toISOString() : undefined,
  };
}

function normalizeExtra(value?: AuditLogItem['extra']) {
  if (value === null || value === undefined) {
    return formatEmpty(undefined);
  }

  if (typeof value === 'string') {
    if (!value.trim()) {
      return formatEmpty(undefined);
    }

    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'string') {
        return parsed;
      }
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }

  return JSON.stringify(value, null, 2);
}

function filterDetailExtra(value?: AuditLogItem['extra']) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const filteredEntries = Object.entries(value).filter(([key, raw]) => {
    if (raw === null || raw === undefined) {
      return false;
    }
    if ((key === 'ip' || key === 'userAgent') && String(raw).trim()) {
      return false;
    }
    return true;
  });

  if (filteredEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(filteredEntries);
}

function normalizeTextDisplay(value?: null | string) {
  const text = typeof value === 'string' ? value.trim() : undefined;
  return text ? text : formatEmpty(undefined);
}

export function useAuditLogList(
  gridRef: Ref<InstanceType<typeof DxVxeGrid> | undefined>,
) {
  const detailVisible = ref(false);
  const detailRecord = ref<AuditLogItem | null>(null);

  const defaultTimeRange = createDefaultTimeRange();
  const categoryEnum = useEnum('audit_log_category');
  const actionEnum = useEnum('audit_log_action');
  const targetTypeEnum = useEnum('audit_log_target_type');

  const categoryOptions = categoryEnum.selectOptions;
  const actionOptions = actionEnum.selectOptions;
  const targetTypeOptions = targetTypeEnum.selectOptions;

  function getActionLabel(value?: string | null) {
    return actionEnum.getLabel(value, formatEmpty(undefined));
  }

  function getActionDisplay(record: AuditLogItem) {
    return actionEnum.getLabel(
      record.action,
      normalizeTextDisplay(record.actionLabel || record.action),
    );
  }

  function getDeviceInfoDisplay(record: AuditLogItem) {
    const deviceInfo = normalizeText(record.deviceInfo);
    if (deviceInfo) {
      return deviceInfo;
    }
    const userAgent =
      record.extra && typeof record.extra === 'object'
        ? normalizeText(String(record.extra.userAgent ?? ''))
        : undefined;
    return userAgent || formatEmpty(undefined);
  }

  function getOperatorDisplay(record: AuditLogItem) {
    return normalizeTextDisplay(record.operatorName);
  }

  function getTargetDisplay(record: AuditLogItem) {
    const targetName = normalizeText(record.targetName);
    if (targetName) {
      return targetName;
    }

    const targetId = normalizeText(record.targetId);
    if (targetId) {
      return `#${targetId}`;
    }

    return formatEmpty(undefined);
  }

  const detailExtraText = computed(() => {
    return normalizeExtra(filterDetailExtra(detailRecord.value?.extra));
  });

  function openDetail(record: AuditLogItem) {
    detailRecord.value = record;
    detailVisible.value = true;
  }

  function closeDetail() {
    detailVisible.value = false;
    detailRecord.value = null;
  }

  async function initialize() {
    await nextTick();
    await gridRef.value?.gridApi?.formApi.setValues({
      timeRange: defaultTimeRange,
    });
    await gridRef.value?.gridApi?.query({
      timeRange: defaultTimeRange,
    });
  }

  const gridOptions = computed<VbenVxeGridProps>(() => ({
    gridOptions: {
      emptyText: $t('system.audit.emptyState'),
      height: 'auto',
      pagerConfig: {
        pageSize: 20,
        pageSizes: [20, 50, 100],
      },
      proxyConfig: {
        autoLoad: false,
        ajax: {
          query: async ({ page }: any, formValues: AuditLogQueryForm) => {
            const { startAt, endAt } = normalizeTimeRange(
              formValues?.timeRange,
            );

            return await getAuditLogList({
              action: normalizeText(formValues?.action),
              endAt,
              keyword: normalizeText(formValues?.keyword),
              logCategory: normalizeText(formValues?.logCategory),
              operatorId: normalizeUserId(formValues?.operatorId),
              page: page.currentPage,
              pageSize: page.pageSize,
              startAt,
              targetId: normalizeText(formValues?.targetId),
            });
          },
        },
      },
      rowConfig: {
        isHover: true,
      },
      columns: [
        {
          field: 'eventTime',
          title: $t('system.audit.columns.eventTime'),
          width: 180,
          slots: { default: 'eventTime' },
        },
        {
          field: 'operatorName',
          minWidth: 200,
          title: $t('system.audit.columns.operator'),
          slots: { default: 'operator' },
        },
        {
          field: 'logCategory',
          title: $t('system.audit.columns.logCategory'),
          width: 140,
          slots: { default: 'logCategory' },
        },
        {
          field: 'action',
          minWidth: 180,
          title: $t('system.audit.columns.action'),
          slots: { default: 'action' },
        },
        {
          field: 'targetName',
          minWidth: 240,
          title: $t('system.audit.columns.target'),
          slots: { default: 'target' },
        },
        {
          field: 'clientIp',
          title: $t('system.audit.columns.clientIp'),
          width: 150,
        },
        {
          field: 'requestId',
          minWidth: 220,
          title: $t('system.audit.columns.requestId'),
          slots: { default: 'requestId' },
        },
        {
          fixed: 'right',
          title: $t('system.audit.columns.actions'),
          width: 100,
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
            style: {
              minWidth: '220px',
              width: '220px',
            },
          },
          fieldName: 'keyword',
          label: $t('system.audit.filters.keyword'),
        },
        {
          component: 'Select',
          componentProps: {
            allowClear: true,
            options: categoryOptions.value,
            style: {
              minWidth: '180px',
              width: '180px',
            },
          },
          fieldName: 'logCategory',
          label: $t('system.audit.filters.logCategory'),
        },
        {
          component: 'Select',
          componentProps: {
            allowClear: true,
            options: actionOptions.value,
            style: {
              minWidth: '220px',
              width: '220px',
            },
          },
          fieldName: 'action',
          label: $t('system.audit.filters.action'),
        },
        {
          component: 'InputNumber',
          componentProps: {
            min: 1,
            precision: 0,
            style: {
              minWidth: '160px',
              width: '160px',
            },
          },
          fieldName: 'operatorId',
          label: $t('system.audit.filters.operatorId'),
        },
        {
          component: 'Input',
          componentProps: {
            allowClear: true,
            style: {
              minWidth: '180px',
              width: '200px',
            },
          },
          fieldName: 'targetId',
          label: $t('system.audit.filters.targetId'),
        },
        {
          component: 'RangePicker',
          componentProps: {
            allowClear: true,
            format: 'YYYY-MM-DD HH:mm:ss',
            placeholder: [
              $t('system.audit.timeRangeStartPlaceholder'),
              $t('system.audit.timeRangeEndPlaceholder'),
            ],
            showTime: true,
            style: {
              minWidth: '360px',
              width: '360px',
            },
          },
          defaultValue: defaultTimeRange,
          fieldName: 'timeRange',
          label: $t('system.audit.filters.timeRange'),
        },
      ],
    },
    separator: false,
  }));

  return {
    detailExtraText,
    detailRecord,
    detailVisible,
    actionOptions,
    categoryOptions,
    getActionDisplay,
    getDeviceInfoDisplay,
    getOperatorDisplay,
    getActionLabel,
    getTargetDisplay,
    targetTypeOptions,
    gridOptions,
    initialize,
    openDetail,
    closeDetail,
  };
}
