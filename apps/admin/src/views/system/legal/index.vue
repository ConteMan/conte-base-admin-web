<script lang="ts" setup>
import type { LegalVersionItem } from '#/api';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Empty, Tag } from 'ant-design-vue';

import {
  DxActionColumn,
  DxDateTime,
  DxDetailDescriptions,
  DxFormDrawer,
  DxMetaTag,
  DxSchemaForm,
  DxVxeGrid,
} from '#/components/common';
import { $t } from '#/locales';

import { useLegalPage } from './composables/useLegalPage';

const gridRef = ref<InstanceType<typeof DxVxeGrid>>();

const {
  activeDocument,
  activeDocumentType,
  canEdit,
  canPublish,
  canQuery,
  closeVersionDrawer,
  documents,
  getCurrentVersionText,
  getDocumentLabel,
  getLocaleLabel,
  gridOptions,
  handleDocumentChange,
  handlePublishVersion,
  initialize,
  isReadonlyVersion,
  loadingDocuments,
  openCreateVersion,
  openEditVersion,
  openViewVersion,
  selectedVersion,
  statusOptions,
  submitVersion,
  versionDetailItems,
  versionDrawerOpen,
  versionDrawerSaving,
  versionDrawerTitle,
  versionFormRef,
  versionFormResetValues,
  versionFormSchema,
} = useLegalPage(gridRef);

void versionFormRef;

onMounted(() => {
  void initialize();
});
</script>

<template>
  <Page
    auto-content-height
    :description="$t('system.legal.description')"
    :title="$t('system.legal.title')"
  >
    <div class="legal-page">
      <aside class="legal-sidebar">
        <div class="legal-sidebar__header">
          <div class="legal-sidebar__title">
            {{ $t('system.legal.sidebarTitle') }}
          </div>
        </div>

        <div class="legal-sidebar__list">
          <template v-if="documents.length">
            <button
              v-for="item in documents"
              :key="item.type"
              class="legal-sidebar__item"
              :class="{
                'legal-sidebar__item--active': item.type === activeDocumentType,
              }"
              type="button"
              @click="handleDocumentChange(item.type)"
            >
              <div class="legal-sidebar__item-title">
                {{ getDocumentLabel(item) }}
              </div>
              <div class="legal-sidebar__item-code">
                {{ item.type }}
              </div>
              <div class="legal-sidebar__item-meta">
                {{ getCurrentVersionText(item) }}
              </div>
            </button>
          </template>
          <div v-else class="legal-sidebar__empty">
            <Empty
              :description="
                canQuery
                  ? $t('system.legal.emptyDocuments')
                  : $t('system.legal.queryPermissionRequired')
              "
              :image="Empty.PRESENTED_IMAGE_SIMPLE"
            />
          </div>
        </div>
      </aside>

      <section class="legal-content">
        <div v-if="!canQuery" class="legal-empty-state">
          <Empty
            :description="$t('system.legal.queryPermissionRequired')"
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
          />
        </div>
        <DxVxeGrid v-else ref="gridRef" :grid-options="gridOptions">
          <template #form-before>
            <div v-if="activeDocument" class="legal-summary">
              <div class="legal-summary__title">
                {{ getDocumentLabel(activeDocument) }}
              </div>
              <div class="legal-summary__tags">
                <Tag
                  v-for="item in activeDocument.currentVersions"
                  :key="item.versionId"
                  color="blue"
                >
                  {{ getLocaleLabel(item.locale) }} · {{ item.version }}
                </Tag>
                <Tag v-if="activeDocument.currentVersions.length === 0">
                  {{ $t('system.legal.noPublishedVersion') }}
                </Tag>
              </div>
            </div>
          </template>

          <template #toolbar-actions>
            <Button
              v-if="canEdit"
              :disabled="loadingDocuments || !activeDocument"
              type="primary"
              @click="openCreateVersion"
            >
              {{ $t('system.legal.actions.addVersion') }}
            </Button>
          </template>

          <template #status="{ row }">
            <DxMetaTag
              :options="statusOptions"
              :value="(row as LegalVersionItem).status"
            />
          </template>

          <template #effectiveAt="{ row }">
            <DxDateTime :value="(row as LegalVersionItem).effectiveAt" />
          </template>

          <template #publishedAt="{ row }">
            <DxDateTime :value="(row as LegalVersionItem).publishedAt" />
          </template>

          <template #updatedAt="{ row }">
            <DxDateTime :value="(row as LegalVersionItem).updatedAt" />
          </template>

          <template #actions="{ row }">
            <DxActionColumn
              :actions="[
                {
                  key: 'view',
                  label: $t('system.legal.actions.detailVersion'),
                  onClick: () => openViewVersion(row as LegalVersionItem),
                },
                {
                  key: 'edit',
                  label: $t('system.legal.actions.editVersion'),
                  hidden: !canEdit || (row as LegalVersionItem).status !== 1,
                  onClick: () => openEditVersion(row as LegalVersionItem),
                },
                {
                  key: 'publish',
                  label: $t('system.legal.actions.publishVersion'),
                  hidden: !canPublish || (row as LegalVersionItem).status !== 1,
                  confirmTitle: $t('system.legal.confirmPublish'),
                  onClick: () => handlePublishVersion(row as LegalVersionItem),
                },
              ]"
              :max-visible="3"
            />
          </template>
        </DxVxeGrid>
      </section>
    </div>

    <DxFormDrawer
      v-model:open="versionDrawerOpen"
      :saving="versionDrawerSaving"
      :title="versionDrawerTitle"
      width="820px"
      @close="closeVersionDrawer"
      @save="submitVersion"
    >
      <template v-if="isReadonlyVersion && selectedVersion">
        <div class="legal-detail">
          <DxDetailDescriptions :items="versionDetailItems">
            <template #status>
              <DxMetaTag
                :options="statusOptions"
                :value="selectedVersion.status"
              />
            </template>
            <template #effectiveAt>
              <DxDateTime :value="selectedVersion.effectiveAt" />
            </template>
            <template #publishedAt>
              <DxDateTime :value="selectedVersion.publishedAt" />
            </template>
            <template #updatedAt>
              <DxDateTime :value="selectedVersion.updatedAt" />
            </template>
          </DxDetailDescriptions>

          <section class="legal-detail__section">
            <div class="legal-detail__section-header">
              <div class="legal-detail__section-title">
                {{ $t('system.legal.fields.content') }}
              </div>
            </div>
            <div class="legal-detail__section-body">
              <div
                class="legal-detail__content"
                v-html="selectedVersion.content"
              ></div>
            </div>
          </section>
        </div>
      </template>
      <DxSchemaForm
        v-else
        ref="versionFormRef"
        :reset-values="versionFormResetValues"
        :schema="versionFormSchema"
      />
      <template v-if="isReadonlyVersion" #footer>
        <Button @click="closeVersionDrawer">
          {{ $t('system.legal.actions.close') }}
        </Button>
      </template>
    </DxFormDrawer>
  </Page>
</template>

<style scoped>
.legal-page {
  display: flex;
  gap: 16px;
  height: 100%;
  min-height: 0;
}

.legal-sidebar {
  display: flex;
  width: 280px;
  min-height: 0;
  flex-shrink: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  border-radius: var(--radius);
  background: var(--ant-color-bg-container, #fff);
}

.legal-sidebar__header {
  border-bottom: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  padding: 14px 16px;
}

.legal-sidebar__title {
  font-weight: 600;
}

.legal-sidebar__list {
  min-height: 0;
  flex: 1;
  overflow: auto;
}

.legal-sidebar__item {
  width: 100%;
  border: 0;
  border-bottom: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  background: transparent;
  padding: 14px 16px;
  text-align: left;
}

.legal-sidebar__item--active {
  background: var(--ant-color-primary-bg, #e6f4ff);
}

.legal-sidebar__item-title {
  font-weight: 600;
}

.legal-sidebar__item-code {
  margin-top: 4px;
  font-size: 12px;
  color: var(--ant-color-text-tertiary, rgba(0, 0, 0, 0.45));
}

.legal-sidebar__item-meta {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.65));
}

.legal-sidebar__empty {
  padding: 24px 16px;
}

.legal-content {
  min-width: 0;
  min-height: 0;
  flex: 1;
}

.legal-empty-state {
  display: flex;
  min-height: 320px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  border-radius: var(--radius);
  background: var(--ant-color-bg-container, #fff);
}

.legal-summary {
  margin-bottom: 16px;
  border: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  border-radius: 8px;
  padding: 12px 14px;
  background: var(--ant-color-fill-quaternary, #fafafa);
}

.legal-summary__title {
  font-weight: 600;
}

.legal-summary__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.legal-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.legal-detail__section {
  border: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--ant-color-bg-container, #fff);
}

.legal-detail__section-header {
  border-bottom: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  padding: 14px 16px;
  background: var(--ant-color-fill-quaternary, #fafafa);
}

.legal-detail__section-body {
  padding: 18px 20px 20px;
}

.legal-detail__section-title {
  font-weight: 600;
}

.legal-detail__content {
  min-height: 240px;
  color: var(--ant-color-text, rgba(0, 0, 0, 0.88));
  line-height: 1.8;
  white-space: normal;
  word-break: break-word;
}

.legal-detail__content :deep(p) {
  margin: 0 0 12px;
}

.legal-detail__content :deep(h1),
.legal-detail__content :deep(h2),
.legal-detail__content :deep(h3),
.legal-detail__content :deep(h4),
.legal-detail__content :deep(h5),
.legal-detail__content :deep(h6) {
  margin: 16px 0 12px;
  font-weight: 600;
}

.legal-detail__content :deep(ul),
.legal-detail__content :deep(ol) {
  margin: 0 0 12px;
  padding-left: 24px;
}

.legal-detail__content :deep(blockquote) {
  margin: 0 0 12px;
  border-left: 3px solid var(--ant-color-primary, #1677ff);
  padding-left: 12px;
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.65));
}

.legal-detail__content :deep(pre) {
  overflow: auto;
  border-radius: 6px;
  background: #111827;
  padding: 12px;
  color: #f9fafb;
}

.legal-detail__content :deep(a) {
  color: var(--ant-color-primary, #1677ff);
  text-decoration: underline;
}
</style>
