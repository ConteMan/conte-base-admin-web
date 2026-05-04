<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { Button, Card, Empty, Form, Input, Select, Space, message } from 'ant-design-vue';

import { getContentSiteSettings, updateContentSiteSettings } from '#/api';
import { SYSTEM_PERMISSION_CODES } from '#/constants';
import { $t } from '#/locales';

const loading = ref(false);
const saving = ref(false);

const accessStore = useAccessStore();
const { hasAccessByCodes } = useAccess();

const formState = reactive({
  defaultLocale: 'zh-CN',
  siteName: '',
});

const localeOptions = [
  { label: 'zh-CN', value: 'zh-CN' },
  { label: 'en-US', value: 'en-US' },
  { label: 'ja-JP', value: 'ja-JP' },
];

function hasAnyCode(codes: string[]) {
  if (!accessStore.isAccessChecked) {
    return false;
  }
  return hasAccessByCodes(codes);
}

const canQuery = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentSiteQuery]),
);
const canUpdate = computed(() =>
  hasAnyCode([SYSTEM_PERMISSION_CODES.contentSiteUpdate]),
);

async function loadSiteSettings() {
  if (!canQuery.value) {
    return;
  }
  loading.value = true;
  try {
    const response = await getContentSiteSettings();
    formState.siteName = response.siteName;
    formState.defaultLocale = response.defaultLocale;
  } finally {
    loading.value = false;
  }
}

async function saveSiteSettings() {
  saving.value = true;
  try {
    await updateContentSiteSettings({
      defaultLocale: formState.defaultLocale,
      siteName: formState.siteName.trim(),
    });
    message.success($t('system.content.messages.siteSettingsUpdateSuccess'));
    await loadSiteSettings();
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadSiteSettings();
});
</script>

<template>
  <Page
    auto-content-height
    :description="$t('system.content.siteSettings.description')"
    :title="$t('system.content.siteSettings.title')"
  >
    <Card>
      <div v-if="!canQuery" class="content-empty">
        <Empty :description="$t('system.content.permission.queryRequired')" />
      </div>
      <Form v-else layout="vertical">
        <Form.Item :label="$t('system.content.siteSettings.fields.siteName')">
          <Input
            v-model:value="formState.siteName"
            :disabled="loading || !canUpdate"
            :placeholder="
              $t('system.content.siteSettings.fields.siteNamePlaceholder')
            "
          />
        </Form.Item>
        <Form.Item
          :label="$t('system.content.siteSettings.fields.defaultLocale')"
        >
          <Select
            v-model:value="formState.defaultLocale"
            :disabled="loading || !canUpdate"
            :options="localeOptions"
          />
        </Form.Item>
        <Space>
          <Button :loading="loading" @click="loadSiteSettings">
            {{ $t('system.content.actions.reload') }}
          </Button>
          <Button
            :disabled="!canUpdate"
            :loading="saving"
            type="primary"
            @click="saveSiteSettings"
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
