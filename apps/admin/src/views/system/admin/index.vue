<script lang="ts" setup>
import type { AdminListItem, RoleItem } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatEmpty } from '@vben/utils';

import { Button, Drawer, message, Space, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  forceLogoutAdmin,
  getAdminList,
  updateAdminStatus,
} from '#/api';
import {
  DxActionColumn,
  DxDateTime,
  DxFormDrawer,
  DxFormModal,
  DxMetaTag,
  DxSchemaForm,
  DxVxeGrid,
} from '#/components/common';
import { $t } from '#/locales';

import { useAdminForm } from './composables/useAdminForm';
import { useAdminList } from './composables/useAdminList';
import { useAdminSessions } from './composables/useAdminSessions';
import { useBanReason } from './composables/useBanReason';
import { useResetPassword } from './composables/useResetPassword';
import { useSetRoles } from './composables/useSetRoles';

type VbenVxeGridProps = Parameters<typeof useVbenVxeGrid>[0];

// --- 角色列表（编辑/分配共用）---
const allRoles = ref<RoleItem[]>([]);
const gridRef = ref<InstanceType<typeof DxVxeGrid>>();

// --- 列表 composable ---
const {
  canCreate,
  canEdit,
  canBan,
  canResetPwd,
  canForceLogout,
  canSetRoles,
  canViewSessions,
  isSystemOptions,
  statusOptions,
  isStatusActive,
  isStatusDisabled,
  sessionStatusOptions,
  getActiveStatusValue,
  getDisabledStatusValue,
  loadRoles,
} = useAdminList(); // loadAdminList is now managed by grid proxy

const roleOptions = computed(() =>
  allRoles.value.map((role) => ({
    label: `${formatEmpty(role.name)} (${formatEmpty(role.code)})`,
    value: role.id,
  })),
);

// Mock load map for original composables that expected a custom load function
const gridReload = async () => {
  await gridRef.value?.gridApi?.reload();
};

// --- 新增/编辑 Drawer composable ---
const {
  drawerVisible,
  drawerSaving,
  drawerFormRef,
  drawerFormResetValues,
  drawerSchema,
  drawerTitle,
  openCreate,
  openEdit,
  onSubmitAdmin,
  onCloseDrawer,
} = useAdminForm(gridReload, roleOptions);

void drawerFormRef;

// --- 重置密码 composable ---
const {
  resetPwdVisible,
  resetPwdSaving,
  resetPwdFormRef,
  resetPwdFormResetValues,
  resetPwdSchema,
  resetPwdUsername,
  closeResetPassword,
  openResetPassword,
  onSubmitResetPassword,
} = useResetPassword();

void resetPwdFormRef;

// --- 角色分配 composable ---
const {
  setRolesVisible,
  setRolesSaving,
  setRolesFormRef,
  setRolesFormResetValues,
  setRolesSchema,
  closeSetRoles,
  openSetRoles,
  onSubmitSetRoles,
} = useSetRoles(gridReload, roleOptions);

void setRolesFormRef;

// --- 在线会话管理 composable ---
const {
  sessionsVisible,
  sessionsLoading,
  adminSessions,
  openSessions,
  closeSessions,
  handleRevokeSession,
} = useAdminSessions(gridReload);

// --- 封禁/解封/强制下线（轻量操作，不单独提 composable）---
const {
  banModalOpen,
  banModalSaving,
  banFormRef,
  banFormResetValues,
  banFormSchema,
  openBanModal,
  closeBanModal,
  submitBan,
  targetAdmin,
} = useBanReason(gridReload);

void banFormRef;

async function onUnban(record: AdminListItem) {
  const nextStatus = getActiveStatusValue();
  if (nextStatus === undefined) {
    message.error($t('system.admin.statusActive'));
    return;
  }
  try {
    await updateAdminStatus(record.id, { status: nextStatus });
    message.success($t('system.admin.unbanSuccess'));
    await gridReload();
  } catch (error) {
    console.error('Failed to unban admin:', error);
  }
}

async function onForceLogout(record: AdminListItem) {
  try {
    await forceLogoutAdmin(record.id);
    message.success($t('system.admin.forceLogoutSuccess'));
    await gridReload();
  } catch (error) {
    console.error('Failed to force logout admin:', error);
  }
}

async function ensureRolesLoaded() {
  if (allRoles.value.length > 0) {
    return;
  }
  allRoles.value = await loadRoles();
}

async function handleOpenCreate() {
  await ensureRolesLoaded();
  openCreate();
}

async function handleOpenEdit(record: AdminListItem) {
  await ensureRolesLoaded();
  openEdit(record);
}

async function handleOpenSetRoles(record: AdminListItem) {
  await ensureRolesLoaded();
  openSetRoles(record);
}

const gridOptions = computed<VbenVxeGridProps>(() => ({
  gridOptions: {
    height: 'auto',
    rowConfig: { isHover: true, keyField: 'id' },
    proxyConfig: {
      autoLoad: false,
      ajax: {
        query: async (
          { page }: { page: { currentPage: number; pageSize: number } },
          formValues: { status?: number; username?: string },
        ) => {
          return await getAdminList({
            page: page.currentPage,
            pageSize: page.pageSize,
            username: formValues?.username,
            status: formValues?.status,
          });
        },
      },
    },
    toolbarConfig: {
      search: true,
      custom: true,
      refresh: true,
      zoom: true,
    },
    columns: [
      {
        type: 'seq',
        width: 60,
        fixed: 'left',
        title: $t('system.referenceData.columns.seq'),
      },
      {
        field: 'username',
        title: $t('system.admin.columns.username'),
        minWidth: 140,
        fixed: 'left',
      },
      {
        field: 'email',
        title: $t('system.admin.columns.email'),
        minWidth: 200,
      },
      {
        field: 'roles',
        title: $t('system.admin.columns.roles'),
        minWidth: 200,
        slots: { default: 'roles' },
      },
      {
        field: 'isSystem',
        title: $t('system.admin.columns.isSystem'),
        width: 120,
        titleSuffix: {
          content: $t('system.role.systemBuiltin'),
          iconStatus: 'warning',
        },
        slots: { default: 'isSystem' },
      },
      {
        field: 'status',
        title: $t('system.admin.columns.status'),
        width: 100,
        slots: { default: 'status' },
      },
      {
        field: 'lastLoginAt',
        title: $t('system.admin.columns.lastLoginAt'),
        width: 180,
        slots: { default: 'lastLoginAt' },
      },
      {
        field: 'createdAt',
        title: $t('system.admin.columns.createdAt'),
        width: 180,
        slots: { default: 'createdAt' },
      },
      {
        title: $t('system.admin.columns.actions'),
        width: 280,
        fixed: 'right',
        slots: { default: 'actions' },
      },
    ],
  },
  formOptions: {
    layout: 'inline',
    showCollapseButton: false,
    wrapperClass: 'w-full gap-4 flex-row',
    actionWrapperClass: 'ml-auto',
    commonConfig: {
      labelClass: 'w-auto',
      formItemClass: 'mb-0 flex-none',
    },
    schema: [
      {
        fieldName: 'username',
        label: $t('system.admin.columns.username'),
        component: 'Input',
        componentProps: {
          allowClear: true,
        },
      },
      {
        fieldName: 'status',
        label: $t('system.admin.columns.status'),
        component: 'Select',
        componentProps: {
          allowClear: true,
          placeholder: $t('system.admin.statusPlaceholder'),
          options: statusOptions.value,
        },
      },
    ],
  },
  separator: false,
}));

// 会话表格
const sessionGridOptions = computed<VbenVxeGridProps>(() => ({
  gridOptions: {
    data: adminSessions.value,
    loading: sessionsLoading.value,
    pagerConfig: { enabled: false },
    columns: [
      {
        field: 'clientType',
        title: $t('system.admin.session.clientId'),
        slots: { default: 'clientType' },
        minWidth: 200,
      },
      {
        field: 'location',
        title: $t('system.admin.session.location'),
        slots: { default: 'location' },
        minWidth: 150,
      },
      {
        field: 'lastSeenAt',
        title: $t('system.admin.session.lastSeen'),
        slots: { default: 'lastSeenAt' },
        width: 180,
      },
      {
        field: 'status',
        title: $t('system.menu.columns.status'),
        slots: { default: 'status' },
        width: 120,
      },
      {
        title: $t('system.menu.columns.actions'),
        width: 100,
        slots: { default: 'actions' },
        fixed: 'right',
      },
    ],
  },
}));

onMounted(async () => {
  const [rolesResult] = await Promise.allSettled([loadRoles(), gridReload()]);
  if (rolesResult.status === 'fulfilled') {
    allRoles.value = rolesResult.value;
  }
});
</script>

<template>
  <Page
    auto-content-height
    :description="$t('system.admin.description')"
    :title="$t('system.admin.title')"
  >
    <!-- VxeGrid 统包搜索、工具栏与表格数据 -->
    <DxVxeGrid ref="gridRef" :grid-options="gridOptions">
      <template #toolbar-actions>
        <Button v-if="canCreate" type="primary" @click="handleOpenCreate">
          {{ $t('system.admin.add') }}
        </Button>
      </template>
      <template #roles="{ row }">
        <Space v-if="(row as AdminListItem).roles?.length">
          <Tag
            v-for="role in (row as AdminListItem).roles"
            :key="role.id"
            color="blue"
          >
            {{ formatEmpty(role.name) }}
          </Tag>
        </Space>
        <span v-else class="text-gray-400">{{ formatEmpty(undefined) }}</span>
      </template>
      <template #isSystem="{ row }">
        <DxMetaTag
          :options="isSystemOptions"
          :value="(row as AdminListItem).isSystem"
        />
      </template>
      <template #status="{ row }">
        <DxMetaTag
          :empty-text="formatEmpty(undefined)"
          :options="statusOptions"
          :value="(row as AdminListItem).status"
        />
      </template>
      <template #lastLoginAt="{ row }">
        <DxDateTime :value="(row as AdminListItem).lastLoginAt" />
      </template>
      <template #createdAt="{ row }">
        <DxDateTime :value="(row as AdminListItem).createdAt" />
      </template>
      <template #actions="{ row }">
        <DxActionColumn
          v-if="(row as AdminListItem).isSystem"
          :actions="[
            {
              key: 'sessions',
              label: $t('system.admin.sessions'),
              disabled: !canViewSessions,
              onClick: () => {
                if (canViewSessions) openSessions((row as AdminListItem).id);
              },
            },
          ]"
        />
        <DxActionColumn
          v-else
          :max-visible="2"
          :actions="[
            {
              key: 'edit',
              label: $t('system.admin.edit'),
              hidden: !canEdit,
              onClick: () => handleOpenEdit(row as AdminListItem),
            },
            {
              key: 'setRoles',
              label: $t('system.admin.setRoles'),
              hidden: !canSetRoles,
              onClick: () => handleOpenSetRoles(row as AdminListItem),
            },
            {
              key: 'sessions',
              label: $t('system.admin.sessions'),
              hidden: !canViewSessions,
              onClick: () => openSessions((row as AdminListItem).id),
            },
            {
              key: 'reset',
              label: $t('system.admin.resetPassword'),
              hidden: !canResetPwd,
              onClick: () => openResetPassword(row as AdminListItem),
            },
            {
              key: 'resetTotp',
              label: $t('system.admin.resetTotp'),
              hidden: true,
              confirmTitle: $t('system.admin.confirmResetTotp'),
              onClick: () => {},
            },
            {
              key: 'ban',
              label: $t('system.admin.ban'),
              hidden: !canBan || !isStatusActive((row as AdminListItem).status),
              danger: true,
              onClick: () => openBanModal(row as AdminListItem),
            },
            {
              key: 'unban',
              label: $t('system.admin.unban'),
              hidden:
                !canBan || !isStatusDisabled((row as AdminListItem).status),
              confirmTitle: $t('system.admin.confirmUnban'),
              onClick: () => onUnban(row as AdminListItem),
            },
            {
              key: 'logout',
              label: $t('system.admin.forceLogout'),
              hidden: !canForceLogout,
              confirmTitle: $t('system.admin.confirmForceLogout'),
              onClick: () => onForceLogout(row as AdminListItem),
            },
          ]"
        />
      </template>
    </DxVxeGrid>

    <!-- 新增/编辑 Drawer -->
    <DxFormDrawer
      v-model:open="drawerVisible"
      :saving="drawerSaving"
      :title="drawerTitle"
      @close="onCloseDrawer"
      @save="onSubmitAdmin"
    >
      <DxSchemaForm
        ref="drawerFormRef"
        :reset-values="drawerFormResetValues"
        :schema="drawerSchema"
      />
    </DxFormDrawer>

    <DxFormModal
      v-model:open="banModalOpen"
      :saving="banModalSaving"
      :title="`${$t('system.admin.banModalTitle')}${targetAdmin ? ` - ${targetAdmin.username}` : ''}`"
      @cancel="closeBanModal"
      @ok="submitBan(getDisabledStatusValue())"
    >
      <div class="space-y-4 py-4">
        <div class="text-sm text-gray-500">
          {{ $t('system.admin.banModalDescription') }}
        </div>
        <DxSchemaForm
          ref="banFormRef"
          :reset-values="banFormResetValues"
          :schema="banFormSchema"
        />
      </div>
    </DxFormModal>

    <!-- 重置密码 Modal -->
    <DxFormModal
      v-model:open="resetPwdVisible"
      :saving="resetPwdSaving"
      :title="`${$t('system.admin.resetPasswordTitle')} - ${resetPwdUsername}`"
      @cancel="closeResetPassword"
      @ok="onSubmitResetPassword"
    >
      <DxSchemaForm
        ref="resetPwdFormRef"
        :reset-values="resetPwdFormResetValues"
        :schema="resetPwdSchema"
      />
    </DxFormModal>

    <!-- 分配角色 Modal -->
    <DxFormModal
      v-model:open="setRolesVisible"
      :saving="setRolesSaving"
      :title="$t('system.admin.setRolesTitle')"
      @cancel="closeSetRoles"
      @ok="onSubmitSetRoles"
    >
      <DxSchemaForm
        ref="setRolesFormRef"
        :reset-values="setRolesFormResetValues"
        :schema="setRolesSchema"
      />
    </DxFormModal>

    <!-- 在线会话管理 Drawer -->
    <Drawer
      :open="sessionsVisible"
      :title="$t('system.admin.session.title')"
      :width="800"
      destroy-on-close
      @close="closeSessions"
    >
      <DxVxeGrid :grid-options="sessionGridOptions" :wrapper="false">
        <template #clientType="{ row }">
          <div class="font-medium">{{ row.clientType }}</div>
          <div class="text-xs text-gray-500">{{ row.ipAddress }}</div>
        </template>
        <template #location="{ row }">
          <div v-if="row.countryCode || row.regionLabel">
            <span>{{ row.countryCode }}</span>
            <span v-if="row.countryCode && row.regionLabel"> - </span>
            <span>{{ row.regionLabel }}</span>
          </div>
          <div v-else class="text-gray-400">Unknown</div>
        </template>
        <template #lastSeenAt="{ row }">
          <DxDateTime :value="row.lastSeenAt || row.createdAt" />
        </template>
        <template #status="{ row }">
          <DxMetaTag :options="sessionStatusOptions" :value="row.status" />
          <Tag v-if="row.isCurrent" class="ml-2" color="blue">
            {{ $t('system.admin.session.isCurrent') }}
          </Tag>
        </template>
        <template #actions="{ row }">
          <DxActionColumn
            :actions="[
              {
                key: 'revoke',
                label: $t('system.admin.session.revoke'),
                hidden: row.status !== 'active',
                danger: true,
                confirmTitle: $t('system.admin.session.revokeConfirm'),
                onClick: () => handleRevokeSession(row.sessionId),
              },
            ]"
          />
        </template>
      </DxVxeGrid>
    </Drawer>
  </Page>
</template>
