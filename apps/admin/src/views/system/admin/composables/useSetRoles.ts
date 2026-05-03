import type { AdminListItem, SetAdminRolesRequest } from '#/api';
import type { ComputedRef } from 'vue';

import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';

import { setAdminRoles } from '#/api';
import { z } from '#/adapter/form';
import type { DxFormSchema, DxSchemaFormExpose } from '#/components/common';
import { $t } from '#/locales';

interface RoleOption {
  label: string;
  value: number;
}

export function useSetRoles(
  onSuccess: () => Promise<void>,
  roleOptions: ComputedRef<RoleOption[]>,
) {
  const setRolesVisible = ref(false);
  const setRolesSaving = ref(false);
  const setRolesAdminId = ref<null | number>(null);
  const setRolesFormRef = ref<DxSchemaFormExpose | null>(null);
  const setRolesFormResetValues = ref<{ roleIds: number[] } | null>(null);

  const setRolesSchema = computed<DxFormSchema[]>(() => [
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
  ]);

  function openSetRoles(record: AdminListItem) {
    setRolesAdminId.value = record.id;
    setRolesFormResetValues.value = {
      roleIds: record.roles.map((r) => r.id),
    };
    setRolesVisible.value = true;
  }

  function closeSetRoles() {
    setRolesVisible.value = false;
    setRolesAdminId.value = null;
    setRolesFormResetValues.value = null;
  }

  async function onSubmitSetRoles() {
    const validation = await setRolesFormRef.value?.validate();
    if (!validation) {
      return;
    }
    const values = await setRolesFormRef.value?.getValues<{ roleIds: number[] }>();
    if (!setRolesAdminId.value || !values) return;
    setRolesSaving.value = true;
    try {
      const payload: SetAdminRolesRequest = { roleIds: values.roleIds };
      await setAdminRoles(setRolesAdminId.value, payload);
      message.success($t('system.admin.setRolesSuccess'));
      closeSetRoles();
      await onSuccess();
    } finally {
      setRolesSaving.value = false;
    }
  }

  async function onSetRolesOpen(record: AdminListItem) {
    openSetRoles(record);
  }

  return {
    setRolesFormRef,
    setRolesFormResetValues,
    setRolesSchema,
    setRolesVisible,
    setRolesSaving,
    openSetRoles: onSetRolesOpen,
    closeSetRoles,
    onSubmitSetRoles,
  };
}
