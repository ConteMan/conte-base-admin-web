<script lang="ts" setup>
import type { ReferenceDataItem } from '#/api';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Descriptions,
  Drawer,
  Space,
  Tag,
  Typography,
} from 'ant-design-vue';

import { DxActionColumn, DxVxeGrid } from '#/components/common';
import { $t } from '#/locales';

import { useReferenceDataList } from './composables/useReferenceDataList';

const gridRef = ref<InstanceType<typeof DxVxeGrid>>();

const { formatEmpty, formatPairs, gridOptions, initialize, selectedCatalogMeta } =
  useReferenceDataList(gridRef);

const detailVisible = ref(false);
const detailRecord = ref<null | ReferenceDataItem>(null);

function openDetail(record: ReferenceDataItem) {
  detailRecord.value = record;
  detailVisible.value = true;
}

function closeDetail() {
  detailVisible.value = false;
}

onMounted(() => {
  void initialize();
});
</script>

<template>
  <Page
    auto-content-height
    :description="$t('system.referenceData.description')"
    :title="$t('system.referenceData.title')"
  >
    <DxVxeGrid ref="gridRef" :grid-options="gridOptions">
      <template #form-before>
        <Alert
          v-if="selectedCatalogMeta"
          class="catalog-alert"
          show-icon
          type="info"
        >
          <template #message>
            <Space wrap>
              <span>{{ selectedCatalogMeta.title }}</span>
              <Tag color="blue">{{ selectedCatalogMeta.key }}</Tag>
              <Tag>
                {{
                  $t('system.referenceData.versionTag', {
                    version: selectedCatalogMeta.version,
                  })
                }}
              </Tag>
              <Tag>
                {{
                  $t('system.referenceData.itemCountTag', {
                    count: selectedCatalogMeta.itemCount,
                  })
                }}
              </Tag>
            </Space>
          </template>
          <template #description>
            {{
              selectedCatalogMeta.description ||
              $t('system.referenceData.emptyDescription')
            }}
          </template>
        </Alert>
      </template>

      <template #labelI18n="{ row }">
        <div
          v-if="formatPairs(row.labelI18n).length"
          class="pair-list"
        >
          <Tag
            v-for="entry in formatPairs(row.labelI18n)"
            :key="entry.key"
          >
            {{ entry.key }}: {{ entry.value }}
          </Tag>
        </div>
        <Typography.Text v-else type="secondary">
          {{ formatEmpty(undefined) }}
        </Typography.Text>
      </template>

      <template #extra="{ row }">
        <div
          v-if="formatPairs(row.extra).length"
          class="pair-list"
        >
          <Tag
            v-for="entry in formatPairs(row.extra)"
            :key="entry.key"
          >
            {{ entry.key }}: {{ entry.value }}
          </Tag>
        </div>
        <Typography.Text v-else type="secondary">
          {{ formatEmpty(undefined) }}
        </Typography.Text>
      </template>

      <template #actions="{ row }">
        <DxActionColumn
          :actions="[
            {
              key: 'detail',
              label: $t('system.referenceData.actions.viewDetail'),
              onClick: () => openDetail(row as ReferenceDataItem),
            },
          ]"
          :max-visible="3"
        />
      </template>
    </DxVxeGrid>

    <Drawer
      :open="detailVisible"
      :title="$t('system.referenceData.detailTitle')"
      width="640"
      @close="closeDetail"
    >
      <Descriptions
        v-if="detailRecord"
        bordered
        :column="1"
        size="small"
      >
        <Descriptions.Item :label="$t('system.referenceData.detailFields.value')">
          <Typography.Text code>{{ detailRecord.value }}</Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item :label="$t('system.referenceData.detailFields.label')">
          {{ detailRecord.label || formatEmpty(undefined) }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('system.referenceData.detailFields.labelI18n')">
          <div
            v-if="formatPairs(detailRecord.labelI18n).length"
            class="pair-list"
          >
            <Tag
              v-for="entry in formatPairs(detailRecord.labelI18n)"
              :key="entry.key"
            >
              {{ entry.key }}: {{ entry.value }}
            </Tag>
          </div>
          <Typography.Text v-else type="secondary">
            {{ formatEmpty(undefined) }}
          </Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item :label="$t('system.referenceData.detailFields.sortOrder')">
          {{ detailRecord.sortOrder ?? formatEmpty(undefined) }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('system.referenceData.detailFields.extra')">
          <div
            v-if="formatPairs(detailRecord.extra).length"
            class="pair-list"
          >
            <Tag
              v-for="entry in formatPairs(detailRecord.extra)"
              :key="entry.key"
            >
              {{ entry.key }}: {{ entry.value }}
            </Tag>
          </div>
          <Typography.Text v-else type="secondary">
            {{ formatEmpty(undefined) }}
          </Typography.Text>
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
  </Page>
</template>

<style scoped>
.catalog-alert {
  margin-bottom: 16px;
}

.pair-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
