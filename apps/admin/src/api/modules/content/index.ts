import { requestClient } from '#/api/request';

import type {
  ContentNow,
  ContentProfile,
  ContentSiteSettings,
  UpdateContentNowRequest,
  UpdateContentProfileRequest,
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

export type {
  ContentNow,
  ContentProfile,
  ContentSiteSettings,
  UpdateContentNowRequest,
  UpdateContentProfileRequest,
  UpdateContentSiteSettingsRequest,
} from './types';
