<script lang="ts" setup>
import type { SettingValueType } from '#/constants';

import { Input, InputNumber, Switch } from 'ant-design-vue';

import { $t } from '#/locales';

import {
  SETTING_VALUE_TYPE_JSON,
  SETTING_VALUE_TYPE_NUMBER,
  SETTING_VALUE_TYPE_STRING,
} from '#/constants';

const TextArea = Input.TextArea;

type FieldValue = boolean | number | string | undefined;

interface Props {
  disabled?: boolean;
  placeholder?: string;
  value?: FieldValue;
  valueType?: SettingValueType;
}

const props = withDefaults(defineProps<Props>(), {
  valueType: SETTING_VALUE_TYPE_STRING,
});

const emit = defineEmits<{
  'update:value': [value: FieldValue];
}>();

function updateValue(value: unknown) {
  if (
    value === undefined ||
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    emit('update:value', value as FieldValue);
    return;
  }
  emit('update:value', undefined);
}
</script>

<template>
  <Input
    v-if="props.valueType === SETTING_VALUE_TYPE_STRING"
    :disabled="props.disabled"
    :placeholder="props.placeholder"
    :value="typeof props.value === 'string' ? props.value : ''"
    @update:value="updateValue"
  />

  <InputNumber
    v-else-if="props.valueType === SETTING_VALUE_TYPE_NUMBER"
    class="w-full"
    :disabled="props.disabled"
    :placeholder="props.placeholder"
    :value="typeof props.value === 'number' ? props.value : undefined"
    @update:value="updateValue"
  />

  <TextArea
    v-else-if="props.valueType === SETTING_VALUE_TYPE_JSON"
    :auto-size="{ minRows: 8, maxRows: 16 }"
    :disabled="props.disabled"
    :placeholder="props.placeholder || $t('system.config.fields.preview')"
    :value="typeof props.value === 'string' ? props.value : ''"
    @update:value="updateValue"
  />

  <Switch
    v-else
    :checked="Boolean(props.value)"
    :checked-children="$t('system.config.enabled')"
    :disabled="props.disabled"
    :un-checked-children="$t('system.config.disabled')"
    @update:checked="updateValue"
  />
</template>
