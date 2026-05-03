export interface ReferenceDataCatalogItem {
  description?: string;
  itemCount: number;
  key: string;
  title: string;
  version: string;
}

export interface ReferenceDataCatalogListResponse {
  items: ReferenceDataCatalogItem[];
}

export interface ReferenceDataItem {
  extra?: Record<string, any>;
  label: string;
  labelI18n?: Record<string, string>;
  sortOrder?: number;
  value: string;
}

export interface ReferenceDataItemListQuery {
  includeI18n?: boolean;
  label?: string;
  page: number;
  pageSize: number;
  value?: string;
}

export interface ReferenceDataItemListResponse {
  catalog: ReferenceDataCatalogItem;
  items: ReferenceDataItem[];
  total: number;
}
