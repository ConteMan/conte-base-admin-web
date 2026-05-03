<script setup lang="ts">
import type { PinInputProps } from './types';

import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';

import { PinInput, PinInputGroup, PinInputInput } from '../../ui';
import { VbenButton } from '../button';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<PinInputProps>(), {
  codeLength: 6,
  disabled: false,
  loading: false,
  maxTime: 60,
});

const emit = defineEmits<{
  complete: [];
  sendError: [error: any];
}>();

const timer = ref<ReturnType<typeof setTimeout>>();

const modelValue = defineModel<string>();

const inputValue = ref<string[]>([]);
const countdown = ref(0);

const btnText = computed(() => {
  const countdownValue = countdown.value;
  return props.createText?.(countdownValue) ?? '';
});

const btnLoading = computed(() => {
  return props.loading || countdown.value > 0;
});

const showSendButton = computed(() => {
  return !!props.createText || !!props.handleSendCode;
});

watch(
  () => modelValue.value,
  () => {
    inputValue.value = modelValue.value?.split('') ?? [];
  },
);

watch(inputValue, (val) => {
  modelValue.value = val.join('');
});

function handleComplete(e: string[]) {
  modelValue.value = e.join('');
  emit('complete');
}

async function handleSend(e: Event) {
  if (!props.handleSendCode) {
    return;
  }
  try {
    e?.preventDefault();
    countdown.value = props.maxTime;
    startCountdown();
    await props.handleSendCode();
  } catch (error) {
    console.error('Failed to send code:', error);
    // Consider emitting an error event or showing a notification
    emit('sendError', error);
  }
}

function startCountdown() {
  if (countdown.value > 0) {
    timer.value = setTimeout(() => {
      countdown.value--;
      startCountdown();
    }, 1000);
  }
}

onBeforeUnmount(() => {
  countdown.value = 0;
  clearTimeout(timer.value);
});

const id = useId();

const pinType = 'text' as const;
</script>

<template>
  <PinInput
    :id="id"
    v-model="inputValue"
    :disabled="props.disabled"
    class="flex w-full justify-between"
    otp
    placeholder="○"
    :type="pinType"
    @complete="handleComplete"
  >
    <div class="relative flex w-full">
      <PinInputGroup :class="{ 'mr-2': showSendButton }">
        <PinInputInput
          v-for="(item, index) in props.codeLength"
          :key="item"
          :index="index"
        />
      </PinInputGroup>
      <VbenButton
        v-if="showSendButton"
        :disabled="props.disabled"
        :loading="btnLoading"
        class="flex-grow"
        size="lg"
        variant="outline"
        @click="handleSend"
      >
        {{ btnText }}
      </VbenButton>
    </div>
  </PinInput>
</template>
