export interface AdminRoleBrief {
  code: string;
  id: number;
  name: string;
}

export interface AdminListItem {
  createdAt: string;
  email?: string;
  id: number;
  isSystem: boolean;
  lastLoginAt?: string;
  lastLoginIp?: string;
  roles: AdminRoleBrief[];
  status: number;
  username: string;
}

export interface AdminListQuery {
  page: number;
  pageSize: number;
  status?: number;
  username?: string;
}

export interface AdminListResponse {
  items: AdminListItem[];
  total: number;
}

export interface CreateAdminRequest {
  email?: string;
  password: string;
  roleIds: number[];
  username: string;
}

export interface CreateAdminResponse {
  id: number;
}

export interface UpdateAdminRequest {
  email?: string;
  username: string;
}

export interface SetAdminRolesRequest {
  roleIds: number[];
}

export interface ResetAdminPasswordRequest {
  newPassword: string;
}

export interface UpdateAdminStatusRequest {
  banReason?: string;
  status: number;
}
