<script lang="ts" setup>
import { computed } from 'vue';
import { formatEmpty } from '@vben/utils';
import { Tag } from 'ant-design-vue';
import { $t } from '#/locales';

interface Props {
  value?: boolean | null;
  trueText?: string;
  falseText?: string;
  trueColor?: string;
  falseColor?: string;
  emptyText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  trueColor: 'blue',
  falseColor: 'default',
  emptyText: formatEmpty(undefined),
});

const trueText = computed(() => props.trueText ?? $t('system.common.trueText'));
const falseText = computed(() => props.falseText ?? $t('system.common.falseText'));

const text = computed(() => {
  if (props.value === true) return trueText.value;
  if (props.value === false) return falseText.value;
  return props.emptyText;
});

const color = computed(() => {
  if (props.value === true) return props.trueColor;
  if (props.value === false) return props.falseColor;
  return 'default';
});
</script>

<template>
  <Tag v-if="props.value !== undefined && props.value !== null" :color="color">
    {{ text }}
  </Tag>
  <span v-else class="text-gray-400">{{ props.emptyText }}</span>
</template>
