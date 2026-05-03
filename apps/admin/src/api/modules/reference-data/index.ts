import { requestClient } from '#/api/request';

import type {
  ReferenceDataCatalogListResponse,
  ReferenceDataItemListQuery,
  ReferenceDataItemListResponse,
} from './types';

export async function getReferenceDataCatalogs() {
  return requestClient.get<ReferenceDataCatalogListResponse>(
    '/reference-data/catalogs',
  );
}

export async function getReferenceDataItems(
  catalog: string,
  params: ReferenceDataItemListQuery,
) {
  return requestClient.get<ReferenceDataItemListResponse>(
    `/reference-data/${catalog}/items`,
    {
      params,
    },
  );
}

export type {
  ReferenceDataCatalogItem,
  ReferenceDataCatalogListResponse,
  ReferenceDataItem,
  ReferenceDataItemListQuery,
  ReferenceDataItemListResponse,
} from './types';
