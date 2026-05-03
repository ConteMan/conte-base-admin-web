import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

interface BackendAdminInfoResponse {
  created_at?: string;
  display_name: string;
  email?: string;
  id: string;
  last_login_at?: string;
  last_login_ip?: string;
  locale: string;
  roles?: string[];
  totp_enabled?: boolean;
  username: string;
}

export interface AdminInfoResponse {
  createdAt?: string;
  id: string;
  display_name: string;
  email?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  locale: string;
  roles?: string[];
  totpEnabled?: boolean;
  username: string;
}

export interface AdminSessionResponse {
  clientType: string;
  id: string;
  lastSeenAt: string;
  location: string;
  status: string;
}

export async function getAdminProfileApi(): Promise<AdminInfoResponse> {
  const raw = await requestClient.get<BackendAdminInfoResponse>('/auth/me');
  return {
    createdAt: raw.created_at,
    display_name: raw.display_name,
    email: raw.email,
    id: raw.id,
    lastLoginAt: raw.last_login_at,
    lastLoginIp: raw.last_login_ip,
    locale: raw.locale,
    roles: raw.roles,
    totpEnabled: raw.totp_enabled,
    username: raw.username,
  };
}

export async function getUserInfoApi(
  fallbackRoles: string[] = [],
): Promise<UserInfo> {
  const raw = await getAdminProfileApi();
  return {
    avatar: '',
    desc: 'ConteBase Admin',
    homePath: '/content/profile',
    realName: raw.display_name || raw.username,
    roles: raw.roles || fallbackRoles,
    token: '',
    userId: String(raw.id),
    username: raw.username,
  };
}

export async function getAdminSessionsApi(_adminID?: number | string): Promise<AdminSessionResponse[]> {
  return [];
}

export async function revokeAdminSessionApi(
  _adminID?: number | string,
  _sessionID?: string,
) {
  return { ok: true };
}
