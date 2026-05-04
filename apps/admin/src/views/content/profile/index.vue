<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { Button, Card, Empty, Form, Input, Space, message } from 'ant-design-vue';

import { getContentProfile, updateContentProfile } from '#/api';
import { SYSTEM_PERMISSION_CODES } from '#/constants';
import { $t } from '#/locales';

const loading = ref(false);
const saving = ref(false);

const accessStore = useAccessStore();
const { hasAccessByCodes } = useAccess();

const formState = reactive({
  name: '',
  summary: '',
  title: '',
});

function hasAnyCode(codes: string[]) {
  if (!accessStore.isAccessChecked) {
    return false;
  }
  return hasAccessByCodes(codes);
}

const canQuery = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentProfileQuery]),
);
const canUpdate = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentProfileUpdate]),
);

async function loadProfile() {
  if (!canQuery.value) {
    return;
  }
  loading.value = true;
  try {
    const response = await getContentProfile();
    formState.name = response.name;
    formState.title = response.title;
    formState.summary = response.summary;
  } finally {
    loading.value = false;
  }
}

async function saveProfile() {
  saving.value = true;
  try {
    await updateContentProfile({
      name: formState.name.trim(),
      summary: formState.summary.trim(),
      title: formState.title.trim(),
    });
    message.success($t('system.content.messages.profileUpdateSuccess'));
    await loadProfile();
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadProfile();
});
</script>

<template>
  <Page
    auto-content-height
    :description="$t('system.content.profile.description')"
    :title="$t('system.content.profile.title')"
  >
    <Card>
      <div v-if="!canQuery" class="content-empty">
        <Empty :description="$t('system.content.permission.queryRequired')" />
      </div>
      <Form v-else layout="vertical">
        <Form.Item :label="$t('system.content.profile.fields.name')">
          <Input
            v-model:value="formState.name"
            :disabled="loading || !canUpdate"
            :placeholder="$t('system.content.profile.fields.namePlaceholder')"
          />
        </Form.Item>
        <Form.Item :label="$t('system.content.profile.fields.title')">
          <Input
            v-model:value="formState.title"
            :disabled="loading || !canUpdate"
            :placeholder="$t('system.content.profile.fields.titlePlaceholder')"
          />
        </Form.Item>
        <Form.Item :label="$t('system.content.profile.fields.summary')">
          <Input.TextArea
            v-model:value="formState.summary"
            :auto-size="{ maxRows: 8, minRows: 4 }"
            :disabled="loading || !canUpdate"
            :placeholder="$t('system.content.profile.fields.summaryPlaceholder')"
          />
        </Form.Item>
        <Space>
          <Button :loading="loading" @click="loadProfile">
            {{ $t('system.content.actions.reload') }}
          </Button>
          <Button
            :disabled="!canUpdate"
            :loading="saving"
            type="primary"
            @click="saveProfile"
          >
            {{ $t('system.content.actions.save') }}
          </Button>
        </Space>
      </Form>
    </Card>
  </Page>
</template>

<style scoped>
.content-empty {
  padding: 24px 0;
}
</style>
