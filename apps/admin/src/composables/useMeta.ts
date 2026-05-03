import { ref } from 'vue';

import type { MetaCatalogItem, MetaCatalogValue, MetaValue } from '#/api';

import {
  createMetadataCacheKey,
  type MetadataBadgeStatus,
  useMetadataResource,
} from './useMetadataResource';
import {
  requestMetaCatalog,
} from './useMetadataCatalogBatch';

function normalizeCatalogValues(values: MetaCatalogValue[]) {
  return values.map((item) => ({
    badgeStatus: resolveBadgeStatus(item.extra),
    extra: item.extra,
    label: item.label,
    labelI18n: item.labelI18n,
    color: resolveColor(item.extra),
    sortOrder: item.sortOrder,
    value: item.value,
  }));
}

function resolveBadgeStatus(
  extra?: Record<string, any>,
): MetadataBadgeStatus | undefined {
  const badgeStatus = extra?.badgeStatus;
  if (typeof badgeStatus === 'string') {
    if (
      badgeStatus === 'success' ||
      badgeStatus === 'processing' ||
      badgeStatus === 'default' ||
      badgeStatus === 'error' ||
      badgeStatus === 'warning'
    ) {
      return badgeStatus;
    }
  }
  return undefined;
}

function resolveColor(extra?: Record<string, any>) {
  if (extra && typeof extra.color === 'string' && extra.color.trim()) {
    return extra.color;
  }
  return undefined;
}

function useCatalog(kind: 'enum' | 'lookup', name: string) {
  const catalog = ref<MetaCatalogItem | null>(null);
  const resource = useMetadataResource({
    cacheKey: createMetadataCacheKey(`meta-${kind}`, name),
    fetcher: async () => {
      const response = await requestMetaCatalog(name, true);
      catalog.value = response;
      if (!response) {
        return {
          items: [],
          version: '',
        };
      }
      return {
        items: normalizeCatalogValues(response.values),
        version: response.version,
      };
    },
  });

  function getOption(value: MetaValue | null | undefined) {
    return resource.getOption(value);
  }

  function getOptionByExtra(key: string, expected: unknown) {
    return resource.getOptionByExtra(key, expected);
  }

  function getLabel(value: MetaValue | null | undefined, fallback = '') {
    return resource.getLabel(value, fallback);
  }

  function getValueByExtra(key: string, expected: unknown) {
    return resource.getValueByExtra(key, expected);
  }

  function hasExtraValue(
    value: MetaValue | null | undefined,
    key: string,
    expected: unknown,
  ) {
    return resource.hasExtraValue(value, key, expected);
  }

  return {
    ...resource,
    catalog,
    getLabel,
    getOption,
    getOptionByExtra,
    getValueByExtra,
    hasExtraValue,
    options: resource.selectOptions,
  };
}

export function useEnum(name: string) {
  return useCatalog('enum', name);
}

export function useLookup(name: string) {
  return useCatalog('lookup', name);
}
