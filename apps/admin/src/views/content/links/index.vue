<script lang="ts" setup>
import type { ContentLink } from '#/api';
import type { DxFormSchema, DxSchemaFormExpose } from '#/components/common';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { Button, message } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createContentLink,
  deleteContentLink,
  getContentLinks,
  updateContentLink,
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

interface LinkFormValues {
  displayRank: number;
  group: string;
  isVisible: boolean;
  label: string;
  openInNewTab: boolean;
  url: string;
}

interface LinkSearchValues {
  group?: string;
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
const formResetValues = ref<LinkFormValues | null>(null);

function hasAnyCode(codes: string[]) {
  if (!accessStore.isAccessChecked) {
    return false;
  }
  return hasAccessByCodes(codes);
}

const canCreate = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentLinkCreate]),
);
const canUpdate = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentLinkUpdate]),
);
const canDelete = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentLinkDelete]),
);
const isEditing = computed(() => editingId.value !== null);

const groupOptions = computed(() => [
  { label: 'official', value: 'official' },
  { label: 'social', value: 'social' },
  { label: 'resource', value: 'resource' },
]);

const visibleOptions = computed(() => [
  { label: $t('system.content.links.visible.yes'), value: true },
  { label: $t('system.content.links.visible.no'), value: false },
]);

const formSchema = computed<DxFormSchema[]>(() => [
  {
    component: 'Input',
    componentProps: {
      allowClear: true,
      placeholder: $t('system.content.links.fields.labelPlaceholder'),
    },
    fieldName: 'label',
    label: $t('system.content.links.fields.label'),
    required: true,
    rules: z
      .string()
      .trim()
      .min(1, {
        message: $t('system.content.links.validation.labelRequired'),
      }),
  },
  {
    component: 'Input',
    componentProps: {
      allowClear: true,
      placeholder: $t('system.content.links.fields.urlPlaceholder'),
    },
    fieldName: 'url',
    label: $t('system.content.links.fields.url'),
    required: true,
    rules: z
      .string()
      .trim()
      .min(1, {
        message: $t('system.content.links.validation.urlRequired'),
      }),
  },
  {
    component: 'Select',
    componentProps: {
      options: groupOptions.value,
    },
    defaultValue: 'official',
    fieldName: 'group',
    label: $t('system.content.links.fields.group'),
  },
  {
    component: 'InputNumber',
    componentProps: {
      class: 'w-full',
      min: 0,
    },
    defaultValue: 10,
    fieldName: 'displayRank',
    label: $t('system.content.links.fields.displayRank'),
  },
  {
    component: 'Switch',
    defaultValue: true,
    fieldName: 'isVisible',
    label: $t('system.content.links.fields.isVisible'),
  },
  {
    component: 'Switch',
    defaultValue: true,
    fieldName: 'openInNewTab',
    label: $t('system.content.links.fields.openInNewTab'),
  },
]);

function filterLinks(items: ContentLink[], values: LinkSearchValues = {}) {
  const keyword = values.keyword?.trim().toLowerCase();
  return items
    .filter((item) => {
      const matchesKeyword =
        !keyword ||
        item.label.toLowerCase().includes(keyword) ||
        item.url.toLowerCase().includes(keyword);
      const matchesGroup = !values.group || item.group === values.group;
      const matchesVisible =
        values.visible === undefined || item.isVisible === values.visible;
      return matchesKeyword && matchesGroup && matchesVisible;
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
    group: 'official',
    isVisible: true,
    label: '',
    openInNewTab: true,
    url: '',
  };
  formVisible.value = true;
}

function openEdit(record: ContentLink) {
  editingId.value = record.id;
  formResetValues.value = {
    displayRank: record.displayRank,
    group: record.group || 'official',
    isVisible: record.isVisible,
    label: record.label,
    openInNewTab: record.openInNewTab,
    url: record.url,
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
  const values = await formRef.value?.getValues<LinkFormValues>();
  if (!values) {
    return;
  }
  formSaving.value = true;
  try {
    const payload = {
      displayRank: Number(values.displayRank || 0),
      group: values.group.trim(),
      isVisible: !!values.isVisible,
      label: values.label.trim(),
      openInNewTab: !!values.openInNewTab,
      url: values.url.trim(),
    };
    if (editingId.value !== null) {
      await updateContentLink(editingId.value, payload);
      message.success($t('system.content.links.messages.updateSuccess'));
    } else {
      await createContentLink(payload);
      message.success($t('system.content.links.messages.createSuccess'));
    }
    closeForm();
    await reloadGrid();
  } finally {
    formSaving.value = false;
  }
}

async function removeLink(record: ContentLink) {
  await deleteContentLink(record.id);
  message.success($t('system.content.links.messages.deleteSuccess'));
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
        field: 'label',
        fixed: 'left',
        minWidth: 160,
        title: $t('system.content.links.fields.label'),
      },
      {
        field: 'url',
        minWidth: 260,
        title: $t('system.content.links.fields.url'),
      },
      {
        field: 'group',
        minWidth: 120,
        title: $t('system.content.links.fields.group'),
      },
      {
        field: 'displayRank',
        title: $t('system.content.links.fields.displayRank'),
        width: 120,
      },
      {
        field: 'isVisible',
        slots: { default: 'isVisible' },
        title: $t('system.content.links.fields.isVisible'),
        width: 120,
      },
      {
        field: 'openInNewTab',
        slots: { default: 'openInNewTab' },
        title: $t('system.content.links.fields.openInNewTab'),
        width: 140,
      },
      {
        fixed: 'right',
        slots: { default: 'actions' },
        title: $t('system.content.links.fields.actions'),
        width: 180,
      },
    ],
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async (_params: unknown, formValues: LinkSearchValues) => {
          const response = await getContentLinks();
          const items = filterLinks(response.items || [], formValues || {});
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
          placeholder: $t('system.content.links.filters.keyword'),
        },
        fieldName: 'keyword',
        label: $t('system.content.links.filters.keywordLabel'),
      },
      {
        component: 'Select',
        componentProps: {
          allowClear: true,
          options: groupOptions.value,
          placeholder: $t('system.content.links.fields.group'),
        },
        fieldName: 'group',
        label: $t('system.content.links.fields.group'),
      },
      {
        component: 'Select',
        componentProps: {
          allowClear: true,
          options: visibleOptions.value,
          placeholder: $t('system.content.links.filters.visible'),
        },
        fieldName: 'visible',
        label: $t('system.content.links.fields.isVisible'),
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
    :description="$t('system.content.links.description')"
    :title="$t('system.content.links.title')"
  >
    <DxVxeGrid ref="gridRef" :grid-options="gridOptions">
      <template #toolbar-actions>
        <Button v-if="canCreate" type="primary" @click="openCreate">
          {{ $t('system.content.links.actions.create') }}
        </Button>
      </template>

      <template #isVisible="{ row }">
        <DxBooleanTag
          :false-text="$t('system.content.links.visible.no')"
          :true-text="$t('system.content.links.visible.yes')"
          :value="(row as ContentLink).isVisible"
          true-color="green"
        />
      </template>

      <template #openInNewTab="{ row }">
        <DxBooleanTag
          :false-text="$t('system.content.links.openInNewTab.no')"
          :true-text="$t('system.content.links.openInNewTab.yes')"
          :value="(row as ContentLink).openInNewTab"
        />
      </template>

      <template #actions="{ row }">
        <DxActionColumn
          :actions="[
            {
              key: 'edit',
              label: $t('system.content.links.actions.edit'),
              hidden: !canUpdate,
              onClick: () => openEdit(row as ContentLink),
            },
            {
              key: 'delete',
              label: $t('system.content.links.actions.delete'),
              danger: true,
              hidden: !canDelete,
              confirmTitle: $t('system.content.links.messages.confirmDelete'),
              onClick: () => removeLink(row as ContentLink),
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
          ? $t('system.content.links.actions.edit')
          : $t('system.content.links.actions.create')
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
