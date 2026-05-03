import type { RoleItem, SetRoleMenusRequest } from '#/api/modules/role';

import { ref } from 'vue';

import { message } from 'ant-design-vue';

import { setRoleMenus } from '#/api';
import { $t } from '#/locales';

export function useRolePermissions(reload: () => Promise<void>) {
  const permissionVisible = ref(false);
  const permissionSaving = ref(false);
  const activeRole = ref<null | RoleItem>(null);
  const checkedMenuKeys = ref<Array<number | string>>([]);
  const halfCheckedMenuKeys = ref<Array<number | string>>([]);

  function openPermissionModal(role: RoleItem) {
    activeRole.value = role;
    checkedMenuKeys.value = [...(role.menuIds || [])];
    permissionVisible.value = true;
  }

  function onPermissionCheck(
    checked:
      | Array<number | string>
      | {
          checked: Array<number | string>;
          halfChecked: Array<number | string>;
        },
  ) {
    if (Array.isArray(checked)) {
      checkedMenuKeys.value = checked;
      halfCheckedMenuKeys.value = [];
    } else {
      checkedMenuKeys.value = checked.checked;
      halfCheckedMenuKeys.value = checked.halfChecked;
    }
  }

  async function onSubmitPermissions() {
    if (!activeRole.value) {
      return;
    }
    permissionSaving.value = true;
    try {
      const payload: SetRoleMenusRequest = {
        menuIds: [...checkedMenuKeys.value, ...halfCheckedMenuKeys.value]
          .map((item) => Number(item))
          .filter((item) => Number.isFinite(item)),
      };
      await setRoleMenus(activeRole.value.id, payload);
      message.success($t('system.role.assignSuccess'));
      onClosePermissionModal();
      await reload();
    } finally {
      permissionSaving.value = false;
    }
  }

  function onClosePermissionModal() {
    permissionVisible.value = false;
    activeRole.value = null;
    checkedMenuKeys.value = [];
    halfCheckedMenuKeys.value = [];
  }

  return {
    activeRole,
    checkedMenuKeys,
    halfCheckedMenuKeys,
    onClosePermissionModal,
    onPermissionCheck,
    onSubmitPermissions,
    openPermissionModal,
    permissionSaving,
    permissionVisible,
  };
}
