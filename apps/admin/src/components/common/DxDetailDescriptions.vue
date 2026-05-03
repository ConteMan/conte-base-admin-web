<script lang="ts" setup>
import type { VNodeChild } from 'vue';

import { h } from 'vue';

import { Descriptions, Tooltip, Typography } from 'ant-design-vue';

export interface DxDetailItem {
  help?: string;
  hint?: string;
  key: string;
  label: string;
  span?: number;
  value?: null | number | string;
}

interface Props {
  bordered?: boolean;
  column?: number;
  emptyText?: string;
  items: DxDetailItem[];
  size?: 'default' | 'middle' | 'small';
}

const props = withDefaults(defineProps<Props>(), {
  bordered: true,
  column: 1,
  emptyText: '-',
  size: 'small',
});

function isEmptyValue(value?: null | number | string) {
  return value === null || value === undefined || value === '';
}

function renderLabel(item: DxDetailItem): VNodeChild {
  if (!item.help) {
    return item.label;
  }

  return h('span', { class: 'dx-detail-descriptions__label' }, [
    h('span', item.label),
    h(
      Tooltip,
      {
        title: item.help,
      },
      {
        default: () =>
          h(
            'span',
            {
              class: 'dx-detail-descriptions__help-trigger',
            },
            '?',
          ),
      },
    ),
  ]);
}
</script>

<template>
  <Descriptions
    :bordered="props.bordered"
    :column="props.column"
    :size="props.size"
  >
    <Descriptions.Item
      v-for="item in props.items"
      :key="item.key"
      :label="renderLabel(item)"
      :span="item.span"
    >
      <slot v-if="$slots[item.key]" :name="item.key" :item="item"></slot>
      <Typography.Text v-else-if="isEmptyValue(item.value)" type="secondary">
        {{ props.emptyText }}
      </Typography.Text>
      <template v-else>
        {{ item.value }}
      </template>

      <div v-if="item.hint" class="dx-detail-descriptions__hint">
        {{ item.hint }}
      </div>
    </Descriptions.Item>
  </Descriptions>
</template>

<style scoped>
.dx-detail-descriptions__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dx-detail-descriptions__help-trigger {
  display: inline-flex;
  align-items: center;
}

.dx-detail-descriptions__hint {
  margin-top: 6px;
  color: var(--ant-color-text-tertiary, rgba(0, 0, 0, 0.45));
  font-size: 12px;
  line-height: 1.5;
}
</style>
