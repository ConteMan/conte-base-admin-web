import { useEnum } from '#/composables/useMeta';

export function useConfigMetadataOptions() {
  const configStatusEnum = useEnum('config_status');
  const settingObjectTypeEnum = useEnum('setting_object_type');
  const settingValueTypeEnum = useEnum('setting_value_type');

  return {
    configStatusEnum,
    settingObjectTypeEnum,
    settingValueTypeEnum,
  };
}
