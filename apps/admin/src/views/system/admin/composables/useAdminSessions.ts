import type { AdminSessionResponse } from '#/api';
import type { TableProps } from 'ant-design-vue';

import { computed, ref, shallowRef } from 'vue';

import { message } from 'ant-design-vue';

import { getAdminSessionsApi, revokeAdminSessionApi } from '#/api';
import { $t } from '#/locales';

export function useAdminSessions(onRevokeSuccess?: () => void) {
  const sessionsVisible = ref(false);
  const sessionsLoading = ref(false);
  const adminSessions = shallowRef<AdminSessionResponse[]>([]);
  const currentAdminId = ref<number | string | null>(null);

  // 打开会话抽屉
  const openSessions = async (adminId: number | string) => {
    currentAdminId.value = adminId;
    sessionsVisible.value = true;
    await fetchSessions();
  };

  // 关闭会话抽屉
  const closeSessions = () => {
    sessionsVisible.value = false;
    currentAdminId.value = null;
    adminSessions.value = [];
  };

  // 获取会话数据
  const fetchSessions = async () => {
    if (!currentAdminId.value) return;
    try {
      sessionsLoading.value = true;
      const data = await getAdminSessionsApi(currentAdminId.value);
      adminSessions.value = data || [];
    } catch (error) {
      console.error('Failed to fetch admin sessions:', error);
    } finally {
      sessionsLoading.value = false;
    }
  };

  // 踢下线
  const handleRevokeSession = async (sessionId: string) => {
    if (!currentAdminId.value) return;
    try {
      await revokeAdminSessionApi(currentAdminId.value, sessionId);
      message.success($t('system.admin.session.revokeSuccess'));
      await fetchSessions(); // 刷新本地列表
      if (onRevokeSuccess) {
        onRevokeSuccess();
      }
    } catch (error) {
      console.error('Failed to revoke session:', error);
    }
  };

  // 表格列配置
  const sessionColumns = computed((): TableProps['columns'] => [
    {
      dataIndex: 'clientType',
      key: 'clientType',
      title: $t('system.admin.session.clientId'),
    },
    {
      dataIndex: 'location',
      key: 'location',
      title: $t('system.admin.session.location'),
    },
    {
      dataIndex: 'lastSeenAt',
      key: 'lastSeenAt',
      title: $t('system.admin.session.lastSeen'),
    },
    {
      dataIndex: 'status',
      key: 'status',
      title: $t('system.menu.columns.status'),
      width: 100,
    },
    {
      key: 'actions',
      title: $t('system.menu.columns.actions'),
      width: 100,
      fixed: 'right',
    },
  ]);

  return {
    sessionsVisible,
    sessionsLoading,
    adminSessions,
    sessionColumns,
    openSessions,
    closeSessions,
    fetchSessions,
    handleRevokeSession,
  };
}
