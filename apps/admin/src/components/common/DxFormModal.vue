<script lang="ts" setup>
import { computed, useAttrs } from 'vue';
import { Modal } from 'ant-design-vue';
import { $t } from '#/locales';

interface Props {
  open: boolean;
  title?: string;
  saving?: boolean;
  cancelText?: string;
  saveText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  saving: false,
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'cancel'): void;
  (e: 'ok'): void;
}>();

const attrs = useAttrs();

type AttrEventHandler = (...args: any[]) => void;

const modalAttrs = computed(() => {
  const { onCancel, onOk, ...rest } = attrs as Record<string, unknown>;
  return rest;
});

function callAttrHandler(name: 'onCancel' | 'onOk', ...args: any[]) {
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

function onCancel(...args: any[]) {
  emit('update:open', false);
  emit('cancel');
  callAttrHandler('onCancel', ...args);
}

function onOk(...args: any[]) {
  emit('ok');
  callAttrHandler('onOk', ...args);
}
</script>

<template>
  <Modal
    :open="props.open"
    :title="props.title"
    :confirm-loading="props.saving"
    :cancel-text="props.cancelText || $t('system.admin.cancelText')"
    :ok-text="props.saveText || $t('system.admin.save')"
    destroy-on-close
    v-bind="modalAttrs"
    @cancel="onCancel"
    @ok="onOk"
  >
    <slot></slot>
    <template v-for="(_, name) in Object.fromEntries(Object.entries($slots).filter(([k]) => k !== 'default'))" #[name]="slotData">
      <slot :name="name" v-bind="slotData || {}"></slot>
    </template>
  </Modal>
</template>
