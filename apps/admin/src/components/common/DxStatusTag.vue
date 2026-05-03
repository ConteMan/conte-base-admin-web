<script lang="ts" setup>
import { computed } from 'vue';
import { formatEmpty } from '@vben/utils';
import { Badge, Tag } from 'ant-design-vue';

export interface DxStatusOption {
  value: string | number | boolean;
  label: string;
  color?: string; // Used for Tag
  badgeStatus?: 'success' | 'processing' | 'default' | 'error' | 'warning'; // Used for Badge
}

interface Props {
  value?: string | number | boolean | null;
  options?: DxStatusOption[];
  type?: 'badge' | 'tag';
  emptyText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'badge',
  options: () => [],
  emptyText: formatEmpty(undefined),
});

function isSameValue(left: unknown, right: unknown) {
  return String(left) === String(right);
}

const currentOption = computed(() => {
  if (props.value === undefined || props.value === null || props.value === '') return null;
  return props.options.find((opt) => isSameValue(opt.value, props.value)) || null;
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
