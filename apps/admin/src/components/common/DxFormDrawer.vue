<script lang="ts" setup>
import { computed, useAttrs } from 'vue';
import { Drawer, Space, Button } from 'ant-design-vue';
import { $t } from '#/locales';

interface Props {
  open: boolean;
  title?: string;
  width?: number | string;
  saving?: boolean;
  cancelText?: string;
  saveText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  width: 480,
  saving: false,
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'close'): void;
  (e: 'save'): void;
}>();

const attrs = useAttrs();

type AttrEventHandler = (...args: any[]) => void;

const drawerAttrs = computed(() => {
  const { onClose, ...rest } = attrs as Record<string, unknown>;
  return rest;
});

function callAttrHandler(name: 'onClose', ...args: any[]) {
  const handler = (attrs as Record<string, unknown>)[name];
  if (Array.isArray(handler)) {
    handler.forEach((fn) => {
      if (typeof fn === 'function') {
        (fn as AttrEventHandler)(...args);
      }
    });
    return;
  }
  if (typeof handler === 'function') {
    (handler as AttrEventHandler)(...args);
  }
}

function onClose(...args: any[]) {
  emit('update:open', false);
  emit('close');
  callAttrHandler('onClose', ...args);
}

function onSave() {
  emit('save');
}
</script>

<template>
  <Drawer
    :open="props.open"
    :title="props.title"
    :width="props.width"
    destroy-on-close
    v-bind="drawerAttrs"
    @close="onClose"
  >
    <slot></slot>
    <template #footer>
      <slot name="footer">
        <Space>
          <Button @click="onClose">{{ props.cancelText || $t('system.admin.cancelText') }}</Button>
          <Button type="primary" :loading="props.saving" @click="onSave">
            {{ props.saveText || $t('system.admin.save') }}
          </Button>
        </Space>
      </slot>
    </template>
  </Drawer>
</template>
