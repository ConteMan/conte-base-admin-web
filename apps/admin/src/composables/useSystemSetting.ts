import { computed, onMounted, ref } from 'vue';

import { getSystemSettings } from '#/api';

import type { SettingObjectType, SystemSettingItem } from '#/api';

import { ENABLED_STATUS } from '#/constants';

import { loadCachedResource } from './useResourceLoader';

const settingCache = new Map<string, SystemSettingItem | null>();
const pendingSettingRequests = new Map<string, Promise<SystemSettingItem | null>>();

function normalizeKey(key: string) {
  return key.trim();
}

async function loadSetting(
  objectType: SettingObjectType,
  key: string,
  force = false,
) {
  const normalizedKey = normalizeKey(key);
  return loadCachedResource({
    cache: settingCache,
    fetcher: async () => {
      const response = await getSystemSettings({
        keyword: normalizedKey,
        objectType,
        page: 1,
        pageSize: 100,
      });
      return response.items.find((item) => item.key === normalizedKey) ?? null;
    },
    force,
    key: `${objectType}:${normalizedKey}`,
    pending: pendingSettingRequests,
  });
}

export function useSystemSetting(objectType: SettingObjectType, key: string) {
  const normalizedKey = normalizeKey(key);
  const cacheKey = `${objectType}:${normalizedKey}`;

  const loading = ref(false);
  const error = ref<null | unknown>(null);
  const setting = ref<SystemSettingItem | null>(settingCache.get(cacheKey) ?? null);

  const value = computed(() => setting.value?.value);
  const title = computed(() => setting.value?.title ?? '');
  const isEnabled = computed(
    () =>
      setting.value?.status === ENABLED_STATUS && Boolean(setting.value?.value),
  );

  async function ensureLoaded(force = false) {
    loading.value = true;
    error.value = null;
    try {
      setting.value = await loadSetting(objectType, normalizedKey, force);
      return setting.value;
    } catch (err) {
      error.value = err;
      console.error(`[setting] load setting failed: ${objectType}:${normalizedKey}`, err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  function refresh() {
    return ensureLoaded(true);
  }

  onMounted(() => {
    void ensureLoaded();
  });

  return {
    ensureLoaded,
    error,
    isEnabled,
    loading,
    refresh,
    setting,
    title,
    value,
  };
}
