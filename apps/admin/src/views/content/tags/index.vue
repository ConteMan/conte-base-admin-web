<script lang="ts" setup>
import type { ContentTag } from '#/api';
import type { DxFormSchema, DxSchemaFormExpose } from '#/components/common';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { Button, message } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createContentTag,
  deleteContentTag,
  getContentTags,
  updateContentTag,
} from '#/api';
import {
  DxActionColumn,
  DxFormModal,
  DxMetaTag,
  DxSchemaForm,
  DxVxeGrid,
} from '#/components/common';
import { SYSTEM_PERMISSION_CODES } from '#/constants';
import { $t } from '#/locales';

type VbenVxeGridProps = Parameters<typeof useVbenVxeGrid>[0];

interface TagFormValues {
  description?: string;
  locale: string;
  name: string;
  slug: string;
  status: 'active' | 'disabled';
}

interface TagSearchValues {
  keyword?: string;
  locale?: string;
  status?: 'active' | 'disabled';
}

const accessStore = useAccessStore();
const { hasAccessByCodes } = useAccess();
const gridRef = ref<InstanceType<typeof DxVxeGrid>>();
const formRef = ref<DxSchemaFormExpose | null>(null);
const formVisible = ref(false);
const formSaving = ref(false);
const editingId = ref<null | number>(null);
const formResetValues = ref<TagFormValues | null>(null);

function hasAnyCode(codes: string[]) {
  if (!accessStore.isAccessChecked) {
    return false;
  }
  return hasAccessByCodes(codes);
}

const canCreate = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentTagCreate]),
);
const canUpdate = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentTagUpdate]),
);
const canDelete = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentTagDelete]),
);
const isEditing = computed(() => editingId.value !== null);

const statusOptions = computed(() => [
  {
    badgeStatus: 'success' as const,
    color: 'green',
    label: $t('system.content.taxonomy.status.active'),
    value: 'active',
  },
  {
    badgeStatus: 'default' as const,
    color: 'default',
    label: $t('system.content.taxonomy.status.disabled'),
    value: 'disabled',
  },
]);

const localeOptions = computed(() => [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
]);

const formSchema = computed<DxFormSchema[]>(() => [
  {
    component: 'Input',
    componentProps: {
      allowClear: true,
      placeholder: $t('system.content.taxonomy.fields.slugPlaceholder'),
    },
    fieldName: 'slug',
    label: $t('system.content.taxonomy.fields.slug'),
    required: true,
    rules: z
      .string()
      .trim()
      .min(1, {
        message: $t('system.content.taxonomy.validation.slugRequired'),
      }),
  },
  {
    component: 'Input',
    componentProps: {
      allowClear: true,
      placeholder: $t('system.content.taxonomy.fields.namePlaceholder'),
    },
    fieldName: 'name',
    label: $t('system.content.taxonomy.fields.name'),
    required: true,
    rules: z
      .string()
      .trim()
      .min(1, {
        message: $t('system.content.taxonomy.validation.nameRequired'),
      }),
  },
  {
    component: 'Select',
    componentProps: {
      options: localeOptions.value,
    },
    defaultValue: 'zh-CN',
    fieldName: 'locale',
    label: $t('system.content.taxonomy.fields.locale'),
  },
  {
    component: 'Select',
    componentProps: {
      options: statusOptions.value,
    },
    defaultValue: 'active',
    fieldName: 'status',
    label: $t('system.content.taxonomy.fields.status'),
  },
  {
    component: 'Textarea',
    componentProps: {
      autoSize: { minRows: 3, maxRows: 6 },
      placeholder: $t('system.content.taxonomy.fields.descriptionPlaceholder'),
    },
    fieldName: 'description',
    label: $t('system.content.taxonomy.fields.description'),
  },
]);

function filterTags(items: ContentTag[], values: TagSearchValues = {}) {
  const keyword = values.keyword?.trim().toLowerCase();
  return items.filter((item) => {
    const matchesKeyword =
      !keyword ||
      item.name.toLowerCase().includes(keyword) ||
      item.slug.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword);
    const matchesLocale = !values.locale || item.locale === values.locale;
    const matchesStatus = !values.status || item.status === values.status;
    return matchesKeyword && matchesLocale && matchesStatus;
  });
}

async function reloadGrid() {
  await gridRef.value?.gridApi?.reload();
}

function openCreate() {
  editingId.value = null;
  formResetValues.value = {
    description: '',
    locale: 'zh-CN',
    name: '',
    slug: '',
    status: 'active',
  };
  formVisible.value = true;
}

function openEdit(record: ContentTag) {
  editingId.value = record.id;
  formResetValues.value = {
    description: record.description || '',
    locale: record.locale || 'zh-CN',
    name: record.name,
    slug: record.slug,
    status: record.status || 'active',
  };
  formVisible.value = true;
}

function closeForm() {
  formVisible.value = false;
  editingId.value = null;
  formResetValues.value = null;
}

async function submitForm() {
  const valid = await formRef.value?.validate();
  if (!valid) {
    return;
  }
  const values = await formRef.value?.getValues<TagFormValues>();
  if (!values) {
    return;
  }
  formSaving.value = true;
  try {
    const payload = {
      description: values.description?.trim() || '',
      locale: values.locale || 'zh-CN',
      name: values.name.trim(),
      slug: values.slug.trim(),
      status: values.status || 'active',
    };
    if (editingId.value !== null) {
      await updateContentTag(editingId.value, payload);
      message.success($t('system.content.taxonomy.messages.tagUpdateSuccess'));
    } else {
      await createContentTag(payload);
      message.success($t('system.content.taxonomy.messages.tagCreateSuccess'));
    }
    closeForm();
    await reloadGrid();
  } finally {
    formSaving.value = false;
  }
}

async function removeTag(record: ContentTag) {
  await deleteContentTag(record.id);
  message.success($t('system.content.taxonomy.messages.tagDeleteSuccess'));
  await reloadGrid();
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
        field: 'name',
        fixed: 'left',
        minWidth: 180,
        title: $t('system.content.taxonomy.fields.name'),
      },
      {
        field: 'slug',
        minWidth: 180,
        title: $t('system.content.taxonomy.fields.slug'),
      },
      {
        field: 'description',
        minWidth: 240,
        title: $t('system.content.taxonomy.fields.description'),
      },
      {
        field: 'locale',
        title: $t('system.content.taxonomy.fields.locale'),
        width: 120,
      },
      {
        field: 'status',
        slots: { default: 'status' },
        title: $t('system.content.taxonomy.fields.status'),
        width: 120,
      },
      {
        fixed: 'right',
        slots: { default: 'actions' },
        title: $t('system.content.taxonomy.fields.actions'),
        width: 180,
      },
    ],
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async (_params: unknown, formValues: TagSearchValues) => {
          const response = await getContentTags();
          const items = filterTags(response.items || [], formValues || {});
          return {
            items,
            total: items.length,
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
          placeholder: $t('system.content.taxonomy.filters.keyword'),
        },
        fieldName: 'keyword',
        label: $t('system.content.taxonomy.filters.keywordLabel'),
      },
      {
        component: 'Select',
        componentProps: {
          allowClear: true,
          options: localeOptions.value,
          placeholder: $t('system.content.taxonomy.fields.locale'),
        },
        fieldName: 'locale',
        label: $t('system.content.taxonomy.fields.locale'),
      },
      {
        component: 'Select',
        componentProps: {
          allowClear: true,
          options: statusOptions.value,
          placeholder: $t('system.content.taxonomy.fields.status'),
        },
        fieldName: 'status',
        label: $t('system.content.taxonomy.fields.status'),
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
    :description="$t('system.content.taxonomy.tagsDescription')"
    :title="$t('system.content.taxonomy.tagsTitle')"
  >
    <DxVxeGrid ref="gridRef" :grid-options="gridOptions">
      <template #toolbar-actions>
        <Button v-if="canCreate" type="primary" @click="openCreate">
          {{ $t('system.content.taxonomy.actions.createTag') }}
        </Button>
      </template>

      <template #status="{ row }">
        <DxMetaTag
          :options="statusOptions"
          type="tag"
          :value="(row as ContentTag).status"
        />
      </template>

      <template #actions="{ row }">
        <DxActionColumn
          :actions="[
            {
              key: 'edit',
              label: $t('system.content.taxonomy.actions.edit'),
              hidden: !canUpdate,
              onClick: () => openEdit(row as ContentTag),
            },
            {
              key: 'delete',
              label: $t('system.content.taxonomy.actions.delete'),
              danger: true,
              hidden: !canDelete,
              confirmTitle: $t(
                'system.content.taxonomy.messages.confirmDeleteTag',
              ),
              onClick: () => removeTag(row as ContentTag),
            },
          ]"
        />
      </template>
    </DxVxeGrid>

    <DxFormModal
      :open="formVisible"
      :saving="formSaving"
      :title="
        isEditing
          ? $t('system.content.taxonomy.actions.editTag')
          : $t('system.content.taxonomy.actions.createTag')
      "
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
