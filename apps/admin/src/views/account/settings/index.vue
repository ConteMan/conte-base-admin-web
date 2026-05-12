<script lang="ts" setup>
import type { AdminInfoResponse } from '#/api';
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatEmpty } from '@vben/utils';

import {
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  QRCode,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from 'ant-design-vue';

import {
  changePasswordApi,
  disableTotpApi,
  enableTotpApi,
  getAdminProfileApi,
  getTotpStatusApi,
  setupTotpApi,
} from '#/api';
import { DxPasswordInput } from '#/components/common';
import { $t } from '#/locales';
import { formatDate } from '#/utils/date';
import { isStrongPassword } from '#/utils/password';

interface PasswordFormState {
  confirmPassword: string;
  newPassword: string;
  oldPassword: string;
}

const loading = ref(false);
const submitting = ref(false);
const totpSubmitting = ref(false);
const setupLoading = ref(false);
const profile = ref<AdminInfoResponse | null>(null);
const formRef = ref<FormInstance>();
const setupModalOpen = ref(false);
const disableModalOpen = ref(false);
const totpEnabled = ref<boolean | null>(null);
const setupInfo = ref<{
  otpauthUrl: string;
  secretMasked: string;
  setupExpiresIn: number;
} | null>(null);
const setupVerifyCode = ref('');
const setupOtpauthUrl = computed(() => setupInfo.value?.otpauthUrl || '');

const formModel = reactive<PasswordFormState>({
  confirmPassword: '',
  newPassword: '',
  oldPassword: '',
});
const disableModel = reactive({
  password: '',
  totpCode: '',
});

const passwordRules = computed<Record<keyof PasswordFormState, Rule[]>>(() => ({
  oldPassword: [
    {
      message: $t('system.account.oldPasswordRequired'),
      required: true,
      trigger: 'blur',
    },
  ],
  newPassword: [
    {
      message: $t('system.account.newPasswordRequired'),
      required: true,
      trigger: 'blur',
    },
    {
      trigger: 'blur',
      validator: async (_rule, value: string) => {
        if (!value || isStrongPassword(value)) {
          return Promise.resolve();
        }
        return Promise.reject(new Error($t('system.admin.passwordRuleMsg')));
      },
    },
  ],
  confirmPassword: [
    {
      message: $t('system.account.confirmPasswordRequired'),
      required: true,
      trigger: 'blur',
    },
    {
      trigger: 'blur',
      validator: async (_rule, value: string) => {
        if (!value || value === formModel.newPassword) {
          return Promise.resolve();
        }
        return Promise.reject(new Error($t('system.admin.passwordNotMatch')));
      },
    },
  ],
}));

const profileFields = computed(() => {
  const current = profile.value;

  return {
    createdAt: current?.createdAt ? formatDate(current.createdAt) : formatEmpty(undefined),
    email: current?.email ? current.email : formatEmpty(undefined),
    lastLoginAt: current?.lastLoginAt ? formatDate(current.lastLoginAt) : formatEmpty(undefined),
    lastLoginIp: current?.lastLoginIp ? current.lastLoginIp : formatEmpty(undefined),
    username: current?.username ? current.username : formatEmpty(undefined),
  };
});

async function loadProfile() {
  loading.value = true;
  try {
    profile.value = await getAdminProfileApi();
  } finally {
    loading.value = false;
  }
}

async function loadTotpStatus() {
  try {
    const status = await getTotpStatusApi();
    totpEnabled.value = status.totpEnabled;
  } catch {
    totpEnabled.value = null;
  }
}

async function loadAccountData() {
  await Promise.all([loadProfile(), loadTotpStatus()]);
}

async function submitChangePassword() {
  await formRef.value?.validate();

  submitting.value = true;
  try {
    await changePasswordApi({
      newPassword: formModel.newPassword,
      oldPassword: formModel.oldPassword,
    });
    message.success($t('system.account.changePasswordSuccess'));
    formRef.value?.resetFields();
  } catch {
    // 请求层已经负责展示错误提示和登录过期处理
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  void loadAccountData();
});

const totpStatusTag = computed(() => {
  if (totpEnabled.value === true) {
    return 'success';
  }
  if (totpEnabled.value === false) {
    return 'default';
  }
  return 'warning';
});

const totpStatusText = computed(() => {
  if (totpEnabled.value === true) {
    return $t('system.account.totpEnabled');
  }
  if (totpEnabled.value === false) {
    return $t('system.account.totpDisabled');
  }
  return $t('system.account.totpStatusUnknown');
});

async function openSetupModal() {
  setupLoading.value = true;
  try {
    setupInfo.value = await setupTotpApi({
      accountName: profile.value?.username || '',
      issuer: 'ConteBase',
    });
    setupVerifyCode.value = '';
    setupModalOpen.value = true;
  } catch {
    // 请求层已经负责展示错误提示和登录过期处理
  } finally {
    setupLoading.value = false;
  }
}

function closeSetupModal() {
  setupModalOpen.value = false;
  setupVerifyCode.value = '';
}

async function confirmEnableTotp() {
  if (setupVerifyCode.value.length !== 6) {
    message.error($t('system.account.totpCodeRequired'));
    return;
  }

  totpSubmitting.value = true;
  try {
    await enableTotpApi({ totpCode: setupVerifyCode.value });
    message.success($t('system.account.enableTotpSuccess'));
    closeSetupModal();
    await loadAccountData();
  } catch {
    // 请求层已经负责展示错误提示和登录过期处理
  } finally {
    totpSubmitting.value = false;
  }
}

function openDisableModal() {
  disableModalOpen.value = true;
  disableModel.password = '';
  disableModel.totpCode = '';
}

function closeDisableModal() {
  disableModalOpen.value = false;
  disableModel.password = '';
  disableModel.totpCode = '';
}

async function confirmDisableTotp() {
  if (!disableModel.password || disableModel.totpCode.length !== 6) {
    message.error($t('system.account.disableTotpRequired'));
    return;
  }

  totpSubmitting.value = true;
  try {
    await disableTotpApi({
      password: disableModel.password,
      totpCode: disableModel.totpCode,
    });
    message.success($t('system.account.disableTotpSuccess'));
    closeDisableModal();
    await loadAccountData();
  } catch {
    // 请求层已经负责展示错误提示和登录过期处理
  } finally {
    totpSubmitting.value = false;
  }
}

async function copyOtpauthUrl() {
  const url = setupInfo.value?.otpauthUrl || '';
  if (!url) return;

  try {
    await navigator.clipboard.writeText(url);
    message.success($t('system.account.copyOtpauthSuccess'));
  } catch {
    message.error($t('system.account.copyOtpauthFailed'));
  }
}
</script>

<template>
  <Page
    auto-content-height
    :description="$t('system.account.description')"
    :title="$t('system.account.title')"
  >
    <Row :gutter="[16, 16]">
      <Col :lg="12" :md="24" :sm="24" :xs="24">
        <Card :loading="loading" :title="$t('system.account.profileCardTitle')">
          <Descriptions bordered :column="1" size="small">
            <Descriptions.Item :label="$t('system.account.username')">
              {{ profileFields.username }}
            </Descriptions.Item>
            <Descriptions.Item :label="$t('system.account.roles')">
              <Space v-if="profile?.roles?.length" wrap>
                <Tag v-for="role in profile.roles" :key="role">
                  {{ role }}
                </Tag>
              </Space>
              <span v-else>{{ formatEmpty(undefined) }}</span>
            </Descriptions.Item>
            <Descriptions.Item :label="$t('system.account.email')">
              {{ profileFields.email }}
            </Descriptions.Item>
            <Descriptions.Item :label="$t('system.account.lastLoginAt')">
              {{ profileFields.lastLoginAt }}
            </Descriptions.Item>
            <Descriptions.Item :label="$t('system.account.lastLoginIp')">
              {{ profileFields.lastLoginIp }}
            </Descriptions.Item>
            <Descriptions.Item :label="$t('system.account.createdAt')">
              {{ profileFields.createdAt }}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>

      <Col :lg="12" :md="24" :sm="24" :xs="24">
        <Card :title="$t('system.account.passwordCardTitle')">
          <Form
            ref="formRef"
            layout="vertical"
            :model="formModel"
            :rules="passwordRules"
          >
            <Form.Item :label="$t('system.account.oldPassword')" name="oldPassword">
              <DxPasswordInput
                v-model:value="formModel.oldPassword"
                :show-strength="false"
              />
            </Form.Item>
            <Form.Item
              :label="$t('system.account.newPassword')"
              name="newPassword"
              :tooltip="$t('system.admin.passwordRuleMsg')"
            >
              <DxPasswordInput
                v-model:value="formModel.newPassword"
                :show-strength="true"
              />
            </Form.Item>
            <Form.Item
              :label="$t('system.account.confirmPassword')"
              name="confirmPassword"
            >
              <DxPasswordInput
                v-model:value="formModel.confirmPassword"
                :show-strength="false"
              />
            </Form.Item>
            <div class="account-password-actions">
              <Button
                class="account-password-submit"
                :loading="submitting"
                type="primary"
                @click="submitChangePassword"
              >
                {{ $t('system.account.submit') }}
              </Button>
            </div>
          </Form>
        </Card>

        <Card class="mt-4" :title="$t('system.account.totpCardTitle')">
          <div class="totp-status-row">
            <span>{{ $t('system.account.totpStatusLabel') }}</span>
            <Tag :color="totpStatusTag">
              {{ totpStatusText }}
            </Tag>
          </div>
          <p class="totp-description">
            {{
              totpEnabled === null
                ? $t('system.account.totpStatusPendingDesc')
                : totpEnabled
                ? $t('system.account.totpEnabledDesc')
                : $t('system.account.totpDisabledDesc')
            }}
          </p>
          <div class="totp-actions">
            <Button
              v-if="totpEnabled !== true"
              :loading="setupLoading"
              type="primary"
              @click="openSetupModal"
            >
              {{ $t('system.account.enableTotp') }}
            </Button>
            <Button
              v-else
              :loading="totpSubmitting"
              danger
              type="primary"
              @click="openDisableModal"
            >
              {{ $t('system.account.disableTotp') }}
            </Button>
          </div>
        </Card>
      </Col>
    </Row>

    <Modal
      v-model:open="setupModalOpen"
      :confirm-loading="totpSubmitting"
      :ok-text="$t('system.account.confirmEnableTotp')"
      :title="$t('system.account.enableTotpModalTitle')"
      @cancel="closeSetupModal"
      @ok="confirmEnableTotp"
    >
      <Space direction="vertical" style="width: 100%">
        <div class="totp-qr-section">
          <Typography.Text strong>
            {{ $t('system.account.totpQrLabel') }}
          </Typography.Text>
          <QRCode
            v-if="setupOtpauthUrl"
            :value="setupOtpauthUrl"
            :size="168"
          />
        </div>
        <div class="otpauth-row">
          <Typography.Text>
            {{ $t('system.account.otpauthUrlLabel') }}
          </Typography.Text>
          <Button size="small" type="link" @click="copyOtpauthUrl">
            {{ $t('system.account.copyOtpauthAction') }}
          </Button>
        </div>
        <Input :value="setupOtpauthUrl" readonly />
        <Typography.Text strong>
          {{ $t('system.account.totpEnableCodeLabel') }}
        </Typography.Text>
        <Input
          v-model:value="setupVerifyCode"
          :maxlength="6"
          :placeholder="$t('system.account.totpCodePlaceholder')"
        />
      </Space>
    </Modal>

    <Modal
      v-model:open="disableModalOpen"
      :confirm-loading="totpSubmitting"
      :ok-text="$t('system.account.confirmDisableTotp')"
      :title="$t('system.account.disableTotpModalTitle')"
      @cancel="closeDisableModal"
      @ok="confirmDisableTotp"
    >
      <Form layout="vertical">
        <Form.Item :label="$t('system.account.totpDisablePasswordLabel')">
          <Input.Password v-model:value="disableModel.password" />
        </Form.Item>
        <Form.Item :label="$t('system.account.totpCodeLabel')">
          <Input v-model:value="disableModel.totpCode" :maxlength="6" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.account-password-actions {
  display: flex;
  justify-content: flex-end;
}

.account-password-submit {
  min-width: 132px;
}

.totp-status-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.totp-description {
  color: #666;
  margin-top: 12px;
}

.totp-actions {
  margin-top: 16px;
}

.totp-qr-section {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.otpauth-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
}
</style>
