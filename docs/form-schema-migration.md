# CRUD 表单 Schema 迁移手册

> 对应 [F-ADMIN-022](../../divixbrowser-doc/feature/admin/2026-03-23-admin-crud-form-schema-standardization.md)。本文说明 Admin-Web 如何把现有 CRUD 页面迁移到项目级表单标准。
>
> 当前第一套样板页是 `system/config`。后续页面不是重新发明一套表单写法，而是直接复用这里沉淀的分层、字段声明、联动与提交转换方式。

## 1. 迁移目标

- 把页面里分散的 `Form.Item`、显隐判断、联动判断、默认值与校验规则收敛到 `composable`。
- 让抽屉表单、弹窗表单和搜索表单都尽量走同一套 schema 表达。
- 保留页面层的业务动作与少量特殊渲染，不把整页退回原生模板写法。

## 2. 推荐分层

一个标准 CRUD 页面，建议拆成三层：

1. `index.vue`
   - 只保留模板、布局和少量事件绑定。
   - 页面不直接堆积复杂表单逻辑。
2. `composables/useXxxPage.ts`
   - 负责列表、搜索、弹窗开关、接口调用、行操作。
   - 只保留业务规则，不承担全部字段拼装。
3. `composables/useXxxForm.ts` 或 `useXxxPanel.ts`
   - 负责表单 schema、默认值、联动、校验和提交前转换。
   - 复杂字段尽量在这里收口。

## 3. 标准接入方式

### 3.1 搜索表单

- 优先把搜索项放到 `DxVxeGrid` 的 `formOptions.schema` 中。
- 简单筛选项直接用统一元数据组件或基础输入组件。
- 查询默认值用 `undefined` 表示，不要为了“全部”额外造一个伪选项。

### 3.2 抽屉 / 弹窗表单

- 统一使用 [`DxSchemaForm`](../apps/admin/src/components/common/DxSchemaForm.vue) 承接 schema。
- 字段默认值、必填校验、联动规则都写在 schema / composable 中。
- 需要动态切换展示的字段，优先抽成专用字段组件，例如 `SettingValueField`。

#### 3.2.1 初始值与回填值

- `initialValues` 只用于表单首次挂载时的初始化语义，例如新建表单的默认值或首屏创建态。
- `resetValues` 只用于弹窗 / 抽屉在打开、切换编辑对象、重新回填时的变化语义。
- 页面不要把“编辑回填”继续叫作 `initialValues`，避免后续维护者误以为这是一次性初始配置。
- 如果某个表单需要“默认值 + 编辑回填”两类语义，优先在页面里分开维护两份值来源，再分别传给 `initialValues` / `resetValues`。

### 3.3 元数据字段

- 静态状态、枚举、字典、配置和开关字段，优先使用 `DxMetaTag / DxMetaSelect`。
- 页面不要再自己手写 `label/value` 列表。
- 需要按字段语义过滤时，优先用 `allowValues / excludeValues`，不要在页面里重建 options。

## 4. `system/config` 样板页

`system/config` 是当前的第一套模板页，已经覆盖以下标准场景：

- 左侧分组 + 右侧列表
- 顶部搜索区
- 分组新增 / 编辑抽屉
- 配置新增 / 编辑抽屉
- 动态字段联动
- 提交前 JSON / 数值 / 布尔转换
- 统一元数据展示

建议后续页面迁移时，先对照这个页面判断自己属于哪一类字段：

- 只读展示字段：交给 `DxMetaTag`
- 下拉选择字段：交给 `DxMetaSelect`
- 动态输入字段：抽成专用字段组件
- 业务联动规则：保留在 `composable`
- 首次初始化默认值：使用 `initialValues`
- 打开 / 编辑后的回填：使用 `resetValues`

## 5. 迁移步骤

1. 先梳理页面已有字段，把字段分成“展示”“编辑”“联动”“提交转换”四类。
2. 把可复用字段统一改成 schema 定义，不要在模板里散写。
3. 把联动规则收进 `composable`，只让页面保留最少的行为代码。
4. 用 `DxSchemaForm` 替换抽屉 / 弹窗里重复的表单壳。
5. 用 `DxMetaTag / DxMetaSelect` 替换重复的状态、枚举和字典展示。
6. 如果字段特殊到 schema 不能表达，再补一个小型字段组件，而不是把整页改回原生模板。

## 6. 允许保留的例外

- 复杂联动字段可以保留在 `composable` 中，不强行塞入基础组件。
- 纯页面临时常量可以短期保留，但不要伪装成基础数据来源。
- 如果某一块完全不适合 schema，允许局部回退到原生组件，但只回退这一块，不回退整页。

## 7. 不推荐的写法

- 不要把所有字段都直接散在 `index.vue` 模板中。
- 不要在每个页面都重新造一套 `Form.Item + 选项 map + 校验`。
- 不要把 `DxSchemaForm` 当成页面继续堆逻辑的借口。
- 不要把业务联动写成一个超大的“上帝 composable”。
- 不要把编辑回填也写成 `initialValues`，这会让语义和时序都变得不清楚。

## 8. 迁移检查清单

- [ ] 页面是否已经拆出 `composable`
- [ ] 表单字段是否已经 schema 化
- [ ] 是否仍在页面里手写 options
- [ ] 是否仍在页面里手写大量联动判断
- [ ] 是否已经复用 `DxSchemaForm`
- [ ] 是否已经复用 `DxMetaTag / DxMetaSelect`
- [ ] 是否已经把提交前转换统一收口

## 9. 关联文档

- [统一元数据单格式使用说明](./metadata-consumption.md)
- [页面列表基线与 DxVxeGrid 说明](./dx-vxe-grid-usage.md)
- [本地开发指南](./development.md)

## 10. 推荐迁移顺序

当前建议按下面顺序逐个迁移：

1. `system/role`
   - 字段少，最适合作为第一批模板迁移验证。
   - 重点验证 schema form 的新增 / 编辑抽屉接入方式。
2. `system/menu`
   - 字段多且有显隐联动，适合验证更复杂的 schema 和元数据字段。
3. `system/dictionary`
   - 包含分组与条目两层表单，适合验证多个抽屉 / 弹窗的统一接入方式。
4. `system/admin`
   - 业务动作最多，适合作为后续综合收口页面。

迁移时不要求一次把所有特殊场景都消灭掉，但每个页面都应先把最常规的 CRUD 表单收进 schema，再把保留逻辑尽量压到业务 composable。
