export interface RoleItem {
  code: string;
  createdAt?: string;
  description?: string;
  id: number;
  isSystem?: boolean;
  menuIds?: number[];
  name: string;
}

export interface RoleListQuery {
  code?: string;
  name?: string;
  page: number;
  pageSize: number;
}

export interface RoleListResponse {
  items: RoleItem[];
  total: number;
}

export interface CreateRoleRequest {
  code: string;
  description?: string;
  name: string;
}

export interface UpdateRoleRequest {
  description?: string;
  name: string;
}

export interface CreateRoleResponse {
  id: number;
}

export interface SetRoleMenusRequest {
  menuIds: number[];
}
