<script lang="ts" setup>
import type { ContentAsset } from '#/api';

import { computed, ref, watch } from 'vue';

import { Button, Input, Modal, Select, Space, Table, Tag } from 'ant-design-vue';

import { getAssets } from '#/api';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (event: 'cancel'): void;
  (event: 'select', asset: ContentAsset): void;
}>();

const loading = ref(false);
const keyword = ref('');
const status = ref<string | undefined>('ready');
const selectedId = ref<number>();
const assets = ref<ContentAsset[]>([]);

const selectedAsset = computed(() =>
  assets.value.find((item) => item.id === selectedId.value),
);

const rowSelection = computed(() => ({
  type: 'radio' as const,
  selectedRowKeys: selectedId.value ? [selectedId.value] : [],
  onChange: (keys: (number | string)[]) => {
    selectedId.value = Number(keys[0] || 0) || undefined;
  },
}));

const statusOptions = [
  { label: 'Ready', value: 'ready' },
  { label: 'Uploading', value: 'uploading' },
  { label: 'Failed', value: 'failed' },
];

async function loadAssets() {
  if (!props.open) {
    return;
  }
  loading.value = true;
  try {
    const result = await getAssets({
      keyword: keyword.value.trim() || undefined,
      page: 1,
      pageSize: 200,
      status: status.value || undefined,
    });
    assets.value = result.items || [];
    if (selectedId.value) {
      const exists = assets.value.some((item) => item.id === selectedId.value);
      if (!exists) {
        selectedId.value = undefined;
      }
    }
  } finally {
    loading.value = false;
  }
}

function choose() {
  if (!selectedAsset.value) {
    return;
  }
  emit('select', selectedAsset.value);
}

function copyUrl(url: string) {
  void globalThis.navigator?.clipboard?.writeText(url);
}

watch(
  () => props.open,
  (value) => {
    if (!value) {
      selectedId.value = undefined;
      return;
    }
    void loadAssets();
  },
);
</script>

<template>
  <Modal
    :open="open"
    title="选择媒体资源"
    width="980px"
    @cancel="emit('cancel')"
    @ok="choose"
  >
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <Input
        v-model:value="keyword"
        allow-clear
        placeholder="搜索文件名或对象键"
        style="width: 240px"
      />
      <Select
        v-model:value="status"
        allow-clear
        :options="statusOptions"
        placeholder="状态"
        style="width: 160px"
      />
      <Button :loading="loading" type="primary" @click="loadAssets">筛选</Button>
    </div>

    <Table
      :data-source="assets"
      :loading="loading"
      row-key="id"
      :pagination="false"
      :row-selection="rowSelection"
      :scroll="{ y: 420 }"
    >
      <Table.Column title="预览" width="88">
        <template #default="{ record }">
          <img
            v-if="record.mimeType?.startsWith('image/')"
            :src="record.publicUrl"
            alt="asset"
            class="h-12 w-12 rounded border object-cover"
          />
          <Tag v-else>FILE</Tag>
        </template>
      </Table.Column>
      <Table.Column title="文件名" data-index="originalFilename" key="originalFilename" />
      <Table.Column title="MIME" data-index="mimeType" key="mimeType" width="180" />
      <Table.Column title="大小" key="sizeBytes" width="120">
        <template #default="{ record }">
          {{ Math.ceil((record.sizeBytes || 0) / 1024) }} KB
        </template>
      </Table.Column>
      <Table.Column title="状态" data-index="status" key="status" width="110" />
      <Table.Column title="URL" key="publicUrl" width="280">
        <template #default="{ record }">
          <Space>
            <span class="truncate" style="max-width: 200px">{{ record.publicUrl }}</span>
            <Button size="small" @click="copyUrl(record.publicUrl)">复制</Button>
          </Space>
        </template>
      </Table.Column>
    </Table>
  </Modal>
</template>
