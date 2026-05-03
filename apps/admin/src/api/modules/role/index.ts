import { requestClient } from '#/api/request';

import type {
  CreateRoleRequest,
  CreateRoleResponse,
  RoleListQuery,
  RoleListResponse,
  SetRoleMenusRequest,
  UpdateRoleRequest,
} from './types';

export async function getRoleList(params: RoleListQuery) {
  return requestClient.get<RoleListResponse>('/roles', { params });
}

export async function createRole(data: CreateRoleRequest) {
  return requestClient.post<CreateRoleResponse>('/roles', data);
}

export async function updateRole(id: number, data: UpdateRoleRequest) {
  return requestClient.put('/roles/' + id, data);
}

export async function deleteRole(id: number) {
  return requestClient.delete('/roles/' + id);
}

export async function setRoleMenus(id: number, data: SetRoleMenusRequest) {
  return requestClient.put('/roles/' + id + '/menus', data);
}

export type {
  CreateRoleRequest,
  CreateRoleResponse,
  RoleListQuery,
  RoleListResponse,
  RoleItem,
  SetRoleMenusRequest,
  UpdateRoleRequest,
} from './types';
