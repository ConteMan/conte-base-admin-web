<script lang="ts" setup>
import type { ContentCategory } from '#/api';
import type { DxFormSchema, DxSchemaFormExpose } from '#/components/common';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';
import { formatEmpty } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createContentCategory,
  deleteContentCategory,
  getContentCategories,
  updateContentCategory,
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

interface CategoryFormValues {
  description?: string;
  displayRank: number;
  locale: string;
  name: string;
  parentId?: number;
  slug: string;
  status: 'active' | 'disabled';
}

interface CategorySearchValues {
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
const formResetValues = ref<CategoryFormValues | null>(null);
const categoryCache = ref<ContentCategory[]>([]);

function hasAnyCode(codes: string[]) {
  if (!accessStore.isAccessChecked) {
    return false;
  }
  return hasAccessByCodes(codes);
}

const canCreate = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentCategoryCreate]),
);
const canUpdate = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentCategoryUpdate]),
);
const canDelete = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentCategoryDelete]),
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

const parentOptions = computed(() =>
  categoryCache.value
    .filter((item) => item.id !== editingId.value)
    .map((item) => ({ label: item.name, value: item.id })),
);

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
      allowClear: true,
      options: parentOptions.value,
      placeholder: $t('system.content.taxonomy.fields.parentPlaceholder'),
    },
    fieldName: 'parentId',
    label: $t('system.content.taxonomy.fields.parent'),
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
    component: 'InputNumber',
    componentProps: {
      class: 'w-full',
      min: 0,
    },
    defaultValue: 0,
    fieldName: 'displayRank',
    label: $t('system.content.taxonomy.fields.displayRank'),
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

function getParentName(parentId?: number) {
  if (!parentId) {
    return formatEmpty(undefined);
  }
  return (
    categoryCache.value.find((item) => item.id === parentId)?.name ||
    formatEmpty(undefined)
  );
}

function filterCategories(
  items: ContentCategory[],
  values: CategorySearchValues = {},
) {
  const keyword = values.keyword?.trim().toLowerCase();
  return items
    .filter((item) => {
      const matchesKeyword =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.slug.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword);
      const matchesLocale = !values.locale || item.locale === values.locale;
      const matchesStatus = !values.status || item.status === values.status;
      return matchesKeyword && matchesLocale && matchesStatus;
    })
    .sort((a, b) => a.displayRank - b.displayRank || a.id - b.id);
}

async function loadCategories() {
  const result = await getContentCategories();
  categoryCache.value = result.items || [];
  return categoryCache.value;
}

async function reloadGrid() {
  await gridRef.value?.gridApi?.reload();
}

function openCreate() {
  editingId.value = null;
  formResetValues.value = {
    description: '',
    displayRank: 0,
    locale: 'zh-CN',
    name: '',
    parentId: undefined,
    slug: '',
    status: 'active',
  };
  formVisible.value = true;
}

function openEdit(record: ContentCategory) {
  editingId.value = record.id;
  formResetValues.value = {
    description: record.description || '',
    displayRank: record.displayRank,
    locale: record.locale || 'zh-CN',
    name: record.name,
    parentId: record.parentId,
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
  const values = await formRef.value?.getValues<CategoryFormValues>();
  if (!values) {
    return;
  }
  formSaving.value = true;
  try {
    const payload = {
      description: values.description?.trim() || '',
      displayRank: Number(values.displayRank || 0),
      locale: values.locale || 'zh-CN',
      name: values.name.trim(),
      parentId: values.parentId,
      slug: values.slug.trim(),
      status: values.status || 'active',
    };
    if (editingId.value !== null) {
      await updateContentCategory(editingId.value, payload);
      message.success(
        $t('system.content.taxonomy.messages.categoryUpdateSuccess'),
      );
    } else {
      await createContentCategory(payload);
      message.success(
        $t('system.content.taxonomy.messages.categoryCreateSuccess'),
      );
    }
    closeForm();
    await reloadGrid();
  } finally {
    formSaving.value = false;
  }
}

async function removeCategory(record: ContentCategory) {
  await deleteContentCategory(record.id);
  message.success($t('system.content.taxonomy.messages.categoryDeleteSuccess'));
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
        field: 'parentId',
        minWidth: 160,
        slots: { default: 'parentId' },
        title: $t('system.content.taxonomy.fields.parent'),
      },
      {
        field: 'locale',
        title: $t('system.content.taxonomy.fields.locale'),
        width: 120,
      },
      {
        field: 'displayRank',
        title: $t('system.content.taxonomy.fields.displayRank'),
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
        query: async (_params: unknown, formValues: CategorySearchValues) => {
          const items = filterCategories(
            await loadCategories(),
            formValues || {},
          );
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
    :description="$t('system.content.taxonomy.categoriesDescription')"
    :title="$t('system.content.taxonomy.categoriesTitle')"
  >
    <DxVxeGrid ref="gridRef" :grid-options="gridOptions">
      <template #toolbar-actions>
        <Button v-if="canCreate" type="primary" @click="openCreate">
          {{ $t('system.content.taxonomy.actions.createCategory') }}
        </Button>
      </template>

      <template #parentId="{ row }">
        {{ getParentName((row as ContentCategory).parentId) }}
      </template>

      <template #status="{ row }">
        <DxMetaTag
          :options="statusOptions"
          type="tag"
          :value="(row as ContentCategory).status"
        />
      </template>

      <template #actions="{ row }">
        <DxActionColumn
          :actions="[
            {
              key: 'edit',
              label: $t('system.content.taxonomy.actions.edit'),
              hidden: !canUpdate,
              onClick: () => openEdit(row as ContentCategory),
            },
            {
              key: 'delete',
              label: $t('system.content.taxonomy.actions.delete'),
              danger: true,
              hidden: !canDelete,
              confirmTitle: $t(
                'system.content.taxonomy.messages.confirmDeleteCategory',
              ),
              onClick: () => removeCategory(row as ContentCategory),
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
          ? $t('system.content.taxonomy.actions.editCategory')
          : $t('system.content.taxonomy.actions.createCategory')
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
