<script lang="ts" setup>
import type { DictionaryItem } from '#/api';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Select,
  Button,
  Input,
  Popover,
  Space,
  Tag,
} from 'ant-design-vue';

import {
  DxActionColumn,
  DxDateTime,
  DxFormDrawer,
  DxMetaTag,
  DxSchemaForm,
  DxVxeGrid,
} from '#/components/common';
import { $t } from '#/locales';

import { useDictionaryItemsPage } from './composables/useDictionaryItemsPage';

const gridRef = ref<InstanceType<typeof DxVxeGrid>>();
const MAX_VISIBLE_LABEL_TAGS = 2;

const {
  addTranslation,
  canCreateItem,
  canDeleteItem,
  canUpdateItem,
  catalogMeta,
  goBack,
  gridOptions,
  initialize,
  itemDrawerOpen,
  itemDrawerSaving,
  itemDrawerTitle,
  itemFormResetValues,
  itemFormRef,
  itemFormSchema,
  itemPrimaryLocale,
  localeOptions,
  onItemFormValuesChange,
  openCreateItem,
  openEditItem,
  removeTranslation,
  removeItem,
  statusOptions,
  submitItem,
  translations,
} = useDictionaryItemsPage(gridRef);

void itemFormRef;

function getLabelI18nEntries(row: DictionaryItem) {
  return Object.entries(row.labelI18n || {});
}

function getVisibleLabelI18nEntries(row: DictionaryItem) {
  return getLabelI18nEntries(row).slice(0, MAX_VISIBLE_LABEL_TAGS);
}

function getHiddenLabelI18nEntries(row: DictionaryItem) {
  return getLabelI18nEntries(row).slice(MAX_VISIBLE_LABEL_TAGS);
}

onMounted(() => {
  void initialize();
});
</script>

<template>
  <Page
    auto-content-height
    :description="$t('system.dictionary.description')"
    :title="$t('system.dictionary.itemPageTitle')"
  >
    <div class="dictionary-items-page">
      <div class="dictionary-items-page__header">
        <Button @click="goBack">{{ $t('system.dictionary.backToCatalogs') }}</Button>
      </div>

      <section class="dictionary-items-page__content">
        <DxVxeGrid ref="gridRef" :grid-options="gridOptions">
          <template #form-before>
            <Alert
              v-if="catalogMeta"
              class="catalog-alert"
              show-icon
              type="info"
            >
              <template #message>
                <Space wrap>
                  <span>{{ catalogMeta.name }}</span>
                  <Tag color="blue">{{ catalogMeta.key }}</Tag>
                  <Tag>{{ catalogMeta.groupName }}</Tag>
                </Space>
              </template>
              <template #description>
                {{
                  catalogMeta.description ||
                  $t('system.dictionary.emptyDescription')
                }}
              </template>
            </Alert>
          </template>

          <template #toolbar-actions>
            <Button v-if="canCreateItem" type="primary" @click="openCreateItem">
              {{ $t('system.dictionary.actions.addItem') }}
            </Button>
          </template>

          <template #status="{ row }">
            <DxMetaTag
              :options="statusOptions"
              :value="(row as DictionaryItem).status"
            />
          </template>

          <template #labelI18n="{ row }">
            <div class="dictionary-items-page__tags dictionary-items-page__tags--compact">
              <Tag
                v-for="entry in getVisibleLabelI18nEntries(row as DictionaryItem)"
                :key="entry[0]"
                class="dictionary-items-page__tag"
              >
                {{ entry[0] }}: {{ entry[1] }}
              </Tag>
              <Popover
                v-if="getHiddenLabelI18nEntries(row as DictionaryItem).length"
                placement="topLeft"
                trigger="hover"
              >
                <template #content>
                  <div class="dictionary-items-page__tags dictionary-items-page__tags--popover">
                    <Tag
                      v-for="entry in getLabelI18nEntries(row as DictionaryItem)"
                      :key="entry[0]"
                    >
                      {{ entry[0] }}: {{ entry[1] }}
                    </Tag>
                  </div>
                </template>
                <Tag class="dictionary-items-page__tag dictionary-items-page__tag--more">
                  +{{ getHiddenLabelI18nEntries(row as DictionaryItem).length }}
                </Tag>
              </Popover>
            </div>
          </template>

          <template #updatedAt="{ row }">
            <DxDateTime :value="(row as DictionaryItem).updatedAt" />
          </template>

          <template #actions="{ row }">
            <DxActionColumn
              :actions="[
                {
                  key: 'edit',
                  label: $t('system.dictionary.actions.editItem'),
                  hidden: !canUpdateItem,
                  onClick: () => openEditItem(row as DictionaryItem),
                },
                {
                  key: 'delete',
                  label: $t('system.dictionary.actions.deleteItem'),
                  danger: true,
                  hidden: !canDeleteItem,
                  confirmTitle: $t('system.dictionary.confirmDeleteItem'),
                  onClick: () => removeItem(row as DictionaryItem),
                },
              ]"
              :max-visible="2"
            />
          </template>
        </DxVxeGrid>
      </section>

      <DxFormDrawer
        v-model:open="itemDrawerOpen"
        :saving="itemDrawerSaving"
        :title="itemDrawerTitle"
        width="640px"
        @close="itemDrawerOpen = false"
        @save="submitItem"
      >
        <DxSchemaForm
          ref="itemFormRef"
          :reset-values="itemFormResetValues"
          :handle-values-change="onItemFormValuesChange"
          :schema="itemFormSchema"
        />
        <div class="dictionary-items-page__translations">
          <div class="dictionary-items-page__translation-title">
            {{ $t('system.dictionary.itemFields.translations') }}
          </div>
          <div
            v-for="translation in translations"
            :key="translation.id"
            class="dictionary-items-page__translation-row"
          >
            <div class="dictionary-items-page__translation-field">
              <div class="dictionary-items-page__translation-field-label">
                {{ $t('system.dictionary.itemFields.translationLocaleLabel') }}
              </div>
              <Select
                v-model:value="translation.locale"
                class="dictionary-items-page__translation-locale"
                :options="localeOptions"
                :placeholder="$t('system.dictionary.itemFields.translationLocalePlaceholder')"
                show-search
              />
            </div>
            <div class="dictionary-items-page__translation-field">
              <div class="dictionary-items-page__translation-field-label">
                {{ $t('system.dictionary.itemFields.translationLabelLabel') }}
              </div>
              <Input
                v-model:value="translation.label"
                :placeholder="$t('system.dictionary.itemFields.translationLabelPlaceholder')"
              />
            </div>
            <Button danger type="text" @click="removeTranslation(translation.id)">
              {{ $t('system.dictionary.actions.removeTranslation') }}
            </Button>
          </div>
          <div class="dictionary-items-page__translation-tip">
            {{
              $t('system.dictionary.translationTip', {
                locale: itemPrimaryLocale || 'zh-CN',
              })
            }}
          </div>
          <Button block type="dashed" @click="addTranslation">
            {{ $t('system.dictionary.actions.addTranslation') }}
          </Button>
        </div>
      </DxFormDrawer>
    </div>
  </Page>
</template>

<style scoped>
.dictionary-items-page {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 16px;
}

.catalog-alert {
  margin-bottom: 16px;
}

.dictionary-items-page__header {
  display: flex;
  justify-content: flex-start;
}

.dictionary-items-page__content {
  min-height: 0;
  flex: 1;
}

.dictionary-items-page__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dictionary-items-page__tags--compact {
  flex-wrap: nowrap;
  align-items: center;
  overflow: hidden;
}

.dictionary-items-page__tags--popover {
  max-width: 320px;
}

.dictionary-items-page__tag {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dictionary-items-page__tag--more {
  cursor: pointer;
  flex: none;
}

.dictionary-items-page__translations {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dictionary-items-page__translation-title {
  color: var(--ant-color-text, rgb(0 0 0 / 88%));
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5714285714;
}

.dictionary-items-page__translation-row {
  display: grid;
  grid-template-columns: minmax(160px, 180px) minmax(0, 1fr) auto;
  gap: 12px;
  align-items: end;
}

.dictionary-items-page__translation-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.dictionary-items-page__translation-field-label {
  color: var(--ant-color-text-tertiary, rgb(0 0 0 / 45%));
  font-size: 12px;
  line-height: 18px;
}

.dictionary-items-page__translation-locale {
  width: 100%;
}

.dictionary-items-page__translation-tip {
  color: rgb(0 0 0 / 45%);
  font-size: 12px;
  line-height: 20px;
}
</style>
