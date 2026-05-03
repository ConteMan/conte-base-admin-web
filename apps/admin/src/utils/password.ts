/**
 * 强密码规则：
 * - 至少 8 位
 * - 至少包含 1 个大写字母
 * - 至少包含 1 个小写字母
 * - 至少包含 1 个数字
 * - 至少包含 1 个特殊字符
 */
export function isStrongPassword(value: string): boolean {
  if (value.length < 8) {
    return false;
  }
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);
  return hasUpper && hasLower && hasNumber && hasSpecial;
}
