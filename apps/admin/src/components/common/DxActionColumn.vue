<script lang="ts" setup>
import { computed } from 'vue';
import { Space, Button, Dropdown, Menu, Popconfirm } from 'ant-design-vue';
import { $t } from '#/locales';

export interface DxActionItem {
  key: string;
  label: string;
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  danger?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  confirmTitle?: string;
  confirmOkText?: string;
  confirmCancelText?: string;
  onClick?: () => any | Promise<any>;
  color?: string;
}

interface Props {
  actions: DxActionItem[];
  maxVisible?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxVisible: 3,
});

const visibleActions = computed(() => {
  return props.actions.filter((a) => !a.hidden);
});

const frontActions = computed(() => {
  if (visibleActions.value.length <= props.maxVisible) {
    return visibleActions.value;
  }
  return visibleActions.value.slice(0, props.maxVisible - 1);
});

const moreActions = computed(() => {
  if (visibleActions.value.length <= props.maxVisible) {
    return [];
  }
  return visibleActions.value.slice(props.maxVisible - 1);
});
</script>

<template>
  <Space :size="2">
    <!-- Front Actions -->
    <template v-for="action in frontActions" :key="action.key">
      <Popconfirm
        v-if="action.confirmTitle"
        :cancel-text="action.confirmCancelText || $t('system.admin.cancelText')"
        :disabled="action.disabled"
        :ok-text="action.confirmOkText || $t('system.admin.save')"
        :title="action.confirmTitle"
        @confirm="action.onClick?.()"
      >
        <Button
          :danger="action.danger"
          :disabled="action.disabled"
          :style="action.color ? { color: action.color } : {}"
          :type="action.type || 'link'"
          size="small"
        >
          {{ action.label }}
        </Button>
      </Popconfirm>
      <Button
        v-else
        :danger="action.danger"
        :disabled="action.disabled"
        :style="action.color ? { color: action.color } : {}"
        :type="action.type || 'link'"
        size="small"
        @click="action.onClick?.()"
      >
        {{ action.label }}
      </Button>
    </template>

    <!-- More Actions -->
    <Dropdown v-if="moreActions.length > 0">
      <Button size="small" type="link">
        {{ $t('system.admin.more') }} ▼
      </Button>
      <template #overlay>
        <Menu>
          <Menu.Item v-for="action in moreActions" :key="action.key" :disabled="action.disabled">
            <Popconfirm
              v-if="action.confirmTitle"
              :cancel-text="action.confirmCancelText || $t('system.admin.cancelText')"
              :disabled="action.disabled"
              :ok-text="action.confirmOkText || $t('system.admin.save')"
              :title="action.confirmTitle"
              @confirm="action.onClick?.()"
            >
              <a
                :class="{ 'text-error': action.danger, 'text-gray-400': action.disabled }"
                :style="action.color ? { color: action.color } : {}"
              >
                {{ action.label }}
              </a>
            </Popconfirm>
            <a
              v-else
              :class="{ 'text-error': action.danger, 'text-gray-400': action.disabled }"
              :style="action.color ? { color: action.color } : {}"
              @click="action.onClick?.()"
            >
              {{ action.label }}
            </a>
          </Menu.Item>
        </Menu>
      </template>
    </Dropdown>
  </Space>
</template>
