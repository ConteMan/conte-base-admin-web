export type LegalDocumentType = 'privacy_policy' | 'terms_of_use';

export type LegalVersionStatus = 1 | 2 | 3;

export interface LegalCurrentVersionBrief {
  effectiveAt?: string;
  locale: string;
  publishedAt?: string;
  version: string;
  versionId: string;
}

export interface LegalDocumentItem {
  currentVersions: LegalCurrentVersionBrief[];
  isActive: boolean;
  name: string;
  type: LegalDocumentType;
}

export interface LegalDocumentListResponse {
  items: LegalDocumentItem[];
}

export interface LegalLocaleOption {
  label: string;
  labelI18n?: Record<string, string>;
  value: string;
}

export interface LegalLocaleOptionListResponse {
  options: LegalLocaleOption[];
}

export interface LegalVersionListQuery {
  locale?: string;
  page: number;
  pageSize: number;
}

export interface LegalVersionItem {
  content: string;
  createdAt: string;
  createdBy?: number;
  documentType: LegalDocumentType;
  effectiveAt?: string;
  id: string;
  locale: string;
  publishedAt?: string;
  status: LegalVersionStatus;
  summary?: string;
  title: string;
  updatedAt: string;
  updatedBy?: number;
  version: string;
}

export interface LegalVersionListResponse {
  items: LegalVersionItem[];
  total: number;
}

export interface CreateLegalVersionRequest {
  content: string;
  effectiveAt?: string;
  locale: string;
  summary?: string;
  title: string;
  version: string;
}

export interface UpdateLegalVersionRequest {
  content?: string;
  effectiveAt?: string;
  summary?: string;
  title?: string;
}

export interface PublishLegalVersionResponse {
  publishedAt: string;
  versionId: string;
}
