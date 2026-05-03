# 统一元数据单格式使用说明

> 对应 [F-PLATFORM-020](../../divixbrowser-doc/feature/platform/2026-03-18-frontend-metadata-consumption-layer.md)。本文说明 Admin-Web 如何围绕“一种标准元数据格式”来消费枚举、参考数据、字典、系统配置和开关。
>
> 页面层只关心统一标准结果，不再先区分“这是枚举、字典还是配置”。旧 hook 仍保留作兼容包装，但新页面和迁移页面都优先使用标准格式。
>
> 同一轮渲染中触发的多个 `useEnum / useLookup` 会自动合并成一次 `/meta/catalogs` 批量请求，页面层不需要手工做批处理；只有需要显式预取时才直接调用批量预取层。

## 1. 适用范围

以下场景优先接入统一元数据单格式，不再在页面里手写本地 options：

- 代码枚举
- 只读参考数据
- 运营数据字典
- 系统配置
- Feature Flag

如果某个值只是临时 UI 常量，且不属于上面五层，可以短期留在页面内，但不要把它伪装成基础数据入口。

## 2. 统一结果

页面从统一消费层拿到的结果，优先按下面这组字段来用：

- `items`
- `selectOptions`
- `getLabel`
- `getOption`
- `refresh`
- `loading`
- `error`
- `version`

其中 `items` 是原始标准项，`selectOptions` 是已经按当前语言解析好的页面选项。页面一般不再自己做 `map(label/value)`。

如果只是把元数据渲染成 `Tag` / `Select`，优先交给 `DxMetaTag` 和 `DxMetaSelect`，页面只传资源和少量约束条件，不再自己拼 options。

## 3. 该选哪个入口

| 场景 | 入口 | 说明 |
| :--- | :--- | :--- |
| 标准元数据 | `useMetadataResource(...)` | 页面需要自定义查询或适配时，直接消费标准格式 |
| 代码枚举 | `useEnum(name)` | 兼容包装，返回同一套标准结果 |
| 只读参考数据 | `useLookup(name)` | 兼容包装，返回同一套标准结果 |
| 运营数据字典 | `useDict(catalogKey)` | 兼容包装，返回同一套标准结果 |
| 系统配置 | `useConfig(key)` | 兼容包装，返回单值配置的标准结果 |
| Feature Flag | `useFeatureFlag(key)` | 兼容包装，返回单值开关的标准结果 |

> 说明：新页面优先面向“标准结果”编程，不再围绕来源分类写逻辑。`useEnum` / `useLookup` / `useDict` / `useConfig` / `useFeatureFlag` 只保留兼容语义，页面不需要依赖它们的内部差异。

## 4. 标准接入方式

1. 把元数据读取放到对应页面的 `composable` 中，不要直接在模板里拼选项。
2. 使用统一消费层暴露的 `ensureLoaded`、`refresh`、`selectOptions`、`getLabel`、`getOption` 等能力。
3. `columns`、`formOptions`、`selectOptions` 这类静态结构必须用 `computed()` 包起来，避免切换语言后标题不刷新。
4. 列表页优先遵循 [`DxVxeGrid 使用说明`](./dx-vxe-grid-usage.md)，不要为了接入元数据再单独搭一套表格壳。
5. 页面只负责展示和交互，归属判断、缓存和 fallback 统一交给消费层。

### 4.1 一个最小例子

```ts
import { computed } from 'vue';

import { useEnum } from '#/composables/useMeta';

const adminStatus = useEnum('admin_status');

const statusOptions = computed(() =>
  adminStatus.selectOptions.value.map((item) => ({
    label: item.label,
    value: item.value,
  })),
);

async function refreshStatusOptions() {
  await adminStatus.refresh();
}
```

### 4.2 字典类页面的写法

```ts
import { useDict } from '#/composables/useDict';

const banReason = useDict('admin_user_ban_reason');

const banReasonOptions = computed(() => banReason.selectOptions.value);
```

### 4.3 `system/config` 样板页的写法

`system/config` 页面现在把对象类型、配置状态和值类型都改为从统一元数据消费层读取，并且把页面脚本拆到了 `composable` 里：

```ts
import { useEnum } from '#/composables/useMeta';

const configStatus = useEnum('config_status');
const settingObjectType = useEnum('setting_object_type');
const settingValueType = useEnum('setting_value_type');

const settingValueTypeAllowValues = computed(() => {
  if (settingForm.objectType === SETTING_OBJECT_TYPE_FLAG) {
    return [SETTING_VALUE_TYPE_BOOLEAN];
  }
  return [
    SETTING_VALUE_TYPE_JSON,
    SETTING_VALUE_TYPE_NUMBER,
    SETTING_VALUE_TYPE_STRING,
  ];
});
```

- 页面里只保留业务判断常量，例如 `config` / `flag`、`string` / `number` / `json` / `boolean`。
- 展示层直接用 `DxMetaTag`、`DxMetaSelect` 消费标准元数据资源，不再在页面里手写 `label/value` 映射。
- 动态联动过滤只保留 `allowValues` / `excludeValues` 这类声明式约束，不把过滤函数散到页面里。
- 迁移其他后台页面时，优先复用这一种“资源来自元数据、展示交给 Meta 组件、业务规则保留常量”的写法。

### 4.4 `system/admin` 样板页的写法

`system/admin` 这类典型 CRUD 页面，优先把状态、类型、标签文案都改成从统一元数据消费层取值：

```ts
import { useEnum } from '#/composables/useMeta';

const adminStatus = useEnum('admin_status');
```

- 列表页只负责把元数据资源接到 `DxMetaTag`、`DxMetaSelect` 或其它标准组件里。
- 如果某个状态值需要额外样式，就由 Meta 组件统一从 `extra` 中读取，不要在页面再重复写一套映射。
- 迁移已完成后台页面时，优先从 `system/admin` 这类页面复用这套写法。

### 4.5 批量请求说明

当同一页面里同时声明多个元数据资源时，例如：

```ts
const configStatus = useEnum('config_status');
const settingObjectType = useEnum('setting_object_type');
const settingValueType = useEnum('setting_value_type');
```

这些请求不会各自独立发出，而是会先进入统一批量加载器，再在同一轮微任务里合并成一次 `/meta/catalogs` 请求。页面层只需要继续写 `useEnum / useLookup`，不需要自己维护合并逻辑。

只有在你明确要“提前预取多个目录”时，才直接使用 `requestMetaCatalog(name)`；一般页面开发不要直接碰它。

## 5. 已完成页面迁移规则

- 已完成的 Admin 页面如果仍然保留本地 options、手写 `value/label` 映射或局部 fallback，统一纳入 `F-PLATFORM-020` 的迁移波次处理。
- 迁移顺序优先选择固定选项密集、重复映射多的页面，再往外扩展。
- 迁移时只替换消费方式，不改变数据源语义；如果发现源分类仍然不清晰，先回到需求文档或 `data-governance` 规范重新判定。
- 如果页面不属于五层分类中的任何一层，不要先写本地常量表，先把需求和数据归属说清楚。
- 如果页面需要“按当前字段动态筛选选项”，优先使用 `DxMetaSelect` 的 `allowValues` / `excludeValues`，不要自己在页面里重建 options 列表。

## 6. 常见误区

- 不要把“页面已经能跑”当成“本地 options 可以长期保留”。
- 不要为了省事，在模板里直接写 `[{ label, value }]`。
- 不要把暂时没定层的数据，直接塞进枚举或字典入口。
- 不要在页面层分别维护中英文两套映射，统一由消费层和 i18n 负责。

## 7. 处理建议

当你遇到下面两种情况时，优先按这个顺序处理：

1. 先判断数据是否属于五层治理对象。
2. 能归类就接入对应统一入口。
3. 归类不清就回到 [`data-governance`](../../divixbrowser-doc/standards/data-governance.md) 和需求文档重新确认。
4. 已完成页面要迁移时，按本文件的迁移规则分波次处理，不要新开一份本地常量表。

如果你的目标是把一个 CRUD 页面改成 Schema 驱动表单，请直接参考 [`CRUD 表单 Schema 迁移手册`](./form-schema-migration.md)，那份文档会把 `system/config` 的样板写法讲得更完整。
