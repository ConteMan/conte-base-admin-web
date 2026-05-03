<script lang="ts" setup>
import type { SystemSettingItem } from '#/api';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Empty, Popover, Switch } from 'ant-design-vue';

import {
  DxActionColumn,
  DxDateTime,
  DxFormDrawer,
  DxMetaTag,
  DxSchemaForm,
  DxVxeGrid,
} from '#/components/common';
import {
  ENABLED_STATUS,
  SETTING_OBJECT_TYPE_FLAG,
  SETTING_VALUE_TYPE_JSON,
} from '#/constants';
import { $t } from '#/locales';

import { useConfigPage } from './composables/useConfigPage';

const {
  activeGroupId,
  buildRowActions,
  canCreateGroup,
  canCreateSetting,
  canDeleteGroup,
  canUpdateGroup,
  canUpdateSettingValue,
  formatSettingValue,
  groupDrawerOpen,
  groupDrawerSaving,
  groupDrawerTitle,
  groupFormResetValues,
  groupFormRef,
  groupFormSchema,
  gridOptions,
  gridRef,
  handleGroupChange,
  isSystemOptions,
  configStatusEnum,
  settingObjectTypeEnum,
  openCreateGroup,
  openCreateSetting,
  openEditGroup,
  requestDeleteGroup,
  requestToggleFlag,
  settingDrawerOpen,
  settingDrawerSaving,
  settingDrawerTitle,
  settingFormResetValues,
  settingFormRef,
  settingFormSchema,
  handleSettingFormResetValuesApplied,
  submitGroup,
  submitSetting,
  togglingSettingKeys,
  visibleGroups,
} = useConfigPage();

void groupFormRef;
void settingFormRef;
void gridRef;
</script>

<template>
  <Page
    auto-content-height
    :description="$t('system.config.description')"
    :title="$t('system.config.title')"
  >
    <div class="config-page">
      <aside class="config-sidebar">
        <div class="config-sidebar__header">
          <div class="config-sidebar__title">
            {{ $t('system.config.sidebarTitle') }}
          </div>
          <Button
            v-if="canCreateGroup"
            class="config-sidebar__add-btn"
            shape="circle"
            type="primary"
            @click="openCreateGroup"
          >
            <template #icon>
              <IconifyIcon icon="lucide:plus" />
            </template>
          </Button>
        </div>

        <div class="config-sidebar__list">
          <template v-if="visibleGroups.length">
            <button
              v-for="group in visibleGroups"
              :key="group.id"
              class="config-sidebar__item"
              :class="{
                'config-sidebar__item--active': group.id === activeGroupId,
              }"
              type="button"
              @click="handleGroupChange(group.id)"
            >
              <span class="config-sidebar__item-meta">
                <span class="config-sidebar__item-name">{{ group.name }}</span>
                <span class="config-sidebar__item-code">{{ group.code }}</span>
              </span>

              <Popover placement="rightTop" trigger="hover">
                <template #content>
                  <div class="config-sidebar__menu">
                    <Button
                      v-if="canUpdateGroup"
                      size="small"
                      type="text"
                      @click.stop="openEditGroup(group)"
                    >
                      <template #icon>
                        <IconifyIcon icon="lucide:pencil-line" />
                      </template>
                      {{ $t('system.config.actions.edit') }}
                    </Button>
                    <Button
                      v-if="canDeleteGroup && !group.isSystem"
                      danger
                      size="small"
                      type="text"
                      @click.stop="requestDeleteGroup(group)"
                    >
                      <template #icon>
                        <IconifyIcon icon="lucide:trash-2" />
                      </template>
                      {{ $t('system.config.actions.delete') }}
                    </Button>
                  </div>
                </template>
                <button class="config-sidebar__more" type="button" @click.stop>
                  <IconifyIcon icon="lucide:ellipsis" />
                </button>
              </Popover>
            </button>
          </template>
          <div v-else class="config-sidebar__empty">
            <Empty
              :description="$t('system.config.emptyGroups')"
              :image="Empty.PRESENTED_IMAGE_SIMPLE"
            />
          </div>
        </div>
      </aside>

      <section class="config-content">
        <DxVxeGrid ref="gridRef" :grid-options="gridOptions">
          <template #toolbar-actions>
            <Button
              v-if="canCreateSetting"
              :disabled="!activeGroupId"
              type="primary"
              @click="openCreateSetting"
            >
              {{ $t('system.config.actions.addSetting') }}
            </Button>
          </template>

          <template #objectType="{ row }">
            <DxMetaTag
              :options="settingObjectTypeEnum.selectOptions.value"
              :value="(row as SystemSettingItem).objectType"
              type="tag"
            />
          </template>

          <template #currentValue="{ row }">
            <template
              v-if="
                (row as SystemSettingItem).objectType ===
                SETTING_OBJECT_TYPE_FLAG
              "
            >
              <Switch
                :checked="Boolean((row as SystemSettingItem).value)"
                :checked-children="$t('system.config.enabled')"
                :disabled="
                  !canUpdateSettingValue ||
                  (row as SystemSettingItem).status !== ENABLED_STATUS
                "
                :loading="
                  togglingSettingKeys.includes((row as SystemSettingItem).key)
                "
                :un-checked-children="$t('system.config.disabled')"
                @change="requestToggleFlag(row as SystemSettingItem)"
              />
            </template>
            <span
              v-else
              :class="{
                'config-value-text--json':
                  (row as SystemSettingItem).valueType ===
                  SETTING_VALUE_TYPE_JSON,
              }"
              class="config-value-text"
            >
              {{ formatSettingValue(row as SystemSettingItem) }}
            </span>
          </template>

          <template #isSystem="{ row }">
            <DxMetaTag
              :options="isSystemOptions"
              :value="(row as SystemSettingItem).isSystem"
            />
          </template>

          <template #status="{ row }">
            <DxMetaTag
              :options="configStatusEnum.selectOptions.value"
              :value="(row as SystemSettingItem).status"
              type="tag"
            />
          </template>

          <template #updatedAt="{ row }">
            <DxDateTime :value="(row as SystemSettingItem).updatedAt" />
          </template>

          <template #actions="{ row }">
            <DxActionColumn
              :actions="buildRowActions(row as SystemSettingItem)"
              :max-visible="3"
            />
          </template>
        </DxVxeGrid>
      </section>
    </div>

    <DxFormDrawer
      v-model:open="groupDrawerOpen"
      :saving="groupDrawerSaving"
      :title="groupDrawerTitle"
      width="420"
      @close="groupDrawerOpen = false"
      @save="submitGroup"
    >
      <DxSchemaForm
        ref="groupFormRef"
        :reset-values="groupFormResetValues"
        :schema="groupFormSchema"
      />
    </DxFormDrawer>

    <DxFormDrawer
      v-model:open="settingDrawerOpen"
      :saving="settingDrawerSaving"
      :title="settingDrawerTitle"
      width="640"
      @close="settingDrawerOpen = false"
      @save="submitSetting"
    >
      <DxSchemaForm
        ref="settingFormRef"
        :reset-values="settingFormResetValues"
        :schema="settingFormSchema"
        @reset-values-applied="handleSettingFormResetValuesApplied"
      />
    </DxFormDrawer>
  </Page>
</template>

<style scoped>
.config-page {
  display: flex;
  gap: 16px;
  height: 100%;
  min-height: 0;
}

.config-sidebar {
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

.config-sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  padding: 14px 16px;
}

.config-sidebar__title {
  font-weight: 600;
}

.config-sidebar__add-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
}

.config-sidebar__add-btn :deep(svg) {
  display: block;
}

.config-sidebar__list {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: auto;
}

.config-sidebar__item {
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

.config-sidebar__item:hover {
  background: var(--ant-color-fill-quaternary, #fafafa);
}

.config-sidebar__item--active {
  background: var(--ant-color-primary-bg, #e6f4ff);
}

.config-sidebar__item-meta {
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.config-sidebar__item-name {
  font-weight: 500;
}

.config-sidebar__item-code {
  color: var(--ant-color-text-description, rgba(0, 0, 0, 0.45));
  font-size: 12px;
  font-weight: 400;
}

.config-sidebar__more {
  display: inline-flex;
  height: 28px;
  width: 28px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: calc(var(--radius) - 2px);
  background: transparent;
  color: var(--ant-color-text-description, rgba(0, 0, 0, 0.45));
  opacity: 0;
  transition:
    opacity 0.2s ease,
    background-color 0.2s ease;
}

.config-sidebar__item:hover .config-sidebar__more,
.config-sidebar__item--active .config-sidebar__more {
  opacity: 1;
}

.config-sidebar__more:hover {
  background: var(--ant-color-fill-tertiary, #f5f5f5);
}

.config-sidebar__menu {
  display: flex;
  min-width: 120px;
  flex-direction: column;
  gap: 4px;
}

.config-sidebar__empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.config-content {
  min-width: 0;
  flex: 1;
}

.config-value-text {
  display: inline-block;
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
  color: var(--ant-color-text, rgba(0, 0, 0, 0.88));
  font-family: inherit;
}

.config-value-text--json {
  max-width: 440px;
}

@media (max-width: 1024px) {
  .config-page {
    flex-direction: column;
  }

  .config-sidebar {
    width: 100%;
  }
}
</style>
