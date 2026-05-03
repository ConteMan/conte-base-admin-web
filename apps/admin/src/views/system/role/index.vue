<script lang="ts" setup>
import type { RoleItem } from '#/api';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatEmpty } from '@vben/utils';

import { Button, Tree, Typography, message } from 'ant-design-vue';

import { deleteRole } from '#/api';
import {
  DxActionColumn,
  DxDateTime,
  DxFormModal,
  DxMetaTag,
  DxSchemaForm,
  DxVxeGrid,
} from '#/components/common';
import { $t } from '#/locales';

import { useRoleForm } from './composables/useRoleForm';
import { useRoleList } from './composables/useRoleList';
import { useRolePermissions } from './composables/useRolePermissions';

const gridRef = ref<InstanceType<typeof DxVxeGrid>>();

const {
  canAssign,
  canCreate,
  canDelete,
  canEdit,
  isSystemOptions,
  gridOptions,
  initialize,
  loadRoleList,
  permissionTreeData,
} = useRoleList(gridRef);

  const {
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
} = useRoleForm(loadRoleList);

const {
  activeRole,
  checkedMenuKeys,
  onClosePermissionModal,
  onPermissionCheck,
  onSubmitPermissions,
  openPermissionModal,
  permissionSaving,
  permissionVisible,
} = useRolePermissions(loadRoleList);

void roleFormRef;

async function onDeleteRole(record: RoleItem) {
  await deleteRole(record.id);
  message.success($t('system.role.deleteSuccess'));
  await loadRoleList();
}

onMounted(() => {
  void initialize();
});
</script>

<template>
  <Page
    auto-content-height
    :description="$t('system.role.description')"
    :title="$t('system.role.title')"
  >
    <DxVxeGrid ref="gridRef" :grid-options="gridOptions">
      <template #toolbar-actions>
        <Button v-if="canCreate" type="primary" @click="openCreateRole">
          {{ $t('system.role.add') }}
        </Button>
      </template>

      <template #description="{ row }">
        <Typography.Text v-if="(row as RoleItem).description">
          {{ (row as RoleItem).description }}
        </Typography.Text>
        <Typography.Text v-else type="secondary">
          {{ formatEmpty(undefined) }}
        </Typography.Text>
      </template>

      <template #isSystem="{ row }">
        <DxMetaTag
          :options="isSystemOptions"
          :value="(row as RoleItem).isSystem"
        />
      </template>

      <template #createdAt="{ row }">
        <DxDateTime :value="(row as RoleItem).createdAt" />
      </template>

      <template #actions="{ row }">
        <DxActionColumn
          :actions="[
            {
              key: 'assign',
              label: $t('system.role.assignPermission'),
              hidden: !canAssign,
              onClick: () => openPermissionModal(row as RoleItem),
            },
            {
              key: 'edit',
              label: $t('system.role.edit'),
              hidden: !canEdit,
              onClick: () => openEditRole(row as RoleItem),
            },
            {
              key: 'delete',
              label: $t('system.role.delete'),
              danger: true,
              hidden: !canDelete || !!(row as RoleItem).isSystem,
              confirmTitle: $t('system.role.confirmDelete'),
              confirmOkText: $t('system.role.delete'),
              confirmCancelText: $t('system.role.cancelText'),
              onClick: () => onDeleteRole(row as RoleItem),
            },
          ]"
          :max-visible="3"
        />
      </template>
    </DxVxeGrid>

    <DxFormModal
      :open="roleFormVisible"
      :saving="roleSaving"
      :title="isEditing ? $t('system.role.editTitle') : $t('system.role.createTitle')"
      :save-text="$t('system.role.save')"
      @cancel="onCloseRoleModal"
    @ok="onSubmitRole"
    @update:open="roleFormVisible = $event"
    >
      <DxSchemaForm
        ref="roleFormRef"
        :reset-values="roleFormResetValues"
        :schema="roleFormSchema"
      />
    </DxFormModal>

    <DxFormModal
      :open="permissionVisible"
      :saving="permissionSaving"
      :title="`${$t('system.role.assignPermissionTitle')}${activeRole ? ` - ${activeRole.name}` : ''}`"
      :save-text="$t('system.role.savePermission')"
      width="720px"
      @cancel="onClosePermissionModal"
      @ok="onSubmitPermissions"
      @update:open="permissionVisible = $event"
    >
      <Tree
        checkable
        :checked-keys="checkedMenuKeys"
        :tree-data="permissionTreeData"
        default-expand-all
        @check="onPermissionCheck"
      />
    </DxFormModal>
  </Page>
</template>
