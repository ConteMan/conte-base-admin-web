import { requestClient } from '#/api/request';

import type {
  CreateMenuRequest,
  CreateMenuResponse,
  MenuTreeItem,
  UpdateMenuRequest,
} from './types';

export async function getMenuManageList() {
  return requestClient.get<MenuTreeItem[]>('/menus-manage');
}

export async function createMenu(data: CreateMenuRequest) {
  return requestClient.post<CreateMenuResponse>('/menus-manage', data);
}

export async function updateMenu(id: number, data: UpdateMenuRequest) {
  return requestClient.put('/menus-manage/' + id, data);
}

export async function deleteMenu(id: number) {
  return requestClient.delete('/menus-manage/' + id);
}

export type {
  CreateMenuRequest,
  CreateMenuResponse,
  MenuNodeType,
  MenuTreeItem,
  UpdateMenuRequest,
} from './types';
