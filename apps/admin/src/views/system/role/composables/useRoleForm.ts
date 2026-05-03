import type {
  CreateRoleRequest,
  RoleItem,
  UpdateRoleRequest,
} from '#/api/modules/role';

import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';

import { createRole, updateRole } from '#/api';
import { z } from '#/adapter/form';
import type { DxSchemaFormExpose, DxFormSchema } from '#/components/common';
import { $t } from '#/locales';

interface RoleFormValues {
  code: string;
  description?: string;
  name: string;
}

function buildRoleFormDefaults(): RoleFormValues {
  return {
    code: '',
    description: undefined,
    name: '',
  };
}

function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function useRoleForm(reload: () => Promise<void>) {
  const roleSaving = ref(false);
  const roleFormVisible = ref(false);
  const roleFormRef = ref<DxSchemaFormExpose | null>(null);
  const editingRoleId = ref<null | number>(null);
  const roleFormResetValues = ref<RoleFormValues | null>(null);

  const isEditing = computed(() => editingRoleId.value !== null);

  const roleFormSchema = computed<DxFormSchema[]>(() => [
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        disabled: isEditing.value,
        placeholder: $t('system.role.codePlaceholder'),
      },
      defaultValue: '',
      fieldName: 'code',
      label: $t('system.role.codeLabel'),
      rules: z
        .string({
          required_error: $t('system.role.codeRequired'),
        })
        .trim()
        .min(1, {
          message: $t('system.role.codeRequired'),
        }),
      required: true,
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: $t('system.role.namePlaceholder'),
      },
      defaultValue: '',
      fieldName: 'name',
      label: $t('system.role.nameLabel'),
      rules: z
        .string({
          required_error: $t('system.role.nameRequired'),
        })
        .trim()
        .min(1, {
          message: $t('system.role.nameRequired'),
        }),
      required: true,
    },
    {
      component: 'Textarea',
      componentProps: {
        autoSize: { minRows: 3, maxRows: 6 },
        placeholder: $t('system.role.descriptionPlaceholder'),
      },
      defaultValue: '',
      fieldName: 'description',
      label: $t('system.role.descriptionLabel'),
    },
  ]);

  function resetRoleForm() {
    editingRoleId.value = null;
    roleFormResetValues.value = null;
  }

  async function openCreateRole() {
    resetRoleForm();
    roleFormResetValues.value = buildRoleFormDefaults();
    roleFormVisible.value = true;
  }

  async function openEditRole(role: RoleItem) {
    editingRoleId.value = role.id;
    roleFormResetValues.value = {
      code: role.code,
      description: role.description || undefined,
      name: role.name,
    };
    roleFormVisible.value = true;
  }

  async function onSubmitRole() {
    const validation = await roleFormRef.value?.validate();
    if (!validation) {
      return;
    }

    const values = await roleFormRef.value?.getValues<RoleFormValues>();
    if (!values) {
      return;
    }

    roleSaving.value = true;
    try {
      if (isEditing.value && editingRoleId.value !== null) {
        const updatePayload: UpdateRoleRequest = {
          description: normalizeText(values.description || ''),
          name: values.name.trim(),
        };
        await updateRole(editingRoleId.value, updatePayload);
        message.success($t('system.role.updateSuccess'));
      } else {
        const createPayload: CreateRoleRequest = {
          code: values.code.trim(),
          description: normalizeText(values.description || ''),
          name: values.name.trim(),
        };
        await createRole(createPayload);
        message.success($t('system.role.createSuccess'));
      }
      roleFormVisible.value = false;
      await reload();
    } finally {
      roleSaving.value = false;
    }
  }

  function onCloseRoleModal() {
    roleFormVisible.value = false;
    resetRoleForm();
  }

  return {
    isEditing,
    onCloseRoleModal,
    onSubmitRole,
    openCreateRole,
    openEditRole,
    roleFormRef,
    roleFormResetValues,
    roleFormSchema,
    roleFormVisible,
    roleSaving,
  };
}
