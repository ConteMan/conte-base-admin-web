<script lang="ts" setup>
import { computed, watch } from 'vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { DEFAULT_GRID_PAGER_CONFIG } from '#/constants';

type VbenVxeGridProps = Parameters<typeof useVbenVxeGrid>[0];

// 定义我们 DxVxeGrid 特有的 props
interface Props {
  gridOptions: VbenVxeGridProps;
  wrapper?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  wrapper: true,
});

// 我们可以在这里混入项目级别的默认配置
const mergedOptions = computed<VbenVxeGridProps>(() => {
  if (!props.wrapper) {
    return props.gridOptions;
  }

  const userGridOptions = props.gridOptions?.gridOptions || {};
  return {
    ...props.gridOptions,
    gridOptions: {
      ...userGridOptions,
      toolbarConfig: {
        search: true, // 搜索表单切换按键
        custom: true, // 列设置
        refresh: true, // 刷新
        zoom: true, // 全屏
        ...(userGridOptions.toolbarConfig || {}),
      },
      pagerConfig: {
        ...DEFAULT_GRID_PAGER_CONFIG,
        ...(userGridOptions.pagerConfig || {}),
      },
    }
  };
});

const [VbenGrid, gridApi] = useVbenVxeGrid({
  ...(mergedOptions.value as any),
});

watch(
  mergedOptions,
  (newVal) => {
    gridApi.setState(newVal as any);
  },
  { immediate: true },
);

// 向外暴露 api，以便父组件可以操作（比如重载）
defineExpose({
  gridApi,
});
</script>

<template>
  <VbenGrid v-bind="$attrs">
    <!-- 透传所有外部传入的 slots (比如用于自定义列或者 toolbar 按钮) -->
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData || {}"></slot>
    </template>
  </VbenGrid>
</template>
