<script lang="ts" setup>
import type { MetaEnumSummary } from '#/api';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatEmpty } from '@vben/utils';

import {
  Descriptions,
  Drawer,
  Empty,
  Space,
  Spin,
  Tag,
  Typography,
} from 'ant-design-vue';

import { DxActionColumn, DxVxeGrid } from '#/components/common';
import { $t } from '#/locales';

import { useEnumRegistryList } from './composables/useEnumRegistryList';

const gridRef = ref<InstanceType<typeof DxVxeGrid>>();

const {
  closeDetail,
  detailCatalog,
  detailLoading,
  detailSummary,
  detailTitle,
  detailValues,
  detailVisible,
  formatMetaValue,
  formatPairs,
  getKindOption,
  getNamespaceOption,
  getSourceOption,
  gridOptions,
  initialize,
  openDetail,
} = useEnumRegistryList(gridRef);

onMounted(() => {
  void initialize();
});
</script>

<template>
  <Page
    auto-content-height
    :description="$t('system.enumRegistry.description')"
    :title="$t('system.enumRegistry.title')"
  >
    <DxVxeGrid ref="gridRef" :grid-options="gridOptions">
      <template #description="{ row }">
        <Typography.Text
          :content="(row as MetaEnumSummary).description || formatEmpty(undefined)"
          :ellipsis="{ tooltip: true }"
        />
      </template>

      <template #namespace="{ row }">
        <Tag :color="getNamespaceOption((row as MetaEnumSummary).namespace).color">
          {{ getNamespaceOption((row as MetaEnumSummary).namespace).label }}
        </Tag>
      </template>

      <template #kind="{ row }">
        <Tag :color="getKindOption((row as MetaEnumSummary).kind).color">
          {{ getKindOption((row as MetaEnumSummary).kind).label }}
        </Tag>
      </template>

      <template #source="{ row }">
        <Tag :color="getSourceOption((row as MetaEnumSummary).source).color">
          {{ getSourceOption((row as MetaEnumSummary).source).label }}
        </Tag>
      </template>

      <template #actions="{ row }">
        <DxActionColumn
          :actions="[
            {
              key: 'detail',
              label: $t('system.enumRegistry.actions.detail'),
              onClick: () => openDetail(row as MetaEnumSummary),
            },
          ]"
          :max-visible="3"
        />
      </template>
    </DxVxeGrid>

    <Drawer
      :open="detailVisible"
      :title="detailTitle"
      width="840"
      @close="closeDetail"
    >
      <Spin :spinning="detailLoading">
        <Descriptions
          v-if="detailSummary"
          bordered
          :column="2"
          size="small"
        >
          <Descriptions.Item :label="$t('system.enumRegistry.columns.name')">
            {{ detailSummary.name }}
          </Descriptions.Item>
          <Descriptions.Item
            :label="$t('system.enumRegistry.columns.description')"
            :span="2"
          >
            {{ detailSummary.description || formatEmpty(undefined) }}
          </Descriptions.Item>
          <Descriptions.Item :label="$t('system.enumRegistry.columns.namespace')">
            <Tag :color="getNamespaceOption(detailSummary.namespace).color">
              {{ getNamespaceOption(detailSummary.namespace).label }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item :label="$t('system.enumRegistry.columns.kind')">
            <Tag :color="getKindOption(detailSummary.kind).color">
              {{ getKindOption(detailSummary.kind).label }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item :label="$t('system.enumRegistry.columns.source')">
            <Tag :color="getSourceOption(detailSummary.source).color">
              {{ getSourceOption(detailSummary.source).label }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item :label="$t('system.enumRegistry.columns.version')">
            {{ detailSummary.version }}
          </Descriptions.Item>
          <Descriptions.Item :label="$t('system.enumRegistry.columns.valueCount')">
            {{ detailSummary.valueCount }}
          </Descriptions.Item>
        </Descriptions>

        <div class="enum-registry-detail__values">
          <template v-if="detailCatalog && detailValues.length">
            <div
              v-for="item in detailValues"
              :key="String(item.value)"
              class="enum-registry-detail__value-card"
            >
              <Descriptions bordered :column="2" size="small">
                <Descriptions.Item :label="$t('system.enumRegistry.detailFields.value')">
                  <Typography.Text code>{{ formatMetaValue(item.value) }}</Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item :label="$t('system.enumRegistry.detailFields.label')">
                  {{ item.label || formatEmpty(undefined) }}
                </Descriptions.Item>
                <Descriptions.Item :label="$t('system.enumRegistry.detailFields.labelI18n')">
                  <Space v-if="formatPairs(item.labelI18n).length" wrap>
                    <Tag
                      v-for="entry in formatPairs(item.labelI18n)"
                      :key="entry.key"
                    >
                      {{ entry.key }}: {{ entry.value }}
                    </Tag>
                  </Space>
                  <Typography.Text v-else type="secondary">
                    {{ formatEmpty(undefined) }}
                  </Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item :label="$t('system.enumRegistry.detailFields.sortOrder')">
                  {{ item.sortOrder ?? formatEmpty(undefined) }}
                </Descriptions.Item>
                <Descriptions.Item
                  :label="$t('system.enumRegistry.detailFields.extra')"
                  :span="2"
                >
                  <Space v-if="formatPairs(item.extra).length" wrap>
                    <Tag
                      v-for="entry in formatPairs(item.extra)"
                      :key="entry.key"
                    >
                      {{ entry.key }}: {{ entry.value }}
                    </Tag>
                  </Space>
                  <Typography.Text v-else type="secondary">
                    {{ formatEmpty(undefined) }}
                  </Typography.Text>
                </Descriptions.Item>
              </Descriptions>
            </div>
          </template>
          <Empty
            v-else
            :description="$t('system.enumRegistry.emptyValues')"
          />
        </div>
      </Spin>
    </Drawer>
  </Page>
</template>

<style scoped>
.enum-registry-detail__values {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.enum-registry-detail__value-card {
  display: flex;
  flex-direction: column;
}
</style>
