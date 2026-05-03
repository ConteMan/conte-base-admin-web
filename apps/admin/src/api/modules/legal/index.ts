import { requestClient } from '#/api/request';

import type {
  CreateLegalVersionRequest,
  LegalDocumentListResponse,
  LegalLocaleOptionListResponse,
  LegalVersionListQuery,
  LegalVersionListResponse,
  PublishLegalVersionResponse,
  UpdateLegalVersionRequest,
} from './types';

export async function getLegalLocaleOptions() {
  return requestClient.get<LegalLocaleOptionListResponse>(
    '/legal-documents/locales',
  );
}

export async function getLegalDocuments() {
  return requestClient.get<LegalDocumentListResponse>('/legal-documents');
}

export async function getLegalVersions(
  docType: string,
  params: LegalVersionListQuery,
) {
  return requestClient.get<LegalVersionListResponse>(
    `/legal-documents/${docType}/versions`,
    { params },
  );
}

export async function createLegalVersion(
  docType: string,
  data: CreateLegalVersionRequest,
) {
  return requestClient.post(`/legal-documents/${docType}/versions`, data);
}

export async function updateLegalVersion(
  versionId: string,
  data: UpdateLegalVersionRequest,
) {
  return requestClient.put(`/legal-documents/versions/${versionId}`, data);
}

export async function publishLegalVersion(versionId: string) {
  return requestClient.post<PublishLegalVersionResponse>(
    `/legal-documents/versions/${versionId}/publish`,
  );
}

export type {
  CreateLegalVersionRequest,
  LegalCurrentVersionBrief,
  LegalDocumentItem,
  LegalDocumentListResponse,
  LegalLocaleOption,
  LegalLocaleOptionListResponse,
  LegalDocumentType,
  LegalVersionItem,
  LegalVersionListQuery,
  LegalVersionListResponse,
  LegalVersionStatus,
  PublishLegalVersionResponse,
  UpdateLegalVersionRequest,
} from './types';
