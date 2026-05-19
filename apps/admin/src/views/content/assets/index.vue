<script lang="ts" setup>
import type { ContentAsset } from '#/api';
import type { DxFormSchema, DxSchemaFormExpose } from '#/components/common';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';
import { formatEmpty } from '@vben/utils';

import { Button, message, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  completeAssetUpload,
  createAssetUploadIntent,
  deleteAsset,
  getAssets,
  updateAsset,
} from '#/api';
import {
  DxActionColumn,
  DxDateTime,
  DxFormModal,
  DxMetaTag,
  DxSchemaForm,
  DxVxeGrid,
} from '#/components/common';
import { SYSTEM_PERMISSION_CODES } from '#/constants';
import { $t } from '#/locales';

type VbenVxeGridProps = Parameters<typeof useVbenVxeGrid>[0];
type AssetStatus = 'deleted' | 'failed' | 'ready' | 'uploading';
type AssetTypeFilter = 'all' | 'file' | 'image';

interface AssetSearchValues {
  keyword?: string;
  status?: AssetStatus;
  type?: AssetTypeFilter;
}

interface AssetFormValues {
  alt: string;
  caption: string;
}

const accessStore = useAccessStore();
const { hasAccessByCodes } = useAccess();
const gridRef = ref<InstanceType<typeof DxVxeGrid>>();
const formRef = ref<DxSchemaFormExpose | null>(null);
const editingAsset = ref<ContentAsset | null>(null);
const formVisible = ref(false);
const formSaving = ref(false);
const formResetValues = ref<AssetFormValues | null>(null);
const uploading = ref(false);

function hasAnyCode(codes: string[]) {
  if (!accessStore.isAccessChecked) {
    return false;
  }
  return hasAccessByCodes(codes);
}

const canCreate = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentAssetCreate]),
);
const canUpdate = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentAssetUpdate]),
);
const canDelete = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentAssetDelete]),
);

const statusOptions = computed(() => [
  {
    badgeStatus: 'success' as const,
    color: 'green',
    label: $t('system.content.assets.status.ready'),
    value: 'ready',
  },
  {
    badgeStatus: 'processing' as const,
    color: 'blue',
    label: $t('system.content.assets.status.uploading'),
    value: 'uploading',
  },
  {
    badgeStatus: 'error' as const,
    color: 'red',
    label: $t('system.content.assets.status.failed'),
    value: 'failed',
  },
  {
    badgeStatus: 'default' as const,
    color: 'default',
    label: $t('system.content.assets.status.deleted'),
    value: 'deleted',
  },
]);

const typeOptions = computed(() => [
  { label: $t('system.content.assets.type.all'), value: 'all' },
  { label: $t('system.content.assets.type.image'), value: 'image' },
  { label: $t('system.content.assets.type.file'), value: 'file' },
]);

const formSchema = computed<DxFormSchema[]>(() => [
  {
    component: 'Input',
    componentProps: {
      allowClear: true,
      placeholder: $t('system.content.assets.fields.altPlaceholder'),
    },
    fieldName: 'alt',
    label: $t('system.content.assets.fields.alt'),
  },
  {
    component: 'Textarea',
    componentProps: {
      autoSize: { minRows: 3, maxRows: 6 },
      placeholder: $t('system.content.assets.fields.captionPlaceholder'),
    },
    fieldName: 'caption',
    label: $t('system.content.assets.fields.caption'),
  },
]);

function isImageAsset(item: ContentAsset) {
  return item.mimeType?.startsWith('image/');
}

function formatSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }
  if (sizeBytes < 1024 * 1024) {
    return `${Math.ceil(sizeBytes / 1024)} KB`;
  }
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

function filterByType(items: ContentAsset[], type?: AssetTypeFilter) {
  if (!type || type === 'all') {
    return items;
  }
  return items.filter((item) =>
    type === 'image' ? isImageAsset(item) : !isImageAsset(item),
  );
}

async function reloadGrid() {
  await gridRef.value?.gridApi?.reload();
}

async function uploadFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  if (!files.length) {
    return;
  }
  uploading.value = true;
  try {
    for (const file of files) {
      const intent = await createAssetUploadIntent({
        mimeType: file.type || 'application/octet-stream',
        originalFilename: file.name,
        sizeBytes: file.size,
      });
      const headers = {
        'Content-Type': file.type || 'application/octet-stream',
        ...intent.headers,
      };
      const response = await fetch(intent.uploadUrl, {
        body: file,
        headers,
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error(`upload failed: ${response.status}`);
      }
      await completeAssetUpload(intent.assetId, {});
    }
    message.success($t('system.content.assets.messages.uploadSuccess'));
    await reloadGrid();
  } finally {
    uploading.value = false;
    input.value = '';
  }
}

function openEdit(record: ContentAsset) {
  editingAsset.value = record;
  formResetValues.value = {
    alt: record.alt || '',
    caption: record.caption || '',
  };
  formVisible.value = true;
}

function closeForm() {
  editingAsset.value = null;
  formResetValues.value = null;
  formVisible.value = false;
}

async function submitForm() {
  if (!editingAsset.value) {
    return;
  }
  const values = await formRef.value?.getValues<AssetFormValues>();
  if (!values) {
    return;
  }
  formSaving.value = true;
  try {
    await updateAsset(editingAsset.value.id, {
      alt: values.alt?.trim() || '',
      caption: values.caption?.trim() || '',
    });
    message.success($t('system.content.assets.messages.updateSuccess'));
    closeForm();
    await reloadGrid();
  } finally {
    formSaving.value = false;
  }
}

async function removeAsset(record: ContentAsset) {
  await deleteAsset(record.id);
  message.success($t('system.content.assets.messages.deleteSuccess'));
  await reloadGrid();
}

function copyUrl(url: string) {
  void navigator.clipboard?.writeText(url);
  message.success($t('system.content.assets.messages.copySuccess'));
}

const gridOptions = computed<VbenVxeGridProps>(() => ({
  gridOptions: {
    columns: [
      {
        fixed: 'left',
        title: $t('system.referenceData.columns.seq'),
        type: 'seq',
        width: 60,
      },
      {
        fixed: 'left',
        slots: { default: 'preview' },
        title: $t('system.content.assets.fields.preview'),
        width: 90,
      },
      {
        field: 'originalFilename',
        minWidth: 220,
        title: $t('system.content.assets.fields.originalFilename'),
      },
      {
        field: 'mimeType',
        minWidth: 160,
        title: $t('system.content.assets.fields.mimeType'),
      },
      {
        field: 'sizeBytes',
        slots: { default: 'sizeBytes' },
        title: $t('system.content.assets.fields.sizeBytes'),
        width: 120,
      },
      {
        field: 'status',
        slots: { default: 'status' },
        title: $t('system.content.assets.fields.status'),
        width: 120,
      },
      {
        field: 'alt',
        minWidth: 160,
        title: $t('system.content.assets.fields.alt'),
      },
      {
        field: 'caption',
        minWidth: 180,
        title: $t('system.content.assets.fields.caption'),
      },
      {
        field: 'publicUrl',
        minWidth: 260,
        slots: { default: 'publicUrl' },
        title: $t('system.content.assets.fields.publicUrl'),
      },
      {
        field: 'updatedAt',
        slots: { default: 'updatedAt' },
        title: $t('system.content.assets.fields.updatedAt'),
        width: 180,
      },
      {
        fixed: 'right',
        slots: { default: 'actions' },
        title: $t('system.content.assets.fields.actions'),
        width: 180,
      },
    ],
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async (
          { page }: { page: { currentPage: number; pageSize: number } },
          formValues: AssetSearchValues,
        ) => {
          const response = await getAssets({
            keyword: formValues?.keyword?.trim() || undefined,
            page: page.currentPage,
            pageSize: page.pageSize,
            status: formValues?.status,
          });
          const items = filterByType(response.items || [], formValues?.type);
          return {
            items,
            total: response.total || items.length,
          };
        },
      },
      autoLoad: true,
    },
    rowConfig: { isHover: true, keyField: 'id' },
    toolbarConfig: {
      custom: true,
      refresh: true,
      search: true,
      zoom: true,
    },
  },
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
          placeholder: $t('system.content.assets.filters.keyword'),
        },
        fieldName: 'keyword',
        label: $t('system.content.assets.filters.keywordLabel'),
      },
      {
        component: 'Select',
        componentProps: {
          allowClear: true,
          options: statusOptions.value,
          placeholder: $t('system.content.assets.fields.status'),
        },
        fieldName: 'status',
        label: $t('system.content.assets.fields.status'),
      },
      {
        component: 'Select',
        componentProps: {
          options: typeOptions.value,
          placeholder: $t('system.content.assets.fields.type'),
        },
        defaultValue: 'all',
        fieldName: 'type',
        label: $t('system.content.assets.fields.type'),
      },
    ],
    showCollapseButton: false,
    wrapperClass: 'w-full gap-4 flex-row',
  },
  separator: false,
}));
</script>

<template>
  <Page
    auto-content-height
    :description="$t('system.content.assets.description')"
    :title="$t('system.content.assets.title')"
  >
    <DxVxeGrid ref="gridRef" :grid-options="gridOptions">
      <template #toolbar-actions>
        <Button
          v-if="canCreate"
          class="relative"
          :loading="uploading"
          type="primary"
        >
          {{ $t('system.content.assets.actions.upload') }}
          <input
            class="absolute inset-0 cursor-pointer opacity-0"
            multiple
            type="file"
            @change="uploadFiles"
          />
        </Button>
      </template>

      <template #preview="{ row }">
        <img
          v-if="isImageAsset(row as ContentAsset)"
          :src="(row as ContentAsset).publicUrl"
          alt="asset"
          class="h-12 w-12 rounded border object-cover"
        />
        <Tag v-else>FILE</Tag>
      </template>

      <template #sizeBytes="{ row }">
        {{ formatSize((row as ContentAsset).sizeBytes || 0) }}
      </template>

      <template #status="{ row }">
        <DxMetaTag
          :options="statusOptions"
          type="tag"
          :value="(row as ContentAsset).status"
        />
      </template>

      <template #publicUrl="{ row }">
        <div class="flex max-w-[240px] items-center gap-2">
          <span class="truncate">{{
            (row as ContentAsset).publicUrl || formatEmpty(undefined)
          }}</span>
          <Button
            v-if="(row as ContentAsset).publicUrl"
            size="small"
            type="link"
            @click="copyUrl((row as ContentAsset).publicUrl)"
          >
            {{ $t('system.content.assets.actions.copyUrl') }}
          </Button>
        </div>
      </template>

      <template #updatedAt="{ row }">
        <DxDateTime :value="(row as ContentAsset).updatedAt" />
      </template>

      <template #actions="{ row }">
        <DxActionColumn
          :actions="[
            {
              key: 'edit',
              label: $t('system.content.assets.actions.edit'),
              hidden: !canUpdate,
              onClick: () => openEdit(row as ContentAsset),
            },
            {
              key: 'delete',
              label: $t('system.content.assets.actions.delete'),
              danger: true,
              hidden: !canDelete,
              confirmTitle: $t('system.content.assets.messages.confirmDelete'),
              onClick: () => removeAsset(row as ContentAsset),
            },
          ]"
        />
      </template>
    </DxVxeGrid>

    <DxFormModal
      :open="formVisible"
      :saving="formSaving"
      :title="$t('system.content.assets.actions.edit')"
      :save-text="$t('system.content.actions.save')"
      @cancel="closeForm"
      @ok="submitForm"
      @update:open="formVisible = $event"
    >
      <DxSchemaForm
        ref="formRef"
        :reset-values="formResetValues"
        :schema="formSchema"
      />
    </DxFormModal>
  </Page>
</template>
