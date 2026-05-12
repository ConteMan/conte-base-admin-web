import type { AdminListItem, CreateAdminRequest, UpdateAdminRequest } from '#/api';
import type { ComputedRef } from 'vue';

import { computed, markRaw, ref } from 'vue';

import { message, Modal } from 'ant-design-vue';

import { createAdmin, setAdminRoles, updateAdmin } from '#/api';
import { z } from '#/adapter/form';
import type { DxFormSchema, DxSchemaFormExpose } from '#/components/common';
import { DxPasswordInput } from '#/components/common';
import { $t } from '#/locales';
import { isStrongPassword } from '#/utils/password';

interface RoleOption {
  label: string;
  value: number;
}

interface AdminFormValues {
  email?: string;
  password?: string;
  passwordConfirm?: string;
  roleIds: number[];
  username: string;
}

function buildAdminFormDefaults(): AdminFormValues {
  return {
    email: '',
    password: '',
    passwordConfirm: '',
    roleIds: [],
    username: '',
  };
}

function normalizeEmail(value?: string) {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed : undefined;
}

export function useAdminForm(
  onSuccess: () => Promise<void>,
  roleOptions: ComputedRef<RoleOption[]>,
) {
  const drawerVisible = ref(false);
  const drawerSaving = ref(false);
  const drawerFormRef = ref<DxSchemaFormExpose | null>(null);
  const editingAdminId = ref<null | number>(null);
  const drawerFormResetValues = ref<AdminFormValues | null>(null);

  const isEditing = computed(() => editingAdminId.value !== null);

  const drawerTitle = computed(() =>
    isEditing.value
      ? $t('system.admin.editTitle')
      : $t('system.admin.createTitle'),
  );

  const drawerSchema = computed<DxFormSchema[]>(() => {
    const createMode = !isEditing.value;
    return [
      {
        component: 'Input',
        componentProps: {
          allowClear: true,
          placeholder: $t('system.admin.usernamePlaceholder'),
        },
        defaultValue: '',
        fieldName: 'username',
        label: $t('system.admin.usernameLabel'),
        required: true,
        rules: z
          .string({
            required_error: $t('system.admin.usernameRequired'),
          })
          .trim()
          .min(1, {
            message: $t('system.admin.usernameRequired'),
          }),
      },
      ...(createMode
        ? [
            {
              component: markRaw(DxPasswordInput),
              componentProps: {
                placeholder: $t('system.admin.passwordPlaceholder'),
                showStrength: true,
              },
              defaultValue: '',
              fieldName: 'password',
              label: $t('system.admin.passwordLabel'),
              required: true,
              rules: z
                .string({
                  required_error: $t('system.admin.passwordRequired'),
                })
                .min(1, {
                  message: $t('system.admin.passwordRequired'),
                }),
              modelPropName: 'value',
              tooltip: $t('system.admin.passwordRuleMsg'),
            },
            {
              component: markRaw(DxPasswordInput),
              componentProps: {
                placeholder: $t('system.admin.passwordConfirmPlaceholder'),
                showStrength: false,
              },
              defaultValue: '',
              fieldName: 'passwordConfirm',
              label: $t('system.admin.passwordConfirmLabel'),
              required: true,
              rules: z
                .string({
                  required_error: $t('system.admin.passwordConfirmRequired'),
                })
                .min(1, {
                  message: $t('system.admin.passwordConfirmRequired'),
                }),
              modelPropName: 'value',
            },
          ]
        : []),
      {
        component: 'Input',
        componentProps: {
          allowClear: true,
          placeholder: $t('system.admin.emailPlaceholder'),
        },
        defaultValue: '',
        fieldName: 'email',
        label: $t('system.admin.emailLabel'),
      },
      {
        component: 'Select',
        componentProps: {
          allowClear: false,
          mode: 'multiple',
          options: roleOptions.value,
          placeholder: $t('system.admin.rolesPlaceholder'),
        },
        defaultValue: [],
        fieldName: 'roleIds',
        label: $t('system.admin.rolesLabel'),
        required: true,
        rules: z
          .array(z.number())
          .min(1, { message: $t('system.admin.rolesRequired') }),
      },
    ];
  });

  function resetForm() {
    editingAdminId.value = null;
    drawerFormResetValues.value = null;
  }

  async function openCreate() {
    resetForm();
    drawerFormResetValues.value = buildAdminFormDefaults();
    drawerVisible.value = true;
  }

  async function openEdit(record: AdminListItem) {
    resetForm();
    editingAdminId.value = record.id;
    drawerFormResetValues.value = {
      email: record.email || '',
      password: '',
      passwordConfirm: '',
      roleIds: record.roles.map((r) => r.id),
      username: record.username,
    };
    drawerVisible.value = true;
  }

  async function onSubmitAdmin() {
    const validation = await drawerFormRef.value?.validate();
    if (!validation) {
      return;
    }

    const values = await drawerFormRef.value?.getValues<AdminFormValues>();
    if (!values) {
      return;
    }

    if (!isEditing.value) {
      if (!values.password) {
        message.error($t('system.admin.passwordRequired'));
        return;
      }
      if (!isStrongPassword(values.password)) {
        message.error($t('system.admin.passwordRuleMsg'));
        return;
      }
      if (values.password !== values.passwordConfirm) {
        message.error($t('system.admin.passwordNotMatch'));
        return;
      }
    }

    drawerSaving.value = true;
    try {
      if (isEditing.value && editingAdminId.value !== null) {
        const payload: UpdateAdminRequest = {
          email: normalizeEmail(values.email),
          username: values.username.trim(),
        };
        await updateAdmin(editingAdminId.value, payload);
        await setAdminRoles(editingAdminId.value, { roleIds: values.roleIds });
        message.success($t('system.admin.updateSuccess'));
      } else {
        const payload: CreateAdminRequest = {
          email: normalizeEmail(values.email),
          password: values.password || '',
          roleIds: values.roleIds,
          username: values.username.trim(),
        };
        await createAdmin(payload);
        message.success($t('system.admin.createSuccess'));
        Modal.info({
          title: $t('system.admin.createFollowupTitle'),
          content: $t('system.admin.createFollowupDescription'),
        });
      }
      drawerVisible.value = false;
      await onSuccess();
    } finally {
      drawerSaving.value = false;
    }
  }

  function onCloseDrawer() {
    drawerVisible.value = false;
    resetForm();
  }

  return {
    drawerVisible,
    drawerSaving,
    drawerFormRef,
    drawerFormResetValues,
    isEditing,
    drawerTitle,
    drawerSchema,
    openCreate,
    openEdit,
    onSubmitAdmin,
    onCloseDrawer,
  };
}
