import { requestClient } from '#/api/request';

import type {
  AdminListItem,
  AdminListResponse,
  CreateAdminRequest,
  CreateAdminResponse,
  ResetAdminPasswordRequest,
  ResetAdminTotpResponse,
  SetAdminRolesRequest,
  UpdateAdminRequest,
  UpdateAdminStatusRequest,
} from './types';

/** 管理员列表（分页 + 筛选） */
export async function getAdminList(params: {
  page: number;
  pageSize: number;
  status?: number;
  username?: string;
}) {
  return requestClient.get<AdminListResponse>('/admins', { params });
}

/** 获取管理员详情 */
export async function getAdminDetail(id: number) {
  return requestClient.get<AdminListItem>(`/admins/${id}`);
}

/** 创建管理员 */
export async function createAdmin(data: CreateAdminRequest) {
  return requestClient.post<CreateAdminResponse>('/admins', data);
}

/** 更新管理员基本信息 */
export async function updateAdmin(id: number, data: UpdateAdminRequest) {
  return requestClient.put(`/admins/${id}`, data);
}

/** 设置管理员角色（全量覆盖） */
export async function setAdminRoles(id: number, data: SetAdminRolesRequest) {
  return requestClient.put(`/admins/${id}/roles`, data);
}

/** 重置管理员密码 */
export async function resetAdminPassword(
  id: number,
  data: ResetAdminPasswordRequest,
) {
  return requestClient.put(`/admins/${id}/reset-password`, data);
}

/** 重置管理员 TOTP */
export async function resetAdminTotp(id: number) {
  return requestClient.post<ResetAdminTotpResponse>(`/admins/${id}/reset-totp`);
}

/** 封禁/解封管理员 */
export async function updateAdminStatus(
  id: number,
  data: UpdateAdminStatusRequest,
) {
  return requestClient.request(`/admins/${id}/status`, {
    data,
    method: 'PATCH',
  });
}

/** 强制下线 */
export async function forceLogoutAdmin(id: number) {
  const sessions = await requestClient.get<{ id: string }[]>(`/admins/${id}/sessions`);
  await Promise.all(
    (sessions || []).map((session) =>
      requestClient.post(`/admins/${id}/sessions/${session.id}/revoke`),
    ),
  );
  return { ok: true };
}

export type {
  AdminListItem,
  AdminListResponse,
  AdminRoleBrief,
  CreateAdminRequest,
  CreateAdminResponse,
  ResetAdminPasswordRequest,
  ResetAdminTotpResponse,
  SetAdminRolesRequest,
  UpdateAdminRequest,
  UpdateAdminStatusRequest,
} from './types';
