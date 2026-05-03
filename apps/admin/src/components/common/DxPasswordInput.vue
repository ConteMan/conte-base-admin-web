<script lang="ts" setup>
import { computed } from 'vue';
import { Input, Progress } from 'ant-design-vue';
import { $t } from '#/locales';

interface Props {
  value?: string;
  placeholder?: string;
  showStrength?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showStrength: true,
});

const emit = defineEmits<{
  (e: 'update:value', val: string): void;
}>();

const innerValue = computed({
  get: () => props.value,
  set: (val: string) => emit('update:value', val),
});

function getPasswordStrength(pwd: string): number {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  return score;
}

const strengthScore = computed(() => getPasswordStrength(innerValue.value || ''));

const strengthColor = computed(() => {
  if (strengthScore.value <= 1) return '#ff4d4f';
  if (strengthScore.value <= 3) return '#faad14';
  return '#52c41a';
});

const strengthText = computed(() => {
  if (strengthScore.value <= 1) return $t('system.admin.passwordStrengthWeak');
  if (strengthScore.value <= 3) return $t('system.admin.passwordStrengthMedium');
  return $t('system.admin.passwordStrengthStrong');
});
</script>

<template>
  <div>
    <Input.Password
      v-model:value="innerValue"
      :placeholder="props.placeholder || $t('system.admin.passwordPlaceholder')"
      v-bind="$attrs"
    />
    <div v-if="props.showStrength && innerValue" class="mt-2 flex items-center gap-2 text-xs">
      <span class="w-16">{{ $t('system.admin.passwordStrengthLabel') }}:</span>
      <Progress
        class="flex-1"
        :percent="(strengthScore / 4) * 100"
        :show-info="false"
        :stroke-color="strengthColor"
        size="small"
      />
      <span :style="{ color: strengthColor }">
        {{ strengthText }}
      </span>
    </div>
  </div>
</template>
