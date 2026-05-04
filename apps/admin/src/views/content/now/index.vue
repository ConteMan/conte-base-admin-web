<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { Button, Card, Empty, Form, Input, Space, message } from 'ant-design-vue';

import { getContentNow, updateContentNow } from '#/api';
import { SYSTEM_PERMISSION_CODES } from '#/constants';
import { $t } from '#/locales';

const loading = ref(false);
const saving = ref(false);

const accessStore = useAccessStore();
const { hasAccessByCodes } = useAccess();

const formState = reactive({
  description: '',
  title: '',
});

function hasAnyCode(codes: string[]) {
  if (!accessStore.isAccessChecked) {
    return false;
  }
  return hasAccessByCodes(codes);
}

const canQuery = computed(() => hasAnyCode([SYSTEM_PERMISSION_CODES.contentNowQuery]));
const canUpdate = computed(() => hasAnyCode([SYSTEM_PERMISSION_CODES.contentNowUpdate]));

async function loadNow() {
  if (!canQuery.value) {
    return;
  }
  loading.value = true;
  try {
    const response = await getContentNow();
    formState.title = response.title;
    formState.description = response.description;
  } finally {
    loading.value = false;
  }
}

async function saveNow() {
  saving.value = true;
  try {
    await updateContentNow({
      description: formState.description.trim(),
      title: formState.title.trim(),
    });
    message.success($t('system.content.messages.nowUpdateSuccess'));
    await loadNow();
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadNow();
});
</script>

<template>
  <Page
    auto-content-height
    :description="$t('system.content.now.description')"
    :title="$t('system.content.now.title')"
  >
    <Card>
      <div v-if="!canQuery" class="content-empty">
        <Empty :description="$t('system.content.permission.queryRequired')" />
      </div>
      <Form v-else layout="vertical">
        <Form.Item :label="$t('system.content.now.fields.title')">
          <Input
            v-model:value="formState.title"
            :disabled="loading || !canUpdate"
            :placeholder="$t('system.content.now.fields.titlePlaceholder')"
          />
        </Form.Item>
        <Form.Item :label="$t('system.content.now.fields.description')">
          <Input.TextArea
            v-model:value="formState.description"
            :auto-size="{ maxRows: 12, minRows: 6 }"
            :disabled="loading || !canUpdate"
            :placeholder="$t('system.content.now.fields.descriptionPlaceholder')"
          />
        </Form.Item>
        <Space>
          <Button :loading="loading" @click="loadNow">
            {{ $t('system.content.actions.reload') }}
          </Button>
          <Button
            :disabled="!canUpdate"
            :loading="saving"
            type="primary"
            @click="saveNow"
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
