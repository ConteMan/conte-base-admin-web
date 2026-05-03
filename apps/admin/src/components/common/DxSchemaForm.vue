<script lang="ts">
import type { VbenFormSchema } from '#/adapter/form';
import { useVbenForm } from '#/adapter/form';

export type DxFormSchema = VbenFormSchema;
export type DxFormApi = ReturnType<typeof useVbenForm>[1];

export interface DxSchemaFormExpose {
  formApi: DxFormApi;
  getFormApi: () => DxFormApi;
  getValues: DxFormApi['getValues'];
  resetForm: DxFormApi['resetForm'];
  resetValidate: DxFormApi['resetValidate'];
  setFieldValue: DxFormApi['setFieldValue'];
  setValues: DxFormApi['setValues'];
  validate: DxFormApi['validate'];
}
</script>

<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

interface Props extends Omit<VbenFormProps, 'schema'> {
  initialValues?: Record<string, any> | null;
  resetValues?: Record<string, any> | null;
  schema?: VbenFormSchema[];
}

const props = withDefaults(defineProps<Props>(), {
  actionLayout: 'rowEnd',
  actionPosition: 'right',
  commonConfig: () => ({}),
  layout: 'vertical',
  schema: () => [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

const emit = defineEmits<{
  (event: 'reset-values-applied'): void;
}>();

const formReady = ref(false);
const pendingInitialValues = ref<Record<string, any> | null | undefined>();
const pendingResetValues = ref<Record<string, any> | null | undefined>();
let initialValuesToken = 0;
let resetValuesToken = 0;

function mergeCommonConfig(commonConfig: VbenFormProps['commonConfig']) {
  const componentProps = commonConfig?.componentProps;
  if (typeof componentProps === 'function') {
    return {
      ...commonConfig,
      componentProps: (values: Record<string, any>, actions: any) => ({
        class: 'w-full',
        ...componentProps(values, actions),
      }),
    };
  }
  return {
    ...commonConfig,
    componentProps: {
      class: 'w-full',
      ...(componentProps ?? {}),
    },
  };
}

const formOptions = computed<VbenFormProps<any>>(() => ({
  actionButtonsReverse: props.actionButtonsReverse,
  actionLayout: props.actionLayout,
  actionPosition: props.actionPosition,
  actionWrapperClass: props.actionWrapperClass,
  collapsed: props.collapsed,
  collapsedRows: props.collapsedRows,
  collapseTriggerResize: props.collapseTriggerResize,
  commonConfig: mergeCommonConfig(props.commonConfig),
  fieldMappingTime: props.fieldMappingTime,
  handleCollapsedChange: props.handleCollapsedChange,
  handleReset: props.handleReset,
  handleSubmit: props.handleSubmit,
  handleValuesChange: props.handleValuesChange,
  layout: props.layout,
  resetButtonOptions: props.resetButtonOptions,
  schema: props.schema,
  scrollToFirstError: props.scrollToFirstError,
  showCollapseButton: props.showCollapseButton,
  showDefaultActions: props.showDefaultActions,
  submitButtonOptions: props.submitButtonOptions,
  submitOnChange: props.submitOnChange,
  submitOnEnter: props.submitOnEnter,
  wrapperClass: props.wrapperClass,
}));

const [Form, formApi] = useVbenForm(
  formOptions.value as VbenFormProps<any>,
);

watch(
  formOptions,
  (nextOptions) => {
    formApi.setState(nextOptions as VbenFormProps<any>);
  },
  {
    deep: true,
    immediate: true,
  },
);

// 由表单组件自身在挂载后同步首次初始化值，避免页面层自己处理抽屉/弹窗时序。
async function applyInitialValues() {
  if (!formReady.value) {
    return;
  }

  const values = pendingInitialValues.value;
  if (values === undefined) {
    return;
  }

  const token = ++initialValuesToken;
  await nextTick();
  if (!formReady.value || token !== initialValuesToken) {
    return;
  }

  await formApi.resetForm({
    values: values ?? {},
  });
}

// 用于弹窗/抽屉打开时的回填，允许后续多次刷新。
async function applyResetValues() {
  if (!formReady.value) {
    return;
  }

  const values = pendingResetValues.value;
  if (values === undefined) {
    return;
  }

  const token = ++resetValuesToken;
  await nextTick();
  if (!formReady.value || token !== resetValuesToken) {
    return;
  }

  await formApi.resetForm({
    values: values ?? {},
  });

  emit('reset-values-applied');
}

async function validate(...args: any[]) {
  return await (formApi.validate as any)(...args);
}

async function getValues<T = Record<string, any>>() {
  return await formApi.getValues<T>();
}

async function setValues(
  fields: Record<string, any>,
  filterFields?: boolean,
  shouldValidate?: boolean,
) {
  return await formApi.setValues(fields, filterFields, shouldValidate);
}

async function setFieldValue(
  field: string,
  value: any,
  shouldValidate?: boolean,
) {
  return await formApi.setFieldValue(field, value, shouldValidate);
}

async function resetForm(
  state?: any,
  opts?: any,
) {
  return await (formApi.resetForm as any)(state, opts);
}

async function resetValidate() {
  return await formApi.resetValidate();
}

watch(
  () => props.initialValues,
  (values) => {
    if (values === undefined) {
      pendingInitialValues.value = undefined;
      return;
    }
    pendingInitialValues.value = values;
    void applyInitialValues();
  },
  { deep: true, immediate: true },
);

watch(
  () => props.resetValues,
  (values) => {
    if (values === undefined) {
      pendingResetValues.value = undefined;
      return;
    }
    pendingResetValues.value = values;
    void applyResetValues();
  },
  { deep: true, immediate: true },
);

onMounted(() => {
  formReady.value = true;
  void applyInitialValues();
  void applyResetValues();
});

defineExpose<DxSchemaFormExpose>({
  formApi,
  getFormApi: () => formApi,
  getValues,
  resetForm,
  resetValidate,
  setFieldValue,
  setValues,
  validate,
});
</script>

<template>
  <Form v-bind="$attrs">
    <template
      v-for="(_, name) in Object.fromEntries(Object.entries($slots).filter(([key]) => key !== 'default'))"
      #[name]="slotData"
    >
      <slot :name="name" v-bind="slotData || {}"></slot>
    </template>
    <template #default="slotData">
      <slot v-bind="slotData || {}"></slot>
    </template>
  </Form>
</template>
