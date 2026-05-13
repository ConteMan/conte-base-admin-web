<script lang="ts" setup>
import type { ContentTag } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  Button,
  Form,
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
  createContentTag,
  deleteContentTag,
  getContentTags,
  updateContentTag,
} from '#/api';
import { SYSTEM_PERMISSION_CODES } from '#/constants';

interface TagFormValues {
  description: string;
  locale: string;
  name: string;
  slug: string;
  status: 'active' | 'disabled';
}

const accessStore = useAccessStore();
const { hasAccessByCodes } = useAccess();
const loading = ref(false);
const visible = ref(false);
const saving = ref(false);
const editing = ref<ContentTag | null>(null);
const tags = ref<ContentTag[]>([]);
const formState = ref<TagFormValues>({
  description: '',
  locale: 'zh-CN',
  name: '',
  slug: '',
  status: 'active',
});

const canCreate = computed(() =>
  hasPermission([SYSTEM_PERMISSION_CODES.contentTagCreate]),
);
const canUpdate = computed(() =>
  hasPermission([SYSTEM_PERMISSION_CODES.contentTagUpdate]),
);
const canDelete = computed(() =>
  hasPermission([SYSTEM_PERMISSION_CODES.contentTagDelete]),
);

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Disabled', value: 'disabled' },
];

const localeOptions = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
];

function hasPermission(codes: string[]) {
  if (!accessStore.isAccessChecked) {
    return false;
  }
  return hasAccessByCodes(codes);
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getContentTags();
    tags.value = result.items || [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  visible.value = true;
  formState.value = {
    description: '',
    locale: 'zh-CN',
    name: '',
    slug: '',
    status: 'active',
  };
}

function openEdit(record: ContentTag) {
  editing.value = record;
  visible.value = true;
  formState.value = {
    description: record.description,
    locale: record.locale || 'zh-CN',
    name: record.name,
    slug: record.slug,
    status: record.status || 'active',
  };
}

async function submit() {
  const values = { ...formState.value };
  if (!values.name.trim() || !values.slug.trim()) {
    message.error('请先填写名称和 slug');
    return;
  }
  saving.value = true;
  try {
    if (editing.value) {
      await updateContentTag(editing.value.id, values);
      message.success('标签已更新');
    } else {
      await createContentTag(values);
      message.success('标签已创建');
    }
    visible.value = false;
    await loadData();
  } finally {
    saving.value = false;
  }
}

async function remove(record: ContentTag) {
  await deleteContentTag(record.id);
  message.success('标签已删除');
  await loadData();
}

onMounted(() => {
  void loadData();
});
</script>

<template>
  <Page
    auto-content-height
    description="维护笔记标签集合与可见状态"
    title="标签管理"
  >
    <div class="mb-4 flex justify-end">
      <Button v-if="canCreate" type="primary" @click="openCreate">
        新建标签
      </Button>
    </div>

    <Table
      :data-source="tags"
      :loading="loading"
      row-key="id"
      :pagination="false"
    >
      <Table.Column title="名称" data-index="name" key="name" />
      <Table.Column title="Slug" data-index="slug" key="slug" />
      <Table.Column title="语言" data-index="locale" key="locale" width="120" />
      <Table.Column title="状态" key="status" width="120">
        <template #default="{ record }">
          <Tag :color="record.status === 'active' ? 'green' : 'default'">
            {{ record.status }}
          </Tag>
        </template>
      </Table.Column>
      <Table.Column title="操作" key="actions" width="180">
        <template #default="{ record }">
          <Space>
            <Button v-if="canUpdate" type="link" @click="openEdit(record)">
              编辑
            </Button>
            <Popconfirm
              v-if="canDelete"
              title="确认删除该标签？若仍被笔记引用将被拒绝。"
              @confirm="remove(record)"
            >
              <Button danger type="link">删除</Button>
            </Popconfirm>
          </Space>
        </template>
      </Table.Column>
    </Table>

    <Modal
      :confirm-loading="saving"
      :open="visible"
      :title="editing ? '编辑标签' : '新建标签'"
      @cancel="visible = false"
      @ok="submit"
    >
      <Form :model="formState" layout="vertical">
        <Form.Item label="名称">
          <Input v-model:value="formState.name" />
        </Form.Item>
        <Form.Item label="Slug">
          <Input v-model:value="formState.slug" />
        </Form.Item>
        <Form.Item label="语言">
          <Select v-model:value="formState.locale" :options="localeOptions" />
        </Form.Item>
        <Form.Item label="状态">
          <Select v-model:value="formState.status" :options="statusOptions" />
        </Form.Item>
        <Form.Item label="描述">
          <Input.TextArea v-model:value="formState.description" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
