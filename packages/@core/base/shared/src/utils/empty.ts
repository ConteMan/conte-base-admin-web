/**
 * 提供通用的空数据占位符功能
 */

/**
 * 如果值为空（null / undefined / ''），则返回默认指定的占位符
 * @param value 要检查的值
 * @param placeholder 默认占位符，默认为 '--'
 */
export function formatEmpty(value: any, placeholder = '--'): string {
  if (value === null || value === undefined || value === '') {
    return placeholder;
  }
  return String(value);
}
