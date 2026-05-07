<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, ref } from 'vue';

import {
  AuthenticationCodeLogin,
  AuthenticationLogin,
  z,
} from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useAuthStore } from '#/store';

import { appConfig } from '../../../app-config';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const loginStage = ref<'password' | 'totp'>('password');
const mfaTicket = ref('');
const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
  ];
});

const totpSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenPinInput',
      componentProps: {
        codeLength: 6,
        placeholder: $t('authentication.totpCode'),
      },
      fieldName: 'totpCode',
      label: $t('authentication.totpCode'),
      rules: z
        .string()
        .length(6, { message: $t('authentication.totpCodeTip', [6]) }),
    },
  ];
});

const totpSubTitle = computed(() => $t('authentication.totpSubtitle'));

async function handlePasswordLogin(values: Recordable<any>) {
  try {
    const { mfaChallenge } = await authStore.authLogin(values);
    if (mfaChallenge?.mfaRequired) {
      mfaTicket.value = mfaChallenge.mfaTicket;
      loginStage.value = 'totp';
    }
  } catch (error) {
    message.error(
      error instanceof Error ? error.message : $t('authentication.loginError'),
    );
  }
}

async function handleVerifyTotp(values: Recordable<any>) {
  try {
    await authStore.verifyTotpLogin({
      mfaTicket: mfaTicket.value,
      totpCode: values.totpCode,
    });
  } catch (error) {
    message.error(
      error instanceof Error ? error.message : $t('authentication.loginError'),
    );
  }
}

function backToPasswordStage() {
  loginStage.value = 'password';
  mfaTicket.value = '';
}
</script>

<template>
  <AuthenticationLogin
    v-if="loginStage === 'password'"
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    :show-code-login="false"
    :show-forget-password="appConfig.auth.showForgetPassword"
    :show-qrcode-login="false"
    :show-register="false"
    :show-remember-me="appConfig.auth.showRememberMe"
    :show-third-party-login="false"
    :sub-title="appConfig.auth.subTitle"
    :title="appConfig.auth.title"
    @submit="handlePasswordLogin"
  />

  <div v-else>
    <AuthenticationCodeLogin
      :form-schema="totpSchema"
      :loading="authStore.loginLoading"
      :show-back="false"
      :sub-title="totpSubTitle"
      :submit-button-text="$t('authentication.totpVerify')"
      :title="$t('authentication.totpTitle')"
      @submit="handleVerifyTotp"
    />
    <div class="mt-4 text-center">
      <a class="vben-link text-sm font-normal" @click="backToPasswordStage">
        {{ $t('authentication.backToPasswordLogin') }}
      </a>
    </div>
  </div>
</template>
