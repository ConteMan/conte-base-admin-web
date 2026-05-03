import { computed } from 'vue';

import { useAccess } from '@vben/access';
import { useAccessStore } from '@vben/stores';
import { formatEmpty } from '@vben/utils';

import type { RoleItem } from '#/api';

import { getRoleList } from '#/api';
import { useEnum } from '#/composables/useMeta';
import { SYSTEM_PERMISSION_CODES } from '#/constants';
import { $t } from '#/locales';

export function useAdminList() {
  // --- 权限 ---
  const accessStore = useAccessStore();
  const { hasAccessByCodes } = useAccess();

  function hasAnyCode(codes: string[]) {
    // 权限码尚未完成加载时一律不放行，避免页面级 fail-open。
    if (!accessStore.isAccessChecked) {
      return false;
    }
    return hasAccessByCodes(codes);
  }

  const canCreate = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.adminManage,
      SYSTEM_PERMISSION_CODES.adminCreate,
    ]),
  );
  const canEdit = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.adminManage,
      SYSTEM_PERMISSION_CODES.adminUpdate,
    ]),
  );
  const canBan = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.adminManage,
      SYSTEM_PERMISSION_CODES.adminDisable,
    ]),
  );
  const canResetPwd = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.adminManage,
      SYSTEM_PERMISSION_CODES.adminResetPwd,
    ]),
  );
  const canForceLogout = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.adminManage,
      SYSTEM_PERMISSION_CODES.adminForceLogout,
    ]),
  );
  const canSetRoles = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.adminManage,
      SYSTEM_PERMISSION_CODES.adminSetRoles,
    ]),
  );
  const canViewSessions = computed(() =>
    hasAnyCode([
      SYSTEM_PERMISSION_CODES.adminManage,
      SYSTEM_PERMISSION_CODES.adminSessionView,
    ]),
  );

  const adminStatusEnum = useEnum('admin_status');
  const isSystemEnum = useEnum('is_system');
  const sessionStatusEnum = useEnum('admin_session_status');
  const statusOptions = adminStatusEnum.selectOptions;
  const isSystemOptions = isSystemEnum.selectOptions;
  const sessionStatusOptions = sessionStatusEnum.selectOptions;
  void isSystemEnum.refresh();

  function getStatusValueByState(state: 'active' | 'disabled') {
    const value = adminStatusEnum.getValueByExtra('state', state);
    return typeof value === 'number' ? value : undefined;
  }

  function isStatusActive(value: null | number | undefined) {
    return adminStatusEnum.hasExtraValue(value, 'state', 'active');
  }

  function isStatusDisabled(value: null | number | undefined) {
    return adminStatusEnum.hasExtraValue(value, 'state', 'disabled');
  }

  function getStatusLabel(value: null | number | undefined) {
    const fallback = isStatusActive(value)
      ? $t('system.admin.statusActive')
      : isStatusDisabled(value)
        ? $t('system.admin.statusDisabled')
        : formatEmpty(value);
    return adminStatusEnum.getLabel(value ?? undefined, fallback);
  }

  // --- 数据加载 ---
  async function loadRoles() {
    const pageSize = 100;
    let page = 1;
    let total = 0;
    const roleMap = new Map<number, RoleItem>();

    do {
      const result = await getRoleList({
        page,
        pageSize,
      });
      total = result.total;
      result.items.forEach((role) => {
        roleMap.set(role.id, role);
      });
      if (result.items.length === 0) {
        break;
      }
      page += 1;
    } while (roleMap.size < total);

    return Array.from(roleMap.values());
  }

  return {
    canCreate,
    canEdit,
    canBan,
    canResetPwd,
    canForceLogout,
    canSetRoles,
    canViewSessions,
    isSystemOptions,
    sessionStatusOptions,
    statusOptions,
    getStatusLabel,
    isStatusActive,
    isStatusDisabled,
    getActiveStatusValue: () => getStatusValueByState('active'),
    getDisabledStatusValue: () => getStatusValueByState('disabled'),
    loadRoles,
  };
}
