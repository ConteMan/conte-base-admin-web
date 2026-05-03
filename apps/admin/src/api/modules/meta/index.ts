import { requestClient } from '#/api/request';

import type {
  MetaCatalogItem,
  MetaCatalogListResponse,
  MetaEnumListQuery,
  MetaEnumListResponse,
} from './types';

export async function getMetaEnums(
  params: MetaEnumListQuery,
): Promise<MetaEnumListResponse> {
  return requestClient.get<MetaEnumListResponse>('/meta/enums', {
    params,
  });
}

export async function getMetaCatalogs(
  names: string[],
  includeI18n = true,
): Promise<MetaCatalogListResponse> {
  return requestClient.get<MetaCatalogListResponse>('/meta/catalogs', {
    params: {
      includeI18n,
      names: names.join(','),
    },
  });
}

export async function getMetaCatalog(
  name: string,
  includeI18n = true,
): Promise<MetaCatalogItem | null> {
  const response = await getMetaCatalogs([name], includeI18n);
  return response.items.find((item) => item.name === name) ?? null;
}

export type {
  MetaCatalogItem,
  MetaCatalogKind,
  MetaCatalogListResponse,
  MetaEnumListQuery,
  MetaEnumListResponse,
  MetaEnumNamespace,
  MetaEnumSummary,
  MetaCatalogSource,
  MetaCatalogValue,
  MetaValue,
} from './types';
