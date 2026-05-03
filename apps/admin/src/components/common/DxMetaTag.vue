<script lang="ts" setup>
import { computed } from 'vue';

import { formatEmpty } from '@vben/utils';

import { Badge, Tag } from 'ant-design-vue';

export interface DxMetaOption {
  badgeStatus?: 'success' | 'processing' | 'default' | 'error' | 'warning';
  color?: string;
  disabled?: boolean;
  extra?: Record<string, any>;
  label: string;
  labelI18n?: Record<string, string>;
  sortOrder?: number;
  value: string | number | boolean;
}

interface Props {
  emptyText?: string;
  options?: DxMetaOption[];
  type?: 'badge' | 'tag';
  value?: string | number | boolean | null;
}

const props = withDefaults(defineProps<Props>(), {
  emptyText: formatEmpty(undefined),
  options: () => [],
  type: 'badge',
});

function isSameValue(left: unknown, right: unknown) {
  return String(left) === String(right);
}

const currentOption = computed(() => {
  if (props.value === undefined || props.value === null || props.value === '')
    return null;
  return props.options.find((option) => isSameValue(option.value, props.value)) || null;
});
</script>

<template>
  <template v-if="currentOption">
    <Badge
      v-if="props.type === 'badge'"
      :status="currentOption.badgeStatus || 'default'"
      :text="currentOption.label"
    />
    <Tag
      v-else
      :color="currentOption.color || 'default'"
    >
      {{ currentOption.label }}
    </Tag>
  </template>
  <span v-else class="text-gray-400">{{ props.emptyText }}</span>
</template>
