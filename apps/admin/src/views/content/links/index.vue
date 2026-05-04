<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  createContentLink,
  deleteContentLink,
  getContentLinks,
  updateContentLink,
  type ContentLink,
} from '#/api';
import { SYSTEM_PERMISSION_CODES } from '#/constants';
import { $t } from '#/locales';

const accessStore = useAccessStore();
const { hasAccessByCodes } = useAccess();

const loading = ref(false);
const saving = ref(false);
const modalOpen = ref(false);
const editingID = ref<number | null>(null);
const dataSource = ref<ContentLink[]>([]);

const formState = reactive({
  label: '',
  url: '',
  group: 'official',
  displayRank: 10,
  isVisible: true,
  openInNewTab: true,
});

const groupOptions = [
  { label: 'official', value: 'official' },
  { label: 'social', value: 'social' },
  { label: 'resource', value: 'resource' },
];

function hasAnyCode(codes: string[]) {
  if (!accessStore.isAccessChecked) {
    return false;
  }
  return hasAccessByCodes(codes);
}

const canQuery = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentLinkQuery]),
);
const canCreate = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentLinkCreate]),
);
const canUpdate = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentLinkUpdate]),
);
const canDelete = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentLinkDelete]),
);

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: $t('system.content.links.fields.label'), dataIndex: 'label', width: 160 },
  { title: $t('system.content.links.fields.url'), dataIndex: 'url' },
  { title: $t('system.content.links.fields.group'), dataIndex: 'group', width: 120 },
  { title: $t('system.content.links.fields.displayRank'), dataIndex: 'displayRank', width: 120 },
  { title: $t('system.content.links.fields.isVisible'), dataIndex: 'isVisible', width: 110 },
  { title: $t('system.content.links.fields.openInNewTab'), dataIndex: 'openInNewTab', width: 130 },
  { title: $t('system.content.links.fields.actions'), key: 'actions', width: 180 },
];

function resetForm() {
  formState.label = '';
  formState.url = '';
  formState.group = 'official';
  formState.displayRank = 10;
  formState.isVisible = true;
  formState.openInNewTab = true;
  editingID.value = null;
}

function openCreate() {
  resetForm();
  modalOpen.value = true;
}

function openEdit(record: ContentLink) {
  editingID.value = record.id;
  formState.label = record.label;
  formState.url = record.url;
  formState.group = record.group || 'official';
  formState.displayRank = record.displayRank;
  formState.isVisible = record.isVisible;
  formState.openInNewTab = record.openInNewTab;
  modalOpen.value = true;
}

async function loadLinks() {
  if (!canQuery.value) {
    return;
  }
  loading.value = true;
  try {
    const response = await getContentLinks();
    dataSource.value = [...response.items].sort(
      (a, b) => a.displayRank - b.displayRank || a.id - b.id,
    );
  } finally {
    loading.value = false;
  }
}

async function saveLink() {
  saving.value = true;
  try {
    const payload = {
      label: formState.label.trim(),
      url: formState.url.trim(),
      group: formState.group.trim(),
      displayRank: formState.displayRank,
      isVisible: formState.isVisible,
      openInNewTab: formState.openInNewTab,
    };
    if (editingID.value) {
      await updateContentLink(editingID.value, payload);
      message.success($t('system.content.links.messages.updateSuccess'));
    } else {
      await createContentLink(payload);
      message.success($t('system.content.links.messages.createSuccess'));
    }
    modalOpen.value = false;
    await loadLinks();
  } finally {
    saving.value = false;
  }
}

async function removeLink(id: number) {
  await deleteContentLink(id);
  message.success($t('system.content.links.messages.deleteSuccess'));
  await loadLinks();
}

onMounted(() => {
  void loadLinks();
});
</script>

<template>
  <Page
    auto-content-height
    :description="$t('system.content.links.description')"
    :title="$t('system.content.links.title')"
  >
    <Card>
      <div v-if="!canQuery" class="content-empty">
        <Empty :description="$t('system.content.permission.queryRequired')" />
      </div>
      <template v-else>
        <Space class="actions-bar">
          <Button :loading="loading" @click="loadLinks">
            {{ $t('system.content.actions.reload') }}
          </Button>
          <Button
            v-if="canCreate"
            type="primary"
            @click="openCreate"
          >
            {{ $t('system.content.links.actions.create') }}
          </Button>
        </Space>
        <Table
          :columns="columns"
          :data-source="dataSource"
          :loading="loading"
          :pagination="false"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'isVisible'">
              <Tag :color="record.isVisible ? 'green' : 'default'">
                {{ record.isVisible ? $t('system.content.links.visible.yes') : $t('system.content.links.visible.no') }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'openInNewTab'">
              <Tag :color="record.openInNewTab ? 'blue' : 'default'">
                {{ record.openInNewTab ? $t('system.content.links.openInNewTab.yes') : $t('system.content.links.openInNewTab.no') }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space>
                <Button
                  size="small"
                  :disabled="!canUpdate"
                  @click="openEdit(record as ContentLink)"
                >
                  {{ $t('system.content.links.actions.edit') }}
                </Button>
                <Popconfirm
                  :disabled="!canDelete"
                  :title="$t('system.content.links.messages.confirmDelete')"
                  @confirm="removeLink(Number(record.id))"
                >
                  <Button
                    danger
                    size="small"
                    :disabled="!canDelete"
                  >
                    {{ $t('system.content.links.actions.delete') }}
                  </Button>
                </Popconfirm>
              </Space>
            </template>
          </template>
        </Table>
      </template>
    </Card>

    <Modal
      v-model:open="modalOpen"
      :confirm-loading="saving"
      :title="
        editingID
          ? $t('system.content.links.actions.edit')
          : $t('system.content.links.actions.create')
      "
      @ok="saveLink"
      @cancel="resetForm"
    >
      <Form layout="vertical">
        <Form.Item :label="$t('system.content.links.fields.label')">
          <Input
            v-model:value="formState.label"
            :placeholder="$t('system.content.links.fields.labelPlaceholder')"
          />
        </Form.Item>
        <Form.Item :label="$t('system.content.links.fields.url')">
          <Input
            v-model:value="formState.url"
            :placeholder="$t('system.content.links.fields.urlPlaceholder')"
          />
        </Form.Item>
        <Form.Item :label="$t('system.content.links.fields.group')">
          <Select
            v-model:value="formState.group"
            :options="groupOptions"
          />
        </Form.Item>
        <Form.Item :label="$t('system.content.links.fields.displayRank')">
          <InputNumber v-model:value="formState.displayRank" :min="0" style="width: 100%" />
        </Form.Item>
        <Form.Item :label="$t('system.content.links.fields.isVisible')">
          <Switch v-model:checked="formState.isVisible" />
        </Form.Item>
        <Form.Item :label="$t('system.content.links.fields.openInNewTab')">
          <Switch v-model:checked="formState.openInNewTab" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.actions-bar {
  margin-bottom: 16px;
}

.content-empty {
  padding: 24px 0;
}
</style>
