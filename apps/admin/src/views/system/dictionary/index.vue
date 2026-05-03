<script lang="ts" setup>
import type { DictionaryCatalogItem } from '#/api';

import { onMounted, ref } from 'vue';
import type { ComponentPublicInstance } from 'vue';

import { Page } from '@vben/common-ui';

import {
  DxActionColumn,
  DxDateTime,
  DxFormDrawer,
  DxMetaTag,
  DxSchemaForm,
  DxVxeGrid,
} from '#/components/common';
import { $t } from '#/locales';

import { useDictionaryPage } from './composables/useDictionaryPage';

const gridRef = ref<InstanceType<typeof DxVxeGrid>>();

const {
  Button,
  Empty,
  IconifyIcon,
  Popover,
  activeGroupId,
  canCreateCatalog,
  canCreateGroup,
  canManageItems,
  canUpdateCatalog,
  canUpdateGroup,
  catalogDrawerOpen,
  catalogDrawerSaving,
  catalogDrawerTitle,
  catalogFormResetValues,
  catalogFormRef,
  catalogFormSchema,
  goToItems,
  gridOptions,
  groupDrawerOpen,
  groupDrawerSaving,
  groupDrawerTitle,
  groupFormResetValues,
  groupFormRef,
  groupFormSchema,
  handleGroupChange,
  initialize,
  loadingGroups,
  openCreateCatalog,
  openCreateGroup,
  openEditCatalog,
  openEditGroup,
  statusOptions,
  submitCatalog,
  submitGroup,
  visibleGroups,
} = useDictionaryPage(gridRef);

function setGroupFormRef(instance: ComponentPublicInstance | Element | null) {
  groupFormRef.value = instance as InstanceType<typeof DxSchemaForm> | null;
}

function setCatalogFormRef(instance: ComponentPublicInstance | Element | null) {
  catalogFormRef.value = instance as InstanceType<typeof DxSchemaForm> | null;
}

onMounted(() => {
  void initialize();
});
</script>

<template>
  <Page
    auto-content-height
    :description="$t('system.dictionary.description')"
    :title="$t('system.dictionary.title')"
  >
    <div class="dictionary-page">
      <aside class="dictionary-sidebar">
        <div class="dictionary-sidebar__header">
          <div class="dictionary-sidebar__title">
            {{ $t('system.dictionary.sidebarTitle') }}
          </div>
          <Button
            v-if="canCreateGroup"
            class="dictionary-sidebar__add-btn"
            shape="circle"
            type="primary"
            @click="openCreateGroup"
          >
            <template #icon>
              <IconifyIcon icon="lucide:plus" />
            </template>
          </Button>
        </div>

        <div class="dictionary-sidebar__list">
          <template v-if="visibleGroups.length">
            <button
              v-for="group in visibleGroups"
              :key="group.id"
              class="dictionary-sidebar__item"
              :class="{ 'dictionary-sidebar__item--active': group.id === activeGroupId }"
              type="button"
              @click="handleGroupChange(group.id)"
            >
              <span class="dictionary-sidebar__item-meta">
                <span class="dictionary-sidebar__item-name">{{ group.name }}</span>
                <span class="dictionary-sidebar__item-code">{{ group.key }}</span>
              </span>

              <Popover placement="rightTop" trigger="hover">
                <template #content>
                  <div class="dictionary-sidebar__menu">
                    <Button
                      v-if="canUpdateGroup"
                      size="small"
                      type="text"
                      @click.stop="openEditGroup(group)"
                    >
                      <template #icon>
                        <IconifyIcon icon="lucide:pencil-line" />
                      </template>
                      {{ $t('system.dictionary.actions.edit') }}
                    </Button>
                  </div>
                </template>
                <button class="dictionary-sidebar__more" type="button" @click.stop>
                  <IconifyIcon icon="lucide:ellipsis" />
                </button>
              </Popover>
            </button>
          </template>
          <div v-else class="dictionary-sidebar__empty">
            <Empty
              :description="$t('system.dictionary.emptyGroups')"
              :image="Empty.PRESENTED_IMAGE_SIMPLE"
            />
          </div>
        </div>
      </aside>

      <section class="dictionary-content">
        <DxVxeGrid ref="gridRef" :grid-options="gridOptions">
          <template #toolbar-actions>
            <Button
              v-if="canCreateCatalog"
              :disabled="!activeGroupId || loadingGroups"
              type="primary"
              @click="openCreateCatalog"
            >
              {{ $t('system.dictionary.actions.addCatalog') }}
            </Button>
          </template>

          <template #status="{ row }">
            <DxMetaTag
              :options="statusOptions"
              :value="(row as DictionaryCatalogItem).status"
            />
          </template>

          <template #updatedAt="{ row }">
            <DxDateTime :value="(row as DictionaryCatalogItem).updatedAt" />
          </template>

          <template #actions="{ row }">
            <DxActionColumn
              :actions="[
                {
                  key: 'items',
                  label: $t('system.dictionary.actions.manageItems'),
                  hidden: !canManageItems,
                  onClick: () => goToItems(row as DictionaryCatalogItem),
                },
                {
                  key: 'edit',
                  label: $t('system.dictionary.actions.editCatalog'),
                  hidden: !canUpdateCatalog,
                  onClick: () => openEditCatalog(row as DictionaryCatalogItem),
                },
              ]"
              :max-visible="2"
            />
          </template>
        </DxVxeGrid>
      </section>
    </div>

    <DxFormDrawer
      v-model:open="groupDrawerOpen"
      :saving="groupDrawerSaving"
      :title="groupDrawerTitle"
      @close="groupDrawerOpen = false"
      @save="submitGroup"
    >
      <DxSchemaForm
        :ref="setGroupFormRef"
        :reset-values="groupFormResetValues"
        :schema="groupFormSchema"
      />
    </DxFormDrawer>

    <DxFormDrawer
      v-model:open="catalogDrawerOpen"
      :saving="catalogDrawerSaving"
      :title="catalogDrawerTitle"
      @close="catalogDrawerOpen = false"
      @save="submitCatalog"
    >
      <DxSchemaForm
        :ref="setCatalogFormRef"
        :reset-values="catalogFormResetValues"
        :schema="catalogFormSchema"
      />
    </DxFormDrawer>
  </Page>
</template>

<style scoped>
.dictionary-page {
  display: flex;
  gap: 16px;
  height: 100%;
  min-height: 0;
}

.dictionary-sidebar {
  display: flex;
  width: 260px;
  min-height: 0;
  flex-shrink: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  border-radius: var(--radius);
  background: var(--ant-color-bg-container, #fff);
}

.dictionary-sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  padding: 14px 16px;
}

.dictionary-sidebar__title {
  font-weight: 600;
}

.dictionary-sidebar__add-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
}

.dictionary-sidebar__add-btn :deep(svg) {
  display: block;
}

.dictionary-sidebar__list {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: auto;
}

.dictionary-sidebar__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: 0;
  border-bottom: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  background: transparent;
  padding: 14px 16px;
  border-radius: 0;
  text-align: left;
  transition: background-color 0.2s ease;
}

.dictionary-sidebar__item:hover {
  background: var(--ant-color-fill-quaternary, #fafafa);
}

.dictionary-sidebar__item--active {
  background: var(--ant-color-primary-bg, #e6f4ff);
}

.dictionary-sidebar__item-meta {
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.dictionary-sidebar__item-name {
  font-weight: 500;
}

.dictionary-sidebar__item-code {
  color: var(--ant-color-text-description, rgba(0, 0, 0, 0.45));
  font-size: 12px;
  font-weight: 400;
}

.dictionary-sidebar__more {
  display: inline-flex;
  height: 28px;
  width: 28px;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0;
  border-radius: calc(var(--radius) - 2px);
  color: var(--ant-color-text-description, rgba(0, 0, 0, 0.45));
  opacity: 0;
  transition:
    opacity 0.2s ease,
    background-color 0.2s ease;
}

.dictionary-sidebar__item:hover .dictionary-sidebar__more,
.dictionary-sidebar__item--active .dictionary-sidebar__more {
  opacity: 1;
}

.dictionary-sidebar__more:hover {
  background: var(--ant-color-fill-tertiary, #f5f5f5);
}

.dictionary-sidebar__menu {
  display: flex;
  flex-direction: column;
  min-width: 120px;
  gap: 4px;
}

.dictionary-sidebar__empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.dictionary-content {
  min-width: 0;
  min-height: 0;
  flex: 1;
}

@media (max-width: 1024px) {
  .dictionary-page {
    flex-direction: column;
  }

  .dictionary-sidebar {
    width: 100%;
  }
}
</style>
