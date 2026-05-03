import { computed, onMounted, ref } from 'vue';

import { preferences } from '@vben/preferences';

import { resolveI18n } from '#/utils/i18n-field';

import { loadCachedResource } from './useResourceLoader';

import type { MetaValue } from '#/api';

const DEFAULT_TTL_MS = 10 * 60 * 1000;
// bump version to invalidate stale metadata cache when enum visual semantics change.
const STORAGE_PREFIX = 'divixbrowser:admin:metadata:v3:';

export type MetadataBadgeStatus =
  | 'success'
  | 'processing'
  | 'default'
  | 'error'
  | 'warning';

interface PersistedMetadataEntry<TItem> {
  expiresAt: number;
  items: TItem[];
  version?: string;
}

export interface StandardMetadataItem {
  badgeStatus?: MetadataBadgeStatus;
  disabled?: boolean;
  color?: string;
  extra?: Record<string, any>;
  label: string;
  labelI18n?: Record<string, string>;
  sortOrder?: number;
  value: MetaValue;
}

interface MetadataNormalizeResult<TItem extends StandardMetadataItem> {
  items: TItem[];
  version?: string;
}

const resourceCache = new Map<
  string,
  PersistedMetadataEntry<StandardMetadataItem>
>();
const pendingRequests = new Map<
  string,
  Promise<PersistedMetadataEntry<StandardMetadataItem>>
>();

function storageAvailable() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeParseEntry<TItem>(
  rawValue: string | null,
): PersistedMetadataEntry<TItem> | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as PersistedMetadataEntry<TItem>;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray(parsed.items) ||
      typeof parsed.expiresAt !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function readPersistedEntry<TItem>(
  cacheKey: string,
): PersistedMetadataEntry<TItem> | null {
  const now = Date.now();
  const memoryEntry = resourceCache.get(cacheKey);
  if (memoryEntry) {
    if (memoryEntry.expiresAt <= now) {
      resourceCache.delete(cacheKey);
    } else {
      return memoryEntry as PersistedMetadataEntry<TItem>;
    }
  }

  const storage = storageAvailable();
  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(`${STORAGE_PREFIX}${cacheKey}`);
  const parsed = safeParseEntry<TItem>(rawValue);
  if (!parsed) {
    return null;
  }

  if (parsed.expiresAt <= now) {
    storage.removeItem(`${STORAGE_PREFIX}${cacheKey}`);
    return null;
  }

  resourceCache.set(
    cacheKey,
    parsed as PersistedMetadataEntry<StandardMetadataItem>,
  );
  return parsed;
}

function persistEntry<TItem>(
  cacheKey: string,
  entry: PersistedMetadataEntry<TItem>,
) {
  resourceCache.set(
    cacheKey,
    entry as PersistedMetadataEntry<StandardMetadataItem>,
  );

  const storage = storageAvailable();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(`${STORAGE_PREFIX}${cacheKey}`, JSON.stringify(entry));
  } catch {
    // 本地持久化只是辅助缓存，写失败不影响页面正常消费。
  }
}

function getSameValue(
  left: MetaValue | null | undefined,
  right: MetaValue | null | undefined,
) {
  return String(left) === String(right);
}

function buildPersistedEntry<TItem>(
  items: TItem[],
  ttlMs: number,
  version?: string,
): PersistedMetadataEntry<TItem> {
  const now = Date.now();
  return {
    expiresAt: now + ttlMs,
    items,
    version,
  };
}

function resolveMetadataBadgeStatus(
  value: unknown,
): MetadataBadgeStatus | undefined {
  if (
    value === 'success' ||
    value === 'processing' ||
    value === 'default' ||
    value === 'error' ||
    value === 'warning'
  ) {
    return value;
  }
  return undefined;
}

function resolveMetadataColor(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export interface UseMetadataResourceOptions<TItem extends StandardMetadataItem> {
  cacheKey: string;
  fetcher: () => Promise<MetadataNormalizeResult<TItem>>;
  ttlMs?: number;
}

export function useMetadataResource<TItem extends StandardMetadataItem>(
  options: UseMetadataResourceOptions<TItem>,
) {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const persisted = readPersistedEntry<TItem>(options.cacheKey);
  const items = ref<TItem[]>(persisted?.items ?? []);
  const version = ref(persisted?.version ?? '');
  const loading = ref(false);
  const error = ref<unknown>(null);

  if (persisted?.items) {
    resourceCache.set(
      options.cacheKey,
      persisted as PersistedMetadataEntry<StandardMetadataItem>,
    );
  }

  // 统一负责“读缓存 -> 读本地持久化 -> 发起请求 -> 回写缓存”的完整生命周期。
  async function ensureLoaded(force = false) {
    loading.value = true;
    error.value = null;

    try {
      if (!force) {
        const cached = readPersistedEntry<TItem>(options.cacheKey);
        if (cached) {
          items.value = cached.items;
          version.value = cached.version ?? '';
          return items.value;
        }
      }

      const nextEntry = await loadCachedResource({
        cache: resourceCache as Map<
          string,
          PersistedMetadataEntry<TItem>
        >,
        fetcher: async () => {
          const response = await options.fetcher();
          const entry = buildPersistedEntry(
            response.items,
            ttlMs,
            response.version,
          );
          persistEntry(options.cacheKey, entry);
          return entry;
        },
        force,
        key: options.cacheKey,
        pending: pendingRequests as Map<
          string,
          Promise<PersistedMetadataEntry<TItem>>
        >,
      });

      items.value = nextEntry.items;
      version.value = nextEntry.version ?? '';
      return items.value;
    } catch (err) {
      error.value = err;
      console.error(`[metadata] load resource failed: ${options.cacheKey}`, err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  // 显式刷新时直接跳过当前缓存，强制重新拉取最新元数据。
  function refresh() {
    return ensureLoaded(true);
  }

  // 供 Select/Tag 等 UI 组件直接消费的标准化选项结构。
  const selectOptions = computed(() =>
    items.value.map((item) => ({
      badgeStatus:
        item.badgeStatus ??
        resolveMetadataBadgeStatus(item.extra?.badgeStatus) ??
        undefined,
      disabled: item.disabled,
      color: item.color ?? resolveMetadataColor(item.extra?.color),
      extra: item.extra,
      label: resolveI18n(item.labelI18n, item.label),
      labelI18n: item.labelI18n,
      sortOrder: item.sortOrder,
      value: item.value,
    })),
  );

  // 按元数据 value 反查完整目录项，便于页面拿到 extra 或其它扩展字段。
  function getOption(value: MetaValue | null | undefined) {
    if (value === undefined || value === null) {
      return undefined;
    }
    return items.value.find((item) => getSameValue(item.value, value));
  }

  // 按扩展字段反查目录项，适合页面里做轻量的状态归类或条件判断。
  function getOptionByExtra(key: string, expected: unknown) {
    return items.value.find((item) => item.extra?.[key] === expected);
  }

  // 根据当前语言和回退策略返回最终文案，避免页面自己处理 i18n 回退。
  function getLabel(value: MetaValue | null | undefined, fallback = '') {
    const option = getOption(value);
    if (!option) {
      return fallback;
    }
    return resolveI18n(option.labelI18n, option.label);
  }

  function getValueByExtra(key: string, expected: unknown) {
    return getOptionByExtra(key, expected)?.value;
  }

  function hasExtraValue(
    value: MetaValue | null | undefined,
    key: string,
    expected: unknown,
  ) {
    return getOption(value)?.extra?.[key] === expected;
  }

  onMounted(() => {
    void ensureLoaded();
  });

  return {
    cacheKey: options.cacheKey,
    ensureLoaded,
    error,
    getLabel,
    getOption,
    getOptionByExtra,
    getValueByExtra,
    hasExtraValue,
    items,
    loading,
    refresh,
    selectOptions,
    version,
  };
}

export function createMetadataCacheKey(
  kind: string,
  name: string,
  querySignature = '',
) {
  return [kind, name, preferences.app.locale, querySignature]
    .filter((item) => item !== '')
    .join(':');
}
