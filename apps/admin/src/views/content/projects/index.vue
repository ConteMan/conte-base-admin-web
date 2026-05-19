<script lang="ts" setup>
import type { ContentProject } from '#/api';
import type { DxFormSchema, DxSchemaFormExpose } from '#/components/common';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { z } from '#/adapter/form';
import {
  createContentProject,
  deleteContentProject,
  getContentProjects,
  updateContentProject,
} from '#/api';
import {
  DxActionColumn,
  DxBooleanTag,
  DxFormModal,
  DxSchemaForm,
  DxVxeGrid,
} from '#/components/common';
import { SYSTEM_PERMISSION_CODES } from '#/constants';
import { $t } from '#/locales';

type VbenVxeGridProps = Parameters<typeof useVbenVxeGrid>[0];

interface ProjectFormValues {
  displayRank: number;
  isVisible: boolean;
  name: string;
  slug: string;
  summary: string;
}

interface ProjectSearchValues {
  keyword?: string;
  visible?: boolean;
}

const accessStore = useAccessStore();
const { hasAccessByCodes } = useAccess();
const gridRef = ref<InstanceType<typeof DxVxeGrid>>();
const formRef = ref<DxSchemaFormExpose | null>(null);
const formVisible = ref(false);
const formSaving = ref(false);
const editingId = ref<null | number>(null);
const formResetValues = ref<ProjectFormValues | null>(null);

function hasAnyCode(codes: string[]) {
  if (!accessStore.isAccessChecked) {
    return false;
  }
  return hasAccessByCodes(codes);
}

const canCreate = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentProjectCreate]),
);
const canUpdate = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentProjectUpdate]),
);
const canDelete = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentProjectDelete]),
);
const isEditing = computed(() => editingId.value !== null);

const visibleOptions = computed(() => [
  {
    label: $t('system.content.projects.visible.yes'),
    value: true,
  },
  {
    label: $t('system.content.projects.visible.no'),
    value: false,
  },
]);

const formSchema = computed<DxFormSchema[]>(() => [
  {
    component: 'Input',
    componentProps: {
      allowClear: true,
      placeholder: $t('system.content.projects.fields.slugPlaceholder'),
    },
    fieldName: 'slug',
    label: $t('system.content.projects.fields.slug'),
    required: true,
    rules: z
      .string()
      .trim()
      .min(1, {
        message: $t('system.content.projects.validation.slugRequired'),
      }),
  },
  {
    component: 'Input',
    componentProps: {
      allowClear: true,
      placeholder: $t('system.content.projects.fields.namePlaceholder'),
    },
    fieldName: 'name',
    label: $t('system.content.projects.fields.name'),
    required: true,
    rules: z
      .string()
      .trim()
      .min(1, {
        message: $t('system.content.projects.validation.nameRequired'),
      }),
  },
  {
    component: 'Textarea',
    componentProps: {
      autoSize: { minRows: 3, maxRows: 6 },
      placeholder: $t('system.content.projects.fields.summaryPlaceholder'),
    },
    fieldName: 'summary',
    label: $t('system.content.projects.fields.summary'),
    required: true,
    rules: z
      .string()
      .trim()
      .min(1, {
        message: $t('system.content.projects.validation.summaryRequired'),
      }),
  },
  {
    component: 'InputNumber',
    componentProps: {
      class: 'w-full',
      min: 0,
    },
    defaultValue: 10,
    fieldName: 'displayRank',
    label: $t('system.content.projects.fields.displayRank'),
  },
  {
    component: 'Switch',
    defaultValue: true,
    fieldName: 'isVisible',
    label: $t('system.content.projects.fields.isVisible'),
  },
]);

function filterProjects(
  items: ContentProject[],
  values: ProjectSearchValues = {},
) {
  const keyword = values.keyword?.trim().toLowerCase();
  return items
    .filter((item) => {
      const matchesKeyword =
        !keyword ||
        item.slug.toLowerCase().includes(keyword) ||
        item.name.toLowerCase().includes(keyword) ||
        item.summary.toLowerCase().includes(keyword);
      const matchesVisible =
        values.visible === undefined || item.isVisible === values.visible;
      return matchesKeyword && matchesVisible;
    })
    .sort((a, b) => a.displayRank - b.displayRank || a.id - b.id);
}

async function reloadGrid() {
  await gridRef.value?.gridApi?.reload();
}

function openCreate() {
  editingId.value = null;
  formResetValues.value = {
    displayRank: 10,
    isVisible: true,
    name: '',
    slug: '',
    summary: '',
  };
  formVisible.value = true;
}

function openEdit(record: ContentProject) {
  editingId.value = record.id;
  formResetValues.value = {
    displayRank: record.displayRank,
    isVisible: record.isVisible,
    name: record.name,
    slug: record.slug,
    summary: record.summary,
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
  const values = await formRef.value?.getValues<ProjectFormValues>();
  if (!values) {
    return;
  }
  formSaving.value = true;
  try {
    const payload = {
      displayRank: Number(values.displayRank || 0),
      isVisible: !!values.isVisible,
      name: values.name.trim(),
      slug: values.slug.trim(),
      summary: values.summary.trim(),
    };
    if (editingId.value !== null) {
      await updateContentProject(editingId.value, payload);
      message.success($t('system.content.projects.messages.updateSuccess'));
    } else {
      await createContentProject(payload);
      message.success($t('system.content.projects.messages.createSuccess'));
    }
    closeForm();
    await reloadGrid();
  } finally {
    formSaving.value = false;
  }
}

async function removeProject(record: ContentProject) {
  await deleteContentProject(record.id);
  message.success($t('system.content.projects.messages.deleteSuccess'));
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
        title: $t('system.content.projects.fields.name'),
      },
      {
        field: 'slug',
        minWidth: 180,
        title: $t('system.content.projects.fields.slug'),
      },
      {
        field: 'summary',
        minWidth: 260,
        title: $t('system.content.projects.fields.summary'),
      },
      {
        field: 'displayRank',
        title: $t('system.content.projects.fields.displayRank'),
        width: 120,
      },
      {
        field: 'isVisible',
        slots: { default: 'isVisible' },
        title: $t('system.content.projects.fields.isVisible'),
        width: 120,
      },
      {
        fixed: 'right',
        slots: { default: 'actions' },
        title: $t('system.content.projects.fields.actions'),
        width: 180,
      },
    ],
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async (_params: unknown, formValues: ProjectSearchValues) => {
          const response = await getContentProjects();
          const items = filterProjects(response.items || [], formValues || {});
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
          placeholder: $t('system.content.projects.filters.keyword'),
        },
        fieldName: 'keyword',
        label: $t('system.content.projects.filters.keywordLabel'),
      },
      {
        component: 'Select',
        componentProps: {
          allowClear: true,
          options: visibleOptions.value,
          placeholder: $t('system.content.projects.filters.visible'),
        },
        fieldName: 'visible',
        label: $t('system.content.projects.fields.isVisible'),
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
    :description="$t('system.content.projects.description')"
    :title="$t('system.content.projects.title')"
  >
    <DxVxeGrid ref="gridRef" :grid-options="gridOptions">
      <template #toolbar-actions>
        <Button v-if="canCreate" type="primary" @click="openCreate">
          {{ $t('system.content.projects.actions.create') }}
        </Button>
      </template>

      <template #isVisible="{ row }">
        <DxBooleanTag
          :false-text="$t('system.content.projects.visible.no')"
          :true-text="$t('system.content.projects.visible.yes')"
          :value="(row as ContentProject).isVisible"
          true-color="green"
        />
      </template>

      <template #actions="{ row }">
        <DxActionColumn
          :actions="[
            {
              key: 'edit',
              label: $t('system.content.projects.actions.edit'),
              hidden: !canUpdate,
              onClick: () => openEdit(row as ContentProject),
            },
            {
              key: 'delete',
              label: $t('system.content.projects.actions.delete'),
              danger: true,
              hidden: !canDelete,
              confirmTitle: $t(
                'system.content.projects.messages.confirmDelete',
              ),
              onClick: () => removeProject(row as ContentProject),
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
          ? $t('system.content.projects.actions.edit')
          : $t('system.content.projects.actions.create')
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
