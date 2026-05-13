import { requestClient } from '#/api/request';

import type {
  ContentNow,
  ContentNote,
  ContentProfile,
  ContentProject,
  ContentLink,
  ContentSiteSettings,
  ContentCategory,
  ContentTag,
  ContentAsset,
  CreateAssetUploadIntentRequest,
  CreateAssetUploadIntentResponse,
  CompleteAssetUploadRequest,
  CreateContentNoteRequest,
  CreateContentCategoryRequest,
  CreateContentTagRequest,
  CreateContentProjectRequest,
  CreateContentLinkRequest,
  UpdateContentNowRequest,
  UpdateContentNoteRequest,
  UpdateContentCategoryRequest,
  UpdateContentTagRequest,
  UpdateAssetRequest,
  UpdateContentProfileRequest,
  UpdateContentProjectRequest,
  UpdateContentLinkRequest,
  UpdateContentSiteSettingsRequest,
} from './types';

export async function getContentProfile() {
  return requestClient.get<ContentProfile>('/content/profile');
}

export async function updateContentProfile(data: UpdateContentProfileRequest) {
  return requestClient.put('/content/profile', data);
}

export async function getContentNow() {
  return requestClient.get<ContentNow>('/content/now');
}

export async function updateContentNow(data: UpdateContentNowRequest) {
  return requestClient.put('/content/now', data);
}

export async function getContentSiteSettings() {
  return requestClient.get<ContentSiteSettings>('/content/site-settings');
}

export async function updateContentSiteSettings(
  data: UpdateContentSiteSettingsRequest,
) {
  return requestClient.put('/content/site-settings', data);
}

export async function getContentProjects() {
  return requestClient.get<{ items: ContentProject[] }>('/content/projects');
}

export async function createContentProject(data: CreateContentProjectRequest) {
  return requestClient.post<{ id: number }>('/content/projects', data);
}

export async function updateContentProject(
  id: number,
  data: UpdateContentProjectRequest,
) {
  return requestClient.put(`/content/projects/${id}`, data);
}

export async function deleteContentProject(id: number) {
  return requestClient.delete(`/content/projects/${id}`);
}

export async function getContentLinks() {
  return requestClient.get<{ items: ContentLink[] }>('/content/links');
}

export async function createContentLink(data: CreateContentLinkRequest) {
  return requestClient.post<{ id: number }>('/content/links', data);
}

export async function updateContentLink(
  id: number,
  data: UpdateContentLinkRequest,
) {
  return requestClient.put(`/content/links/${id}`, data);
}

export async function deleteContentLink(id: number) {
  return requestClient.delete(`/content/links/${id}`);
}

export async function getContentNotes() {
  return requestClient.get<{ items: ContentNote[] }>('/content/notes');
}

export async function getContentNote(id: number | string) {
  return requestClient.get<ContentNote>(`/content/notes/${id}`);
}

export async function createContentNote(data: CreateContentNoteRequest) {
  return requestClient.post<{ id: number }>('/content/notes', data);
}

export async function updateContentNote(
  id: number | string,
  data: UpdateContentNoteRequest,
) {
  return requestClient.put(`/content/notes/${id}`, data);
}

export async function deleteContentNote(id: number) {
  return requestClient.delete(`/content/notes/${id}`);
}

export async function getContentCategories() {
  return requestClient.get<{ items: ContentCategory[] }>('/content/categories');
}

export async function createContentCategory(data: CreateContentCategoryRequest) {
  return requestClient.post<{ id: number }>('/content/categories', data);
}

export async function updateContentCategory(
  id: number,
  data: UpdateContentCategoryRequest,
) {
  return requestClient.put(`/content/categories/${id}`, data);
}

export async function deleteContentCategory(id: number) {
  return requestClient.delete(`/content/categories/${id}`);
}

export async function getContentTags() {
  return requestClient.get<{ items: ContentTag[] }>('/content/tags');
}

export async function createContentTag(data: CreateContentTagRequest) {
  return requestClient.post<{ id: number }>('/content/tags', data);
}

export async function updateContentTag(id: number, data: UpdateContentTagRequest) {
  return requestClient.put(`/content/tags/${id}`, data);
}

export async function deleteContentTag(id: number) {
  return requestClient.delete(`/content/tags/${id}`);
}

export async function createAssetUploadIntent(
  data: CreateAssetUploadIntentRequest,
) {
  return requestClient.post<CreateAssetUploadIntentResponse>(
    '/assets/upload-intents',
    data,
  );
}

export async function completeAssetUpload(
  id: number,
  data: CompleteAssetUploadRequest,
) {
  return requestClient.post<ContentAsset>(`/assets/${id}/complete`, data);
}

export async function getAssets(params?: {
  keyword?: string;
  page?: number;
  pageSize?: number;
  status?: string;
}) {
  return requestClient.get<{ items: ContentAsset[]; total: number }>('/assets', {
    params,
  });
}

export async function getAsset(id: number) {
  return requestClient.get<ContentAsset>(`/assets/${id}`);
}

export async function updateAsset(id: number, data: UpdateAssetRequest) {
  return requestClient.put<ContentAsset>(`/assets/${id}`, data);
}

export async function deleteAsset(id: number) {
  return requestClient.delete(`/assets/${id}`);
}

export type {
  ContentNow,
  ContentCategory,
  ContentAsset,
  ContentNote,
  ContentNoteStatus,
  ContentProfile,
  ContentProject,
  ContentLink,
  ContentSiteSettings,
  ContentTag,
  CreateContentNoteRequest,
  CreateContentCategoryRequest,
  CreateContentTagRequest,
  CreateAssetUploadIntentRequest,
  CreateAssetUploadIntentResponse,
  CompleteAssetUploadRequest,
  CreateContentProjectRequest,
  CreateContentLinkRequest,
  UpdateContentNowRequest,
  UpdateContentNoteRequest,
  UpdateContentCategoryRequest,
  UpdateContentTagRequest,
  UpdateAssetRequest,
  UpdateContentProfileRequest,
  UpdateContentProjectRequest,
  UpdateContentLinkRequest,
  UpdateContentSiteSettingsRequest,
} from './types';
