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
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  createContentProject,
  deleteContentProject,
  getContentProjects,
  updateContentProject,
  type ContentProject,
} from '#/api';
import { SYSTEM_PERMISSION_CODES } from '#/constants';
import { $t } from '#/locales';

const accessStore = useAccessStore();
const { hasAccessByCodes } = useAccess();

const loading = ref(false);
const saving = ref(false);
const modalOpen = ref(false);
const editingID = ref<number | null>(null);
const dataSource = ref<ContentProject[]>([]);

const formState = reactive({
  slug: '',
  name: '',
  summary: '',
  isVisible: true,
  displayRank: 10,
});

function hasAnyCode(codes: string[]) {
  if (!accessStore.isAccessChecked) {
    return false;
  }
  return hasAccessByCodes(codes);
}

const canQuery = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentProjectQuery]),
);
const canCreate = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentProjectCreate]),
);
const canUpdate = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentProjectUpdate]),
);
const canDelete = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentProjectDelete]),
);

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: $t('system.content.projects.fields.slug'), dataIndex: 'slug', width: 180 },
  { title: $t('system.content.projects.fields.name'), dataIndex: 'name', width: 200 },
  { title: $t('system.content.projects.fields.summary'), dataIndex: 'summary' },
  { title: $t('system.content.projects.fields.displayRank'), dataIndex: 'displayRank', width: 120 },
  { title: $t('system.content.projects.fields.isVisible'), dataIndex: 'isVisible', width: 120 },
  { title: $t('system.content.projects.fields.actions'), key: 'actions', width: 180 },
];

function resetForm() {
  formState.slug = '';
  formState.name = '';
  formState.summary = '';
  formState.isVisible = true;
  formState.displayRank = 10;
  editingID.value = null;
}

function openCreate() {
  resetForm();
  modalOpen.value = true;
}

function openEdit(record: ContentProject) {
  editingID.value = record.id;
  formState.slug = record.slug;
  formState.name = record.name;
  formState.summary = record.summary;
  formState.isVisible = record.isVisible;
  formState.displayRank = record.displayRank;
  modalOpen.value = true;
}

async function loadProjects() {
  if (!canQuery.value) {
    return;
  }
  loading.value = true;
  try {
    const response = await getContentProjects();
    dataSource.value = [...response.items].sort(
      (a, b) => a.displayRank - b.displayRank || a.id - b.id,
    );
  } finally {
    loading.value = false;
  }
}

async function saveProject() {
  saving.value = true;
  try {
    const payload = {
      slug: formState.slug.trim(),
      name: formState.name.trim(),
      summary: formState.summary.trim(),
      isVisible: formState.isVisible,
      displayRank: formState.displayRank,
    };
    if (editingID.value) {
      await updateContentProject(editingID.value, payload);
      message.success($t('system.content.projects.messages.updateSuccess'));
    } else {
      await createContentProject(payload);
      message.success($t('system.content.projects.messages.createSuccess'));
    }
    modalOpen.value = false;
    await loadProjects();
  } finally {
    saving.value = false;
  }
}

async function removeProject(id: number) {
  await deleteContentProject(id);
  message.success($t('system.content.projects.messages.deleteSuccess'));
  await loadProjects();
}

onMounted(() => {
  void loadProjects();
});
</script>

<template>
  <Page
    auto-content-height
    :description="$t('system.content.projects.description')"
    :title="$t('system.content.projects.title')"
  >
    <Card>
      <div v-if="!canQuery" class="content-empty">
        <Empty :description="$t('system.content.permission.queryRequired')" />
      </div>
      <template v-else>
        <Space class="actions-bar">
          <Button :loading="loading" @click="loadProjects">
            {{ $t('system.content.actions.reload') }}
          </Button>
          <Button
            v-if="canCreate"
            type="primary"
            @click="openCreate"
          >
            {{ $t('system.content.projects.actions.create') }}
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
                {{ record.isVisible ? $t('system.content.projects.visible.yes') : $t('system.content.projects.visible.no') }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space>
                <Button
                  size="small"
                  :disabled="!canUpdate"
                  @click="openEdit(record as ContentProject)"
                >
                  {{ $t('system.content.projects.actions.edit') }}
                </Button>
                <Popconfirm
                  :disabled="!canDelete"
                  :title="$t('system.content.projects.messages.confirmDelete')"
                  @confirm="removeProject(Number(record.id))"
                >
                  <Button
                    danger
                    size="small"
                    :disabled="!canDelete"
                  >
                    {{ $t('system.content.projects.actions.delete') }}
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
          ? $t('system.content.projects.actions.edit')
          : $t('system.content.projects.actions.create')
      "
      @ok="saveProject"
      @cancel="resetForm"
    >
      <Form layout="vertical">
        <Form.Item :label="$t('system.content.projects.fields.slug')">
          <Input
            v-model:value="formState.slug"
            :placeholder="$t('system.content.projects.fields.slugPlaceholder')"
          />
        </Form.Item>
        <Form.Item :label="$t('system.content.projects.fields.name')">
          <Input
            v-model:value="formState.name"
            :placeholder="$t('system.content.projects.fields.namePlaceholder')"
          />
        </Form.Item>
        <Form.Item :label="$t('system.content.projects.fields.summary')">
          <Input.TextArea
            v-model:value="formState.summary"
            :auto-size="{ minRows: 3, maxRows: 6 }"
            :placeholder="$t('system.content.projects.fields.summaryPlaceholder')"
          />
        </Form.Item>
        <Form.Item :label="$t('system.content.projects.fields.displayRank')">
          <InputNumber v-model:value="formState.displayRank" :min="0" style="width: 100%" />
        </Form.Item>
        <Form.Item :label="$t('system.content.projects.fields.isVisible')">
          <Switch v-model:checked="formState.isVisible" />
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
