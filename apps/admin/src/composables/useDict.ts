import { computed } from 'vue';

import { getDictionaryOptions } from '#/api';

import type { DictionaryOption } from '#/api';

import {
  createMetadataCacheKey,
  type StandardMetadataItem,
  useMetadataResource,
} from './useMetadataResource';

function normalizeDictionaryOptions(options: DictionaryOption[]): StandardMetadataItem[] {
  return options.map((item) => ({
    label: item.label,
    labelI18n: item.labelI18n,
    value: item.value,
  }));
}

export function useDict(catalogKey: string) {
  const resource = useMetadataResource<StandardMetadataItem>({
    cacheKey: createMetadataCacheKey('dictionary', catalogKey),
    fetcher: async () => {
      const response = await getDictionaryOptions(catalogKey);
      return {
        items: normalizeDictionaryOptions(response.options ?? []),
      };
    },
  });

  const selectOptions = computed(() =>
    resource.selectOptions.value.map((item) => ({
      ...item,
      value: item.value as string,
    })),
  );

  return {
    ...resource,
    options: selectOptions,
    selectOptions,
  };
}
