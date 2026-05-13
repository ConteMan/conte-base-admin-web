<script lang="ts" setup>
import type { ContentCategory } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  createContentCategory,
  deleteContentCategory,
  getContentCategories,
  updateContentCategory,
} from '#/api';
import { SYSTEM_PERMISSION_CODES } from '#/constants';

interface CategoryFormValues {
  description: string;
  displayRank: number;
  locale: string;
  name: string;
  parentId?: number;
  slug: string;
  status: 'active' | 'disabled';
}

const accessStore = useAccessStore();
const { hasAccessByCodes } = useAccess();
const loading = ref(false);
const visible = ref(false);
const saving = ref(false);
const editing = ref<ContentCategory | null>(null);
const categories = ref<ContentCategory[]>([]);
const formState = ref<CategoryFormValues>({
  description: '',
  displayRank: 0,
  locale: 'zh-CN',
  name: '',
  parentId: undefined,
  slug: '',
  status: 'active',
});

const canCreate = computed(() =>
  hasPermission([SYSTEM_PERMISSION_CODES.contentCategoryCreate]),
);
const canUpdate = computed(() =>
  hasPermission([SYSTEM_PERMISSION_CODES.contentCategoryUpdate]),
);
const canDelete = computed(() =>
  hasPermission([SYSTEM_PERMISSION_CODES.contentCategoryDelete]),
);

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Disabled', value: 'disabled' },
];

const localeOptions = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
];

const parentOptions = computed(() =>
  categories.value.map((item) => ({ label: item.name, value: item.id })),
);

function hasPermission(codes: string[]) {
  if (!accessStore.isAccessChecked) {
    return false;
  }
  return hasAccessByCodes(codes);
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getContentCategories();
    categories.value = result.items || [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  visible.value = true;
  formState.value = {
    description: '',
    displayRank: 0,
    locale: 'zh-CN',
    name: '',
    parentId: undefined,
    slug: '',
    status: 'active',
  };
}

function openEdit(record: ContentCategory) {
  editing.value = record;
  visible.value = true;
  formState.value = {
    description: record.description,
    displayRank: record.displayRank,
    locale: record.locale || 'zh-CN',
    name: record.name,
    parentId: record.parentId,
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
      await updateContentCategory(editing.value.id, values);
      message.success('分类已更新');
    } else {
      await createContentCategory(values);
      message.success('分类已创建');
    }
    visible.value = false;
    await loadData();
  } finally {
    saving.value = false;
  }
}

async function remove(record: ContentCategory) {
  await deleteContentCategory(record.id);
  message.success('分类已删除');
  await loadData();
}

onMounted(() => {
  void loadData();
});
</script>

<template>
  <Page
    auto-content-height
    description="维护笔记分类树与可见状态"
    title="分类管理"
  >
    <div class="mb-4 flex justify-end">
      <Button v-if="canCreate" type="primary" @click="openCreate">
        新建分类
      </Button>
    </div>

    <Table
      :data-source="categories"
      :loading="loading"
      row-key="id"
      :pagination="false"
    >
      <Table.Column title="名称" data-index="name" key="name" />
      <Table.Column title="Slug" data-index="slug" key="slug" />
      <Table.Column title="父级" key="parentId">
        <template #default="{ record }">
          {{
            categories.find((item) => item.id === record.parentId)?.name || '-'
          }}
        </template>
      </Table.Column>
      <Table.Column title="语言" data-index="locale" key="locale" width="110" />
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
              title="确认删除该分类？若仍被笔记引用将被拒绝。"
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
      :title="editing ? '编辑分类' : '新建分类'"
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
        <Form.Item label="父级分类">
          <Select
            v-model:value="formState.parentId"
            allow-clear
            :options="parentOptions"
          />
        </Form.Item>
        <Form.Item label="语言">
          <Select v-model:value="formState.locale" :options="localeOptions" />
        </Form.Item>
        <Form.Item label="状态">
          <Select v-model:value="formState.status" :options="statusOptions" />
        </Form.Item>
        <Form.Item label="排序">
          <InputNumber
            v-model:value="formState.displayRank"
            class="w-full"
            :min="0"
          />
        </Form.Item>
        <Form.Item label="描述">
          <Input.TextArea v-model:value="formState.description" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
