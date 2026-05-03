# DxVxeGrid 使用说明

## 1. 目标

`DxVxeGrid` 是管理后台默认使用的列表基线组件，用来统一以下能力：

- 搜索表单与表格的一体化布局
- 刷新、列设置、全屏等工具栏能力
- 分页代理与统一返回结构解析
- 项目级默认样式、分页规格、空态与居中策略

只要页面属于“后台列表页 / 只读查询页 / CRUD 主列表页”，默认优先使用 `DxVxeGrid`，而不是单独手写 `Table + Form + Pagination`。

## 2. 最小用法

```ts
import { computed, ref } from 'vue';

import { DxVxeGrid } from '#/components/common';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAdminList } from '#/api';

type VbenVxeGridProps = Parameters<typeof useVbenVxeGrid>[0];

const gridRef = ref<InstanceType<typeof DxVxeGrid>>();

const gridOptions = computed<VbenVxeGridProps>(() => ({
  gridOptions: {
    rowConfig: { isHover: true, keyField: 'id' },
    proxyConfig: {
      autoLoad: true,
      ajax: {
        query: async ({ page }: any, formValues: any) => {
          return await getAdminList({
            page: page.currentPage,
            pageSize: page.pageSize,
            username: formValues?.username,
          });
        },
      },
    },
    columns: [
      { type: 'seq', width: 60, title: '序号' },
      { field: 'username', minWidth: 160, title: '用户名' },
    ],
  },
  formOptions: {
    layout: 'inline',
    showCollapseButton: false,
    schema: [
      {
        fieldName: 'username',
        label: '用户名',
        component: 'Input',
        componentProps: {
          allowClear: true,
          placeholder: '请输入用户名',
        },
      },
    ],
  },
  separator: false,
}));
```

```vue
<DxVxeGrid ref="gridRef" :grid-options="gridOptions">
  <template #toolbar-actions>
    <Button type="primary">新增</Button>
  </template>
</DxVxeGrid>
```

## 3. 约定

- 列表查询优先走 `proxyConfig.ajax.query`
- 查询表单统一放入 `formOptions`，不要再启用原生 `formConfig`
- 页面特殊列渲染使用 slots，不要在页面里再包一层独立表格
- 默认分页规格使用组件内置值，只有业务明确需要时才覆盖
- 页面若需要手动刷新，优先调用 `gridRef.value?.gridApi?.reload()`
- 即使页面只有内置工具按钮（刷新、列设置、全屏、搜索面板切换），也应保留统一工具栏，不要自行隐藏
- 搜索表单中长度波动较大的字段（如下拉目录、地区、时区）应显式设置 `minWidth` / `width`，避免选项或选中值被过度截断
- 搜索面板与工具栏之间的分割线应只在搜索面板展开时出现，隐藏搜索面板后不要保留悬空边线或多余留白
- 输入型搜索项如无特殊提示价值，不额外设置示例型 placeholder，优先依靠 label 表达字段含义

## 4. 标准列表页布局

新的后台列表页默认按以下层级组织：

1. `Page` 只放标题与一句描述
2. `DxVxeGrid` 容器内部承接整个列表区
3. 搜索表单上方的上下文说明，放到 `form-before`
4. 搜索表单使用 `formOptions`
5. 表格上方操作行 / 工具栏由 `toolbar-actions` 与内置工具栏统一承接
6. 表格主体只保留列定义与 slots

参考写法：

```vue
<DxVxeGrid ref="gridRef" :grid-options="gridOptions">
  <template #form-before>
    <Alert type="info">当前目录摘要</Alert>
  </template>

  <template #toolbar-actions>
    <Button type="primary">新增</Button>
  </template>
</DxVxeGrid>
```

## 5. 常用能力

### 5.1 主动查询 / 刷新

```ts
await gridRef.value?.gridApi?.query({
  status: 1,
});

await gridRef.value?.gridApi?.reload();
```

### 5.2 访问查询表单值

```ts
const values = await gridRef.value?.gridApi?.formApi.getValues();
```

### 5.3 设置查询表单初始值

```ts
await gridRef.value?.gridApi?.formApi.setValues({
  catalog: 'country_region',
  keyword: '',
});
```

## 6. 何时需要扩展 DxVxeGrid

优先扩展 `DxVxeGrid` 的场景：

- 同类页面反复需要同一个工具栏行为
- 多个页面都要写相同的分页、刷新或表单适配逻辑
- 统一样式或交互应由组件层兜底，而不是页面层各写一遍

不必扩展 `DxVxeGrid` 的场景：

- 只是某个页面自己的列定义差异
- 只需通过 slots 完成特殊单元格渲染
- 只需通过 `formOptions` 增减页面自己的查询项

## 7. 参考页面

- `apps/admin/src/views/system/admin/index.vue`
- `apps/admin/src/views/system/reference-data/index.vue`
