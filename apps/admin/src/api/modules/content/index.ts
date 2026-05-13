import { requestClient } from '#/api/request';

import type {
  ContentNow,
  ContentNote,
  ContentProfile,
  ContentProject,
  ContentLink,
  ContentSiteSettings,
  CreateContentNoteRequest,
  CreateContentProjectRequest,
  CreateContentLinkRequest,
  UpdateContentNowRequest,
  UpdateContentNoteRequest,
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

export type {
  ContentNow,
  ContentNote,
  ContentNoteStatus,
  ContentProfile,
  ContentProject,
  ContentLink,
  ContentSiteSettings,
  CreateContentNoteRequest,
  CreateContentProjectRequest,
  CreateContentLinkRequest,
  UpdateContentNowRequest,
  UpdateContentNoteRequest,
  UpdateContentProfileRequest,
  UpdateContentProjectRequest,
  UpdateContentLinkRequest,
  UpdateContentSiteSettingsRequest,
} from './types';
