<script lang="ts" setup>
import type { AuditLogItem } from '#/api';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatEmpty } from '@vben/utils';

import { Drawer, Descriptions, Typography } from 'ant-design-vue';

import {
  DxActionColumn,
  DxDateTime,
  DxMetaTag,
  DxVxeGrid,
} from '#/components/common';
import { $t } from '#/locales';

import { useAuditLogList } from './composables/useAuditLogList';

const gridRef = ref<InstanceType<typeof DxVxeGrid>>();

const {
  closeDetail,
  detailExtraText,
  detailRecord,
  detailVisible,
  getDeviceInfoDisplay,
  getOperatorDisplay,
  getActionLabel,
  getTargetDisplay,
  categoryOptions,
  actionOptions,
  targetTypeOptions,
  gridOptions,
  initialize,
  openDetail,
} = useAuditLogList(gridRef);

onMounted(() => {
  void initialize();
});
</script>

<template>
  <Page
    auto-content-height
    :description="$t('system.audit.description')"
    :title="$t('system.audit.title')"
  >
    <DxVxeGrid ref="gridRef" :grid-options="gridOptions">
      <template #eventTime="{ row }">
        <DxDateTime :value="(row as AuditLogItem).eventTime" />
      </template>

      <template #operator="{ row }">
        <div class="audit-log-cell">
          <div class="audit-log-primary">
            {{ getOperatorDisplay(row as AuditLogItem) }}
          </div>
          <Typography.Text class="audit-log-secondary">
            #{{ (row as AuditLogItem).operatorId }}
          </Typography.Text>
        </div>
      </template>

      <template #logCategory="{ row }">
        <DxMetaTag
          :options="categoryOptions"
          :value="(row as AuditLogItem).logCategory"
          type="tag"
        />
      </template>

      <template #action="{ row }">
        <DxMetaTag
          :options="actionOptions"
          :value="(row as AuditLogItem).action"
          type="tag"
        />
      </template>

      <template #target="{ row }">
        <div class="audit-log-cell">
          <DxMetaTag
            :options="targetTypeOptions"
            :value="(row as AuditLogItem).targetType"
            type="tag"
          />
          <div class="audit-log-primary">
            {{ getTargetDisplay(row as AuditLogItem) }}
          </div>
        </div>
      </template>

      <template #requestId="{ row }">
        <Typography.Text
          v-if="(row as AuditLogItem).requestId"
          code
          copyable
        >
          {{ (row as AuditLogItem).requestId }}
        </Typography.Text>
        <span v-else>{{ formatEmpty(undefined) }}</span>
      </template>

      <template #actions="{ row }">
        <DxActionColumn
          :actions="[
            {
              key: 'detail',
              label: $t('system.audit.actions.detail'),
              onClick: () => openDetail(row as AuditLogItem),
            },
          ]"
          :max-visible="1"
        />
      </template>
    </DxVxeGrid>

    <Drawer
      :open="detailVisible"
      :title="$t('system.audit.detailTitle')"
      width="760"
      @close="closeDetail"
    >
      <Descriptions
        v-if="detailRecord"
        :column="1"
        bordered
        size="small"
      >
        <Descriptions.Item :label="$t('system.audit.detailFields.eventTime')">
          <DxDateTime :value="detailRecord.eventTime" />
        </Descriptions.Item>
        <Descriptions.Item :label="$t('system.audit.detailFields.operatorId')">
          <Typography.Text code>
            {{ detailRecord.operatorId }}
          </Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item :label="$t('system.audit.detailFields.operatorName')">
          {{ detailRecord.operatorName || formatEmpty(undefined) }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('system.audit.detailFields.logCategory')">
          <DxMetaTag
            :options="categoryOptions"
            :value="detailRecord.logCategory"
            type="tag"
          />
        </Descriptions.Item>
        <Descriptions.Item :label="$t('system.audit.detailFields.action')">
          <DxMetaTag
            :options="actionOptions"
            :value="detailRecord.action"
            type="tag"
          />
        </Descriptions.Item>
        <Descriptions.Item :label="$t('system.audit.detailFields.actionLabel')">
          {{
            detailRecord.actionLabel ||
            getActionLabel(detailRecord.action) ||
            formatEmpty(undefined)
          }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('system.audit.detailFields.targetType')">
          <DxMetaTag
            :options="targetTypeOptions"
            :value="detailRecord.targetType"
            type="tag"
          />
        </Descriptions.Item>
        <Descriptions.Item :label="$t('system.audit.detailFields.targetId')">
          <Typography.Text
            v-if="detailRecord.targetId"
            code
          >
            {{ detailRecord.targetId }}
          </Typography.Text>
          <span v-else>{{ formatEmpty(undefined) }}</span>
        </Descriptions.Item>
        <Descriptions.Item :label="$t('system.audit.detailFields.targetName')">
          {{ detailRecord.targetName || formatEmpty(undefined) }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('system.audit.detailFields.clientIp')">
          <Typography.Text code>
            {{ detailRecord.clientIp }}
          </Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item :label="$t('system.audit.detailFields.deviceInfo')">
          {{ getDeviceInfoDisplay(detailRecord) }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('system.audit.detailFields.requestId')">
          <Typography.Text
            v-if="detailRecord.requestId"
            code
            copyable
          >
            {{ detailRecord.requestId }}
          </Typography.Text>
          <span v-else>{{ formatEmpty(undefined) }}</span>
        </Descriptions.Item>
        <Descriptions.Item :label="$t('system.audit.detailFields.extra')">
          <pre class="audit-log-extra">{{ detailExtraText }}</pre>
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
  </Page>
</template>

<style scoped>
.audit-log-cell {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.audit-log-primary {
  min-width: 0;
  overflow: hidden;
  color: rgb(17 24 39);
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audit-log-secondary {
  color: rgb(107 114 128);
  flex-shrink: 0;
}

.audit-log-extra {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
}

</style>
