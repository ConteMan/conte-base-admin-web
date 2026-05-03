# 页面基线与布局规则

## 后台标准页

后台列表页、CRUD 页面、配置页优先复用统一骨架：

- `DxVxeGrid`
- `DxActionColumn`
- `DxFormDrawer`

## 约束

- 不得因为双栏、分组、左树右表等信息架构就绕开标准页骨架。
- 工具栏、搜索区、表格区、分页区应尽量保持统一交互。
- 详情态优先使用独立详情展示，不复用禁用表单。

## 组件拆分

- `index.vue` 负责组装模板。
- 复杂列表逻辑拆到 `composables/useXxxList.ts`。
- 表单或浮层逻辑拆到 `composables/useXxxForm.ts` 或独立 composable。
