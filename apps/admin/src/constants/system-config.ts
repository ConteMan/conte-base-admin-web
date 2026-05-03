export const SETTING_OBJECT_TYPE_CONFIG = 'config' as const;
export const SETTING_OBJECT_TYPE_FLAG = 'flag' as const;

export type SettingObjectType =
  | typeof SETTING_OBJECT_TYPE_CONFIG
  | typeof SETTING_OBJECT_TYPE_FLAG;

export const SETTING_OBJECT_TYPES = [
  SETTING_OBJECT_TYPE_CONFIG,
  SETTING_OBJECT_TYPE_FLAG,
] as const;

export function isSettingObjectType(
  value: unknown,
): value is SettingObjectType {
  return (
    value === SETTING_OBJECT_TYPE_CONFIG || value === SETTING_OBJECT_TYPE_FLAG
  );
}

export const SETTING_VALUE_TYPE_STRING = 'string' as const;
export const SETTING_VALUE_TYPE_NUMBER = 'number' as const;
export const SETTING_VALUE_TYPE_JSON = 'json' as const;
export const SETTING_VALUE_TYPE_BOOLEAN = 'boolean' as const;

export type SettingValueType =
  | typeof SETTING_VALUE_TYPE_STRING
  | typeof SETTING_VALUE_TYPE_NUMBER
  | typeof SETTING_VALUE_TYPE_JSON
  | typeof SETTING_VALUE_TYPE_BOOLEAN;

export const SETTING_VALUE_TYPES = [
  SETTING_VALUE_TYPE_STRING,
  SETTING_VALUE_TYPE_NUMBER,
  SETTING_VALUE_TYPE_JSON,
  SETTING_VALUE_TYPE_BOOLEAN,
] as const;

export function isSettingValueType(value: unknown): value is SettingValueType {
  return (
    value === SETTING_VALUE_TYPE_STRING ||
    value === SETTING_VALUE_TYPE_NUMBER ||
    value === SETTING_VALUE_TYPE_JSON ||
    value === SETTING_VALUE_TYPE_BOOLEAN
  );
}
