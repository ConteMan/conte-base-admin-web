import { computed, type ComputedRef } from 'vue';

import { preferences } from '@vben/preferences';

/** 后端返回的多语言 JSONB 字段类型 */
export type I18nMap = Record<string, string>;

/**
 * 从后端返回的 i18n JSONB 字段中，按当前 locale 取值
 * Fallback 优先级：i18nMap[当前locale] → i18nMap["zh-CN"] → fallback 原字段
 *
 * @param i18nMap  后端返回的 {"zh-CN":"系统管理","en-US":"System Management"}
 * @param fallback 原始字段值（如 title）
 */
export function resolveI18n(
  i18nMap: I18nMap | null | undefined,
  fallback: string,
): string {
  if (!i18nMap) return fallback;
  const locale = preferences.app.locale;
  return i18nMap[locale] || i18nMap['zh-CN'] || fallback;
}

/**
 * 响应式版本：语言切换后自动重新解析
 *
 * @example
 * const displayTitle = useI18nField(() => [item.titleI18n, item.title]);
 */
export function useI18nField(
  getter: () => [I18nMap | null | undefined, string],
): ComputedRef<string> {
  return computed(() => {
    const [i18nMap, fallback] = getter();
    return resolveI18n(i18nMap, fallback);
  });
}
