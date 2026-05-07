<script lang="ts" setup>
import type { MenuTreeItem } from '#/api';

import { onMounted } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatEmpty } from '@vben/utils';

import {
  Button,
  message,
  Typography,
} from 'ant-design-vue';

import { deleteMenu } from '#/api';
import {
  DxActionColumn,
  DxDateTime,
  DxFormDrawer,
  DxMetaTag,
  DxSchemaForm,
  DxVxeGrid,
} from '#/components/common';
import { $t } from '#/locales';

import { useMenuForm } from './composables/useMenuForm';
import { useMenuList } from './composables/useMenuList';

const {
  canCreate,
  canDelete,
  canEdit,
  gridOptions,
  hiddenOptions,
  loadMenus,
  menuTypeOptions,
  parentTreeData,
  statusOptions,
} = useMenuList();

const {
  formRef,
  formResetValues,
  formSchema,
  formVisible,
  isEditing,
  onCloseModal,
  onSubmit,
  openCreate,
  openEdit,
  saving,
} = useMenuForm(loadMenus, {
  hiddenOptions,
  menuTypeOptions,
  parentTreeData,
  statusOptions,
});

void formRef;

async function onDelete(record: MenuTreeItem) {
  await deleteMenu(record.id);
  message.success($t('system.menu.deleteSuccess'));
  await loadMenus();
}

onMounted(() => {
  void loadMenus();
});
</script>

<template>
  <Page
    auto-content-height
    :description="$t('system.menu.description')"
    :title="$t('system.menu.title')"
  >
    <DxVxeGrid :grid-options="gridOptions">
      <template #toolbar-actions>
        <Button v-if="canCreate" type="primary" @click="openCreate()">
          {{ $t('system.menu.add') }}
        </Button>
      </template>

      <template #routePath="{ row }">
        <Typography.Text v-if="(row as MenuTreeItem).routePath" code>
          {{ (row as MenuTreeItem).routePath }}
        </Typography.Text>
        <Typography.Text v-else type="secondary">
          {{ formatEmpty(undefined) }}
        </Typography.Text>
      </template>

      <template #permissionCode="{ row }">
        <Typography.Text v-if="(row as MenuTreeItem).permissionCode" code>
          {{ (row as MenuTreeItem).permissionCode }}
        </Typography.Text>
        <Typography.Text v-else type="secondary">
          {{ formatEmpty(undefined) }}
        </Typography.Text>
      </template>

      <template #apiPath="{ row }">
        <Typography.Text v-if="(row as MenuTreeItem).apiPath" code>
          [{{ (row as MenuTreeItem).apiMethod || 'GET' }}]
          {{ (row as MenuTreeItem).apiPath }}
        </Typography.Text>
        <Typography.Text v-else type="secondary">
          {{ formatEmpty(undefined) }}
        </Typography.Text>
      </template>

      <template #type="{ row }">
        <DxMetaTag
          :options="menuTypeOptions"
          :value="(row as MenuTreeItem).type"
        />
      </template>

      <template #icon="{ row }">
        <IconifyIcon
          v-if="(row as MenuTreeItem).icon"
          :icon="(row as MenuTreeItem).icon!"
          class="size-4"
        />
        <Typography.Text v-else type="secondary">
          {{ formatEmpty(undefined) }}
        </Typography.Text>
      </template>

      <template #isHidden="{ row }">
        <DxMetaTag
          :options="hiddenOptions"
          :value="(row as MenuTreeItem).isHidden"
        />
      </template>

      <template #isActive="{ row }">
        <DxMetaTag
          :options="statusOptions"
          :value="(row as MenuTreeItem).isActive !== false"
        />
      </template>

      <template #createdAt="{ row }">
        <DxDateTime :value="(row as MenuTreeItem).createdAt" />
      </template>

      <template #updatedAt="{ row }">
        <DxDateTime :value="(row as MenuTreeItem).updatedAt" />
      </template>

      <template #actions="{ row }">
        <DxActionColumn
          :actions="[
            {
              key: 'add-child',
              label: $t('system.menu.addChild'),
              hidden: !canCreate || (row as MenuTreeItem).type === 'button',
              onClick: () => openCreate(Number((row as MenuTreeItem).id)),
            },
            {
              key: 'edit',
              label: $t('system.menu.edit'),
              hidden: !canEdit,
              onClick: () => openEdit(row as MenuTreeItem),
            },
            {
              key: 'delete',
              label: $t('system.menu.delete'),
              danger: true,
              hidden: !canDelete,
              confirmTitle: $t('system.menu.confirmDelete'),
              confirmOkText: $t('system.menu.delete'),
              confirmCancelText: $t('system.menu.cancelText'),
              onClick: () => onDelete(row as MenuTreeItem),
            },
          ]"
          :max-visible="3"
        />
      </template>
    </DxVxeGrid>

    <DxFormDrawer
      v-model:open="formVisible"
      :saving="saving"
      :title="isEditing ? $t('system.menu.editTitle') : $t('system.menu.createTitle')"
      :save-text="$t('system.menu.save')"
      width="720px"
      @close="onCloseModal"
      @save="onSubmit"
    >
      <DxSchemaForm
        ref="formRef"
        :reset-values="formResetValues"
        :schema="formSchema"
      />
    </DxFormDrawer>
  </Page>
</template>
