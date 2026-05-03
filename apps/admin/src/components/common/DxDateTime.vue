<script lang="ts" setup>
import { computed } from 'vue';
import { formatDate, formatEmpty } from '@vben/utils';

interface Props {
  value?: string | number | Date | null;
  format?: string;
  emptyText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  format: 'YYYY-MM-DD HH:mm:ss',
  emptyText: formatEmpty(undefined),
});

const isEmpty = computed(() => {
  return props.value === null || props.value === undefined || props.value === '';
});

const displayValue = computed(() => {
  if (isEmpty.value) return props.emptyText;
  return formatDate(props.value ?? undefined, props.format);
});
</script>

<template>
  <span :class="{ 'text-gray-400': isEmpty }">
    {{ displayValue }}
  </span>
</template>
