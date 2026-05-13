<script lang="ts" setup>
import type { ContentAsset } from '#/api';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  Button,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  completeAssetUpload,
  createAssetUploadIntent,
  deleteAsset,
  getAssets,
  updateAsset,
} from '#/api';
import { SYSTEM_PERMISSION_CODES } from '#/constants';

interface AssetFilterState {
  keyword: string;
  status?: string;
  type: 'all' | 'file' | 'image';
}

const accessStore = useAccessStore();
const { hasAccessByCodes } = useAccess();

const loading = ref(false);
const uploading = ref(false);
const assets = ref<ContentAsset[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const filter = ref<AssetFilterState>({
  keyword: '',
  status: undefined,
  type: 'all',
});

const editing = ref<ContentAsset | null>(null);
const editVisible = ref(false);
const editAlt = ref('');
const editCaption = ref('');
const editSaving = ref(false);

const canQuery = computed(() =>
  hasPermission([SYSTEM_PERMISSION_CODES.contentAssetQuery]),
);
const canCreate = computed(() =>
  hasPermission([SYSTEM_PERMISSION_CODES.contentAssetCreate]),
);
const canUpdate = computed(() =>
  hasPermission([SYSTEM_PERMISSION_CODES.contentAssetUpdate]),
);
const canDelete = computed(() =>
  hasPermission([SYSTEM_PERMISSION_CODES.contentAssetDelete]),
);

const statusOptions = [
  { label: 'Ready', value: 'ready' },
  { label: 'Uploading', value: 'uploading' },
  { label: 'Failed', value: 'failed' },
  { label: 'Deleted', value: 'deleted' },
];

const typeOptions = [
  { label: '全部', value: 'all' },
  { label: '图片', value: 'image' },
  { label: '文件', value: 'file' },
];

function hasPermission(codes: string[]) {
  if (!accessStore.isAccessChecked) {
    return false;
  }
  return hasAccessByCodes(codes);
}

function isImageAsset(item: ContentAsset) {
  return item.mimeType?.startsWith('image/');
}

function filteredAssets(items: ContentAsset[]) {
  if (filter.value.type === 'all') {
    return items;
  }
  return items.filter((item) =>
    filter.value.type === 'image' ? isImageAsset(item) : !isImageAsset(item),
  );
}

async function loadAssets() {
  if (!canQuery.value) {
    return;
  }
  loading.value = true;
  try {
    const result = await getAssets({
      keyword: filter.value.keyword.trim() || undefined,
      page: page.value,
      pageSize: pageSize.value,
      status: filter.value.status,
    });
    const records = result.items || [];
    assets.value = filteredAssets(records);
    total.value = result.total || records.length;
  } finally {
    loading.value = false;
  }
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
    message.success('文件上传完成');
    await loadAssets();
  } finally {
    uploading.value = false;
    input.value = '';
  }
}

function openEdit(record: ContentAsset) {
  editing.value = record;
  editAlt.value = record.alt || '';
  editCaption.value = record.caption || '';
  editVisible.value = true;
}

async function saveEdit() {
  if (!editing.value) {
    return;
  }
  editSaving.value = true;
  try {
    await updateAsset(editing.value.id, {
      alt: editAlt.value,
      caption: editCaption.value,
    });
    message.success('资产元数据已更新');
    editVisible.value = false;
    await loadAssets();
  } finally {
    editSaving.value = false;
  }
}

async function removeAsset(record: ContentAsset) {
  await deleteAsset(record.id);
  message.success('资产已删除');
  await loadAssets();
}

function copyUrl(url: string) {
  void navigator.clipboard?.writeText(url);
  message.success('URL 已复制');
}

void loadAssets();
</script>

<template>
  <Page auto-content-height description="上传、检索和维护媒体资源" title="媒体资源">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <Space wrap>
        <Input
          v-model:value="filter.keyword"
          allow-clear
          placeholder="搜索文件名或对象键"
          style="width: 220px"
        />
        <Select
          v-model:value="filter.status"
          allow-clear
          :options="statusOptions"
          placeholder="状态"
          style="width: 140px"
        />
        <Select
          v-model:value="filter.type"
          :options="typeOptions"
          placeholder="类型"
          style="width: 120px"
        />
        <Button :loading="loading" type="primary" @click="loadAssets">筛选</Button>
      </Space>

      <div v-if="canCreate">
        <Button class="relative" :loading="uploading" type="primary">
          上传文件
          <input
            class="absolute inset-0 cursor-pointer opacity-0"
            multiple
            type="file"
            @change="uploadFiles"
          />
        </Button>
      </div>
    </div>

    <Table
      :data-source="assets"
      :loading="loading"
      row-key="id"
      :pagination="{
        current: page,
        pageSize,
        total,
        onChange: (nextPage: number, nextSize: number) => {
          page = nextPage;
          pageSize = nextSize;
          loadAssets();
        },
      }"
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
      <Table.Column title="状态" key="status" width="100">
        <template #default="{ record }">
          <Tag :color="record.status === 'ready' ? 'green' : 'default'">{{ record.status }}</Tag>
        </template>
      </Table.Column>
      <Table.Column title="Alt" data-index="alt" key="alt" width="160" />
      <Table.Column title="Caption" data-index="caption" key="caption" width="180" />
      <Table.Column title="URL" key="publicUrl" width="260">
        <template #default="{ record }">
          <Space>
            <span class="truncate" style="max-width: 180px">{{ record.publicUrl }}</span>
            <Button size="small" @click="copyUrl(record.publicUrl)">复制</Button>
          </Space>
        </template>
      </Table.Column>
      <Table.Column title="操作" key="actions" width="180">
        <template #default="{ record }">
          <Space>
            <Button v-if="canUpdate" type="link" @click="openEdit(record)">编辑</Button>
            <Popconfirm
              v-if="canDelete"
              title="确认删除该资产？若已被笔记引用将被拒绝。"
              @confirm="removeAsset(record)"
            >
              <Button danger type="link">删除</Button>
            </Popconfirm>
          </Space>
        </template>
      </Table.Column>
    </Table>

    <Modal
      :confirm-loading="editSaving"
      :open="editVisible"
      title="编辑资产"
      @cancel="editVisible = false"
      @ok="saveEdit"
    >
      <div class="space-y-3">
        <div>
          <div class="mb-1 text-gray-500">Alt</div>
          <Input v-model:value="editAlt" allow-clear />
        </div>
        <div>
          <div class="mb-1 text-gray-500">Caption</div>
          <Input.TextArea v-model:value="editCaption" :rows="3" />
        </div>
      </div>
    </Modal>
  </Page>
</template>
