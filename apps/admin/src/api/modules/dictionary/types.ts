export interface DictionaryGroupItem {
  catalogCount: number;
  description?: string;
  id: number;
  key: string;
  name: string;
  status: number;
}

export interface DictionaryGroupListResponse {
  items: DictionaryGroupItem[];
}

export interface DictionaryCatalogListQuery {
  groupId?: number;
  keyword?: string;
  page: number;
  pageSize: number;
  status?: number;
}

export interface DictionaryCatalogItem {
  createdAt: string;
  description?: string;
  groupId: number;
  groupKey: string;
  groupName: string;
  id: number;
  itemCount: number;
  key: string;
  name: string;
  status: number;
  updatedAt: string;
}

export interface DictionaryCatalogListResponse {
  items: DictionaryCatalogItem[];
  total: number;
}

export interface DictionaryCatalogDetail {
  description?: string;
  groupId: number;
  groupKey: string;
  groupName: string;
  id: number;
  key: string;
  name: string;
  status: number;
}

export interface DictionaryItemListQuery {
  catalogKey: string;
  label?: string;
  page: number;
  pageSize: number;
  status?: number;
  value?: string;
}

export interface DictionaryItem {
  createdAt: string;
  extra?: Record<string, any>;
  id: number;
  label: string;
  labelI18n?: Record<string, string>;
  sortOrder: number;
  status: number;
  updatedAt: string;
  value: string;
}

export interface DictionaryItemListResponse {
  catalog: DictionaryCatalogDetail;
  items: DictionaryItem[];
  total: number;
}

export interface DictionaryOption {
  label: string;
  labelI18n?: Record<string, string>;
  value: string;
}

export interface DictionaryOptionListResponse {
  catalogKey: string;
  options: DictionaryOption[];
}

export interface CreateDictionaryGroupRequest {
  description?: string;
  key: string;
  name: string;
  status: number;
}

export interface UpdateDictionaryGroupRequest
  extends CreateDictionaryGroupRequest {}

export interface CreateDictionaryCatalogRequest {
  description?: string;
  groupId: number;
  key: string;
  name: string;
  status: number;
}

export interface UpdateDictionaryCatalogRequest
  extends CreateDictionaryCatalogRequest {}

export interface CreateDictionaryItemRequest {
  catalogId: number;
  extra?: Record<string, any>;
  label: string;
  labelI18n?: Record<string, string>;
  sortOrder: number;
  status: number;
  value: string;
}

export interface UpdateDictionaryItemRequest extends CreateDictionaryItemRequest {}
