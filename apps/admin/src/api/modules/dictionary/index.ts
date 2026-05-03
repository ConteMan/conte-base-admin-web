import { requestClient } from '#/api/request';

import type {
  CreateDictionaryCatalogRequest,
  CreateDictionaryGroupRequest,
  CreateDictionaryItemRequest,
  DictionaryCatalogListQuery,
  DictionaryCatalogListResponse,
  DictionaryGroupListResponse,
  DictionaryItemListQuery,
  DictionaryItemListResponse,
  DictionaryOptionListResponse,
  UpdateDictionaryCatalogRequest,
  UpdateDictionaryGroupRequest,
  UpdateDictionaryItemRequest,
} from './types';

export async function getDictionaryGroups() {
  return requestClient.get<DictionaryGroupListResponse>('/dictionaries/groups');
}

export async function createDictionaryGroup(data: CreateDictionaryGroupRequest) {
  return requestClient.post('/dictionaries/groups', data);
}

export async function updateDictionaryGroup(
  id: number,
  data: UpdateDictionaryGroupRequest,
) {
  return requestClient.put(`/dictionaries/groups/${id}`, data);
}

export async function getDictionaryCatalogs(params: DictionaryCatalogListQuery) {
  return requestClient.get<DictionaryCatalogListResponse>(
    '/dictionaries/catalogs',
    {
      params,
    },
  );
}

export async function createDictionaryCatalog(
  data: CreateDictionaryCatalogRequest,
) {
  return requestClient.post('/dictionaries/catalogs', data);
}

export async function updateDictionaryCatalog(
  id: number,
  data: UpdateDictionaryCatalogRequest,
) {
  return requestClient.put(`/dictionaries/catalogs/${id}`, data);
}

export async function getDictionaryItems(params: DictionaryItemListQuery) {
  return requestClient.get<DictionaryItemListResponse>('/dictionaries/items', {
    params,
  });
}

export async function createDictionaryItem(data: CreateDictionaryItemRequest) {
  return requestClient.post('/dictionaries/items', data);
}

export async function updateDictionaryItem(
  id: number,
  data: UpdateDictionaryItemRequest,
) {
  return requestClient.put(`/dictionaries/items/${id}`, data);
}

export async function deleteDictionaryItem(id: number) {
  return requestClient.delete(`/dictionaries/items/${id}`);
}

export async function getDictionaryOptions(catalogKey: string) {
  return requestClient.get<DictionaryOptionListResponse>(
    `/dictionaries/catalogs/${catalogKey}/options`,
  );
}

export type {
  CreateDictionaryCatalogRequest,
  CreateDictionaryGroupRequest,
  CreateDictionaryItemRequest,
  DictionaryCatalogDetail,
  DictionaryCatalogItem,
  DictionaryCatalogListQuery,
  DictionaryCatalogListResponse,
  DictionaryGroupItem,
  DictionaryGroupListResponse,
  DictionaryItem,
  DictionaryItemListQuery,
  DictionaryItemListResponse,
  DictionaryOption,
  DictionaryOptionListResponse,
  UpdateDictionaryCatalogRequest,
  UpdateDictionaryGroupRequest,
  UpdateDictionaryItemRequest,
} from './types';
