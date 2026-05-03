import type { AdminListItem } from '#/api';

import { computed, markRaw, ref } from 'vue';

import { message } from 'ant-design-vue';

import { updateAdminStatus } from '#/api';
import { z } from '#/adapter/form';
import type { DxFormSchema, DxSchemaFormExpose } from '#/components/common';
import { DxMetaSelect } from '#/components/common';
import { useDict } from '#/composables/useDict';
import { DICTIONARY_CATALOG_ADMIN_USER_BAN_REASON } from '#/constants';
import { $t } from '#/locales';

export function useBanReason(onSuccess: () => Promise<void>) {
  const { ensureLoaded, selectOptions } = useDict(
    DICTIONARY_CATALOG_ADMIN_USER_BAN_REASON,
  );

  const banModalOpen = ref(false);
  const banModalSaving = ref(false);
  const targetAdmin = ref<AdminListItem | null>(null);
  const banFormRef = ref<DxSchemaFormExpose | null>(null);
  const banFormResetValues = ref<{ banReason?: string } | null>(null);

  const banFormSchema = computed<DxFormSchema[]>(() => [
    {
      component: markRaw(DxMetaSelect),
      componentProps: {
        allowClear: false,
        options: selectOptions.value,
        placeholder: $t('system.admin.banReasonPlaceholder'),
      },
      defaultValue: undefined,
      fieldName: 'banReason',
      label: $t('system.admin.banReasonTitle'),
      modelPropName: 'value',
      required: true,
      rules: z
        .string({
          required_error: $t('system.admin.banReasonRequired'),
        })
        .min(1, {
          message: $t('system.admin.banReasonRequired'),
        }),
    },
  ]);

  async function openBanModal(record: AdminListItem) {
    targetAdmin.value = record;
    await ensureLoaded();
    banFormResetValues.value = {
      banReason: undefined,
    };
    banModalOpen.value = true;
  }

  function closeBanModal() {
    banModalOpen.value = false;
    targetAdmin.value = null;
    banFormResetValues.value = null;
  }

  async function submitBan(nextStatus?: number) {
    const validation = await banFormRef.value?.validate();
    if (!validation) {
      return;
    }

    const values = await banFormRef.value?.getValues<{ banReason?: string }>();
    if (!targetAdmin.value || !nextStatus || !values?.banReason) {
      return;
    }

    banModalSaving.value = true;
    try {
      await updateAdminStatus(targetAdmin.value.id, {
        banReason: values.banReason,
        status: nextStatus,
      });
      message.success($t('system.admin.banSuccess'));
      closeBanModal();
      await onSuccess();
    } finally {
      banModalSaving.value = false;
    }
  }

  return {
    banFormRef,
    banFormSchema,
    banFormResetValues,
    banModalOpen,
    banModalSaving,
    closeBanModal,
    openBanModal,
    submitBan,
    targetAdmin,
  };
}
