import type { SettingObjectType } from '#/api';

import {
  SETTING_OBJECT_TYPE_CONFIG,
  SETTING_OBJECT_TYPE_FLAG,
} from '#/constants';

import { useSystemSetting } from './useSystemSetting';

function useSettingByType(objectType: SettingObjectType, key: string) {
  return useSystemSetting(objectType, key);
}

export function useConfig(key: string) {
  return useSettingByType(SETTING_OBJECT_TYPE_CONFIG, key);
}

export function useFeatureFlag(key: string) {
  return useSettingByType(SETTING_OBJECT_TYPE_FLAG, key);
}
