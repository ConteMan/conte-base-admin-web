export type MetaCatalogKind = 'enum' | 'lookup';
export type MetaCatalogSource = 'code' | 'db';
export type MetaValue = boolean | number | string;
export type MetaEnumNamespace = 'admin' | 'client';

export interface MetaCatalogValue {
  extra?: Record<string, any>;
  label: string;
  labelI18n?: Record<string, string>;
  sortOrder?: number;
  value: MetaValue;
}

export interface MetaCatalogItem {
  description?: string;
  kind: MetaCatalogKind;
  name: string;
  source: MetaCatalogSource;
  values: MetaCatalogValue[];
  version: string;
}

export interface MetaCatalogListResponse {
  items: MetaCatalogItem[];
}

export interface MetaEnumSummary {
  description?: string;
  kind: MetaCatalogKind;
  name: string;
  namespace: MetaEnumNamespace;
  source: MetaCatalogSource;
  valueCount: number;
  version: string;
}

export interface MetaEnumListQuery {
  keyword?: string;
  namespace?: MetaEnumNamespace;
  page: number;
  pageSize: number;
}

export interface MetaEnumListResponse {
  items: MetaEnumSummary[];
  total: number;
}
