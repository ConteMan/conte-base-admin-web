<script lang="ts" setup>
import type { ContentNote, ContentNoteStatus } from '#/api';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';
import { formatEmpty } from '@vben/utils';

import { Button, Space, Tag, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteContentNote, getContentNotes } from '#/api';
import {
  DxActionColumn,
  DxDateTime,
  DxMetaTag,
  DxVxeGrid,
} from '#/components/common';
import { SYSTEM_PERMISSION_CODES } from '#/constants';
import { $t } from '#/locales';

type VbenVxeGridProps = Parameters<typeof useVbenVxeGrid>[0];

interface NoteSearchValues {
  keyword?: string;
  status?: ContentNoteStatus;
}

const router = useRouter();
const accessStore = useAccessStore();
const { hasAccessByCodes } = useAccess();
const gridRef = ref<InstanceType<typeof DxVxeGrid>>();

function hasAnyCode(codes: string[]) {
  if (!accessStore.isAccessChecked) {
    return false;
  }
  return hasAccessByCodes(codes);
}

const canCreate = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentNoteCreate]),
);
const canUpdate = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentNoteUpdate]),
);
const canDelete = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentNoteDelete]),
);

const statusOptions = computed(() => [
  {
    badgeStatus: 'processing' as const,
    color: 'blue',
    label: $t('system.content.notes.status.draft'),
    value: 'draft',
  },
  {
    badgeStatus: 'success' as const,
    color: 'green',
    label: $t('system.content.notes.status.published'),
    value: 'published',
  },
  {
    badgeStatus: 'default' as const,
    color: 'default',
    label: $t('system.content.notes.status.offline'),
    value: 'offline',
  },
]);

function filterNotes(notes: ContentNote[], values: NoteSearchValues) {
  const keyword = values.keyword?.trim().toLowerCase();
  return notes.filter((item) => {
    const matchesStatus = !values.status || item.status === values.status;
    const matchesKeyword =
      !keyword ||
      item.title.toLowerCase().includes(keyword) ||
      item.slug.toLowerCase().includes(keyword) ||
      item.excerpt.toLowerCase().includes(keyword);
    return matchesStatus && matchesKeyword;
  });
}

async function gridReload() {
  await gridRef.value?.gridApi?.reload();
}

function openCreate() {
  void router.push({ name: 'ContentNoteCreate' });
}

function openEdit(record: ContentNote) {
  void router.push({
    name: 'ContentNoteEdit',
    params: { id: String(record.id) },
  });
}

async function removeNote(record: ContentNote) {
  await deleteContentNote(record.id);
  message.success($t('system.content.notes.messages.deleteSuccess'));
  await gridReload();
}

const gridOptions = computed<VbenVxeGridProps>(() => ({
  gridOptions: {
    height: 'auto',
    rowConfig: { isHover: true, keyField: 'id' },
    proxyConfig: {
      autoLoad: true,
      ajax: {
        query: async (
          _params: { page: { currentPage: number; pageSize: number } },
          formValues: NoteSearchValues,
        ) => {
          const response = await getContentNotes();
          const items = filterNotes(response.items || [], formValues || {});
          return {
            items,
            total: items.length,
          };
        },
      },
    },
    toolbarConfig: {
      custom: true,
      refresh: true,
      search: true,
      zoom: true,
    },
    columns: [
      {
        fixed: 'left',
        title: $t('system.referenceData.columns.seq'),
        type: 'seq',
        width: 60,
      },
      {
        field: 'title',
        fixed: 'left',
        minWidth: 220,
        title: $t('system.content.notes.fields.title'),
      },
      {
        field: 'slug',
        minWidth: 180,
        title: $t('system.content.notes.fields.slug'),
      },
      {
        field: 'status',
        slots: { default: 'status' },
        title: $t('system.content.notes.fields.status'),
        width: 110,
      },
      {
        field: 'category',
        minWidth: 140,
        title: $t('system.content.notes.fields.category'),
      },
      {
        field: 'tags',
        minWidth: 220,
        slots: { default: 'tags' },
        title: $t('system.content.notes.fields.tags'),
      },
      {
        field: 'featured',
        slots: { default: 'featured' },
        title: $t('system.content.notes.fields.featured'),
        width: 100,
      },
      {
        field: 'displayAt',
        slots: { default: 'displayAt' },
        title: $t('system.content.notes.fields.displayAt'),
        width: 180,
      },
      {
        field: 'updatedAt',
        slots: { default: 'updatedAt' },
        title: $t('system.content.notes.fields.updatedAt'),
        width: 180,
      },
      {
        fixed: 'right',
        slots: { default: 'actions' },
        title: $t('system.content.notes.fields.actions'),
        width: 160,
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
    schema: [
      {
        component: 'Input',
        componentProps: {
          allowClear: true,
        },
        fieldName: 'keyword',
        label: $t('system.content.notes.filters.keywordLabel'),
      },
      {
        component: 'Select',
        componentProps: {
          allowClear: true,
          options: statusOptions.value,
          placeholder: $t('system.content.notes.filters.status'),
        },
        fieldName: 'status',
        label: $t('system.content.notes.fields.status'),
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
    :description="$t('system.content.notes.description')"
    :title="$t('system.content.notes.title')"
  >
    <DxVxeGrid ref="gridRef" :grid-options="gridOptions">
      <template #toolbar-actions>
        <Button v-if="canCreate" type="primary" @click="openCreate">
          {{ $t('system.content.notes.actions.create') }}
        </Button>
      </template>
      <template #status="{ row }">
        <DxMetaTag
          :options="statusOptions"
          type="tag"
          :value="(row as ContentNote).status"
        />
      </template>
      <template #tags="{ row }">
        <Space v-if="(row as ContentNote).tags?.length" wrap>
          <Tag v-for="tag in (row as ContentNote).tags" :key="tag">
            {{ tag }}
          </Tag>
        </Space>
        <span v-else class="text-gray-400">{{ formatEmpty(undefined) }}</span>
      </template>
      <template #featured="{ row }">
        <Tag :color="(row as ContentNote).featured ? 'gold' : 'default'">
          {{
            (row as ContentNote).featured
              ? $t('system.common.trueText')
              : $t('system.common.falseText')
          }}
        </Tag>
      </template>
      <template #updatedAt="{ row }">
        <DxDateTime :value="(row as ContentNote).updatedAt" />
      </template>
      <template #displayAt="{ row }">
        <DxDateTime :value="(row as ContentNote).displayAt" />
      </template>
      <template #actions="{ row }">
        <DxActionColumn
          :actions="[
            {
              key: 'edit',
              label: $t('system.content.notes.actions.edit'),
              hidden: !canUpdate,
              onClick: () => openEdit(row as ContentNote),
            },
            {
              key: 'delete',
              label: $t('system.content.notes.actions.delete'),
              hidden: !canDelete,
              danger: true,
              confirmTitle: $t('system.content.notes.messages.confirmDelete'),
              onClick: () => removeNote(row as ContentNote),
            },
          ]"
        />
      </template>
    </DxVxeGrid>
  </Page>
</template>
