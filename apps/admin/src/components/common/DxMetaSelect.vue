<script lang="ts" setup>
import { computed } from 'vue';

import { Select } from 'ant-design-vue';

import type { DxMetaOption } from './DxMetaTag.vue';

type MetaValue = boolean | number | string;
type SelectValue = number | string;

const BOOLEAN_TRUE_TOKEN = '__dx_meta_bool_true__';
const BOOLEAN_FALSE_TOKEN = '__dx_meta_bool_false__';

interface SelectOption extends Omit<DxMetaOption, 'value'> {
  value: SelectValue;
}

interface Props {
  allowValues?: MetaValue[];
  allowClear?: boolean;
  disabled?: boolean;
  excludeValues?: MetaValue[];
  options?: DxMetaOption[];
  placeholder?: string;
  value?: MetaValue | null;
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
});

const emit = defineEmits<{
  'update:value': [value: MetaValue | null];
}>();

function encodeValue(value: MetaValue): SelectValue {
  if (value === true) {
    return BOOLEAN_TRUE_TOKEN;
  }
  if (value === false) {
    return BOOLEAN_FALSE_TOKEN;
  }
  return value;
}

function decodeValue(value: unknown): MetaValue | null {
  if (value === BOOLEAN_TRUE_TOKEN) {
    return true;
  }
  if (value === BOOLEAN_FALSE_TOKEN) {
    return false;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  return null;
}

function isSameValue(left: unknown, right: unknown) {
  return String(encodeValue(left as MetaValue)) === String(encodeValue(right as MetaValue));
}

const resolvedOptions = computed<SelectOption[]>(() => {
  const allowValues = props.allowValues;
  const excludeValues = props.excludeValues;

  return props.options.reduce<SelectOption[]>((result, option) => {
    if (
      typeof option.value !== 'string' &&
      typeof option.value !== 'number' &&
      typeof option.value !== 'boolean'
    ) {
      return result;
    }

    if (allowValues?.length) {
      if (!allowValues.some((item) => isSameValue(item, option.value))) {
        return result;
      }
    } else if (
      excludeValues?.length &&
      excludeValues.some((item) => isSameValue(item, option.value))
    ) {
      return result;
    }

    result.push({
      ...option,
      value: encodeValue(option.value),
    });
    return result;
  }, []);
});

function handleUpdateValue(value: unknown) {
  emit('update:value', decodeValue(value));
}
</script>

<template>
  <Select
    :allow-clear="props.allowClear ?? true"
    :disabled="props.disabled"
    :options="resolvedOptions"
    :placeholder="props.placeholder"
    :value="props.value === null || props.value === undefined ? undefined : encodeValue(props.value)"
    @update:value="handleUpdateValue"
  >
    <slot />
  </Select>
</template>
