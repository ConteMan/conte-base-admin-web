import { requestClient } from '#/api/request';

import type {
  ConfigGroupListResponse,
  CreateConfigGroupRequest,
  CreateConfigGroupResponse,
  CreateSystemSettingRequest,
  CreateSystemSettingResponse,
  SystemSettingListQuery,
  SystemSettingListResponse,
  UpdateConfigGroupRequest,
  UpdateConfigGroupStatusRequest,
  UpdateSystemSettingRequest,
  UpdateSystemSettingStatusRequest,
  UpdateSystemSettingValueRequest,
} from './types';

export async function getConfigGroups() {
  return requestClient.get<ConfigGroupListResponse>('/config-groups');
}

export async function createConfigGroup(data: CreateConfigGroupRequest) {
  return requestClient.post<CreateConfigGroupResponse>('/config-groups', data);
}

export async function updateConfigGroup(
  id: number,
  data: UpdateConfigGroupRequest,
) {
  return requestClient.put(`/config-groups/${id}`, data);
}

export async function updateConfigGroupStatus(
  id: number,
  data: UpdateConfigGroupStatusRequest,
) {
  return requestClient.request(`/config-groups/${id}/status`, {
    data,
    method: 'PATCH',
  });
}

export async function deleteConfigGroup(id: number) {
  return requestClient.delete(`/config-groups/${id}`);
}

export async function getSystemSettings(params: SystemSettingListQuery) {
  return requestClient.get<SystemSettingListResponse>('/system-settings', {
    params,
  });
}

export async function createSystemSetting(data: CreateSystemSettingRequest) {
  return requestClient.post<CreateSystemSettingResponse>('/system-settings', data);
}

export async function updateSystemSetting(
  id: number,
  data: UpdateSystemSettingRequest,
) {
  return requestClient.put(`/system-settings/${id}`, data);
}

export async function updateSystemSettingStatus(
  id: number,
  data: UpdateSystemSettingStatusRequest,
) {
  return requestClient.request(`/system-settings/${id}/status`, {
    data,
    method: 'PATCH',
  });
}

export async function updateSystemSettingValue(
  key: string,
  data: UpdateSystemSettingValueRequest,
) {
  return requestClient.put(`/system-settings/key/${key}/value`, data);
}

export async function deleteSystemSetting(id: number) {
  return requestClient.delete(`/system-settings/${id}`);
}

export type {
  ConfigGroupItem,
  ConfigGroupListResponse,
  ConfigStatus,
  CreateConfigGroupRequest,
  CreateConfigGroupResponse,
  CreateSystemSettingRequest,
  CreateSystemSettingResponse,
  SettingObjectType,
  SettingValueType,
  SystemSettingItem,
  SystemSettingListQuery,
  SystemSettingListResponse,
  UpdateConfigGroupRequest,
  UpdateConfigGroupStatusRequest,
  UpdateSystemSettingRequest,
  UpdateSystemSettingStatusRequest,
  UpdateSystemSettingValueRequest,
} from './types';
