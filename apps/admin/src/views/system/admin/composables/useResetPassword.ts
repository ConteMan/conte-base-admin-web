import type { AdminListItem } from '#/api';

import { markRaw, ref, computed } from 'vue';

import { message } from 'ant-design-vue';

import { resetAdminPassword } from '#/api';
import { z } from '#/adapter/form';
import type { DxFormSchema, DxSchemaFormExpose } from '#/components/common';
import { DxPasswordInput } from '#/components/common';
import { $t } from '#/locales';
import { isStrongPassword } from '#/utils/password';

export function useResetPassword() {
  const resetPwdVisible = ref(false);
  const resetPwdSaving = ref(false);
  const resetPwdAdminId = ref<null | number>(null);
  const resetPwdUsername = ref('');
  const resetPwdFormRef = ref<DxSchemaFormExpose | null>(null);
  const resetPwdFormResetValues = ref<{
    newPassword?: string;
    newPasswordConfirm?: string;
  } | null>(null);

  const resetPwdSchema = computed<DxFormSchema[]>(() => [
    {
      component: markRaw(DxPasswordInput),
      componentProps: {
        placeholder: $t('system.admin.passwordPlaceholder'),
        showStrength: true,
      },
      defaultValue: '',
      fieldName: 'newPassword',
      label: $t('system.admin.newPasswordLabel'),
      modelPropName: 'value',
      required: true,
      rules: z
        .string({
          required_error: $t('system.admin.passwordRequired'),
        })
        .min(1, {
          message: $t('system.admin.passwordRequired'),
        }),
      tooltip: $t('system.admin.passwordRuleMsg'),
    },
    {
      component: markRaw(DxPasswordInput),
      componentProps: {
        placeholder: $t('system.admin.passwordConfirmPlaceholder'),
        showStrength: false,
      },
      defaultValue: '',
      fieldName: 'newPasswordConfirm',
      label: $t('system.admin.passwordConfirmLabel'),
      modelPropName: 'value',
      required: true,
      rules: z
        .string({
          required_error: $t('system.admin.passwordConfirmRequired'),
        })
        .min(1, {
          message: $t('system.admin.passwordConfirmRequired'),
        }),
    },
  ]);

  function openResetPassword(record: AdminListItem) {
    resetPwdAdminId.value = record.id;
    resetPwdUsername.value = record.username;
    resetPwdFormResetValues.value = {
      newPassword: '',
      newPasswordConfirm: '',
    };
    resetPwdVisible.value = true;
  }

  function closeResetPassword() {
    resetPwdVisible.value = false;
    resetPwdAdminId.value = null;
    resetPwdUsername.value = '';
    resetPwdFormResetValues.value = null;
  }

  async function onSubmitResetPassword() {
    const validation = await resetPwdFormRef.value?.validate();
    if (!validation) {
      return;
    }

    const values = await resetPwdFormRef.value?.getValues<{
      newPassword?: string;
      newPasswordConfirm?: string;
    }>();
    if (!resetPwdAdminId.value || !values?.newPassword) {
      return;
    }
    if (values.newPassword !== values.newPasswordConfirm) {
      message.error($t('system.admin.passwordNotMatch'));
      return;
    }
    const ruleMsg = $t('system.admin.passwordRuleMsg');
    const pwd = values.newPassword;
    if (pwd.length < 8) {
      message.error(ruleMsg);
      return;
    }
    if (!isStrongPassword(pwd)) {
      message.error(ruleMsg);
      return;
    }
    resetPwdSaving.value = true;
    try {
      await resetAdminPassword(resetPwdAdminId.value, { newPassword: pwd });
      message.success($t('system.admin.resetPasswordSuccess'));
      closeResetPassword();
    } finally {
      resetPwdSaving.value = false;
    }
  }

  async function onOpenResetPassword(record: AdminListItem) {
    openResetPassword(record);
  }

  return {
    resetPwdFormRef,
    resetPwdFormResetValues,
    resetPwdSchema,
    resetPwdVisible,
    resetPwdSaving,
    resetPwdUsername,
    openResetPassword: onOpenResetPassword,
    closeResetPassword,
    onSubmitResetPassword,
  };
}
