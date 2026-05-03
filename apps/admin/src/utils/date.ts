import { formatDateTime, formatEmpty } from '@vben/utils';

/**
 * 格式化日期时间，空值统一返回占位符 '--'
 * 适用于表格列渲染、自定义 customRender 等场景
 */
export function formatDate(value?: string): string {
  if (!value) return formatEmpty(value);
  return formatDateTime(value);
}
