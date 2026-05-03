export const ENABLED_STATUS = 1 as const;
export const DISABLED_STATUS = 2 as const;

export type ConfigStatus = typeof ENABLED_STATUS | typeof DISABLED_STATUS;

export const CONFIG_STATUS_VALUES = [ENABLED_STATUS, DISABLED_STATUS] as const;

export function isConfigStatus(value: unknown): value is ConfigStatus {
  return value === ENABLED_STATUS || value === DISABLED_STATUS;
}

export function isEnabledStatus(value: ConfigStatus) {
  return value === ENABLED_STATUS;
}
