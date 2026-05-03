import type {
  ConfigStatus,
  SettingObjectType,
  SettingValueType,
} from '#/constants';

export type { ConfigStatus, SettingObjectType, SettingValueType };

export interface ConfigGroupItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  isSystem: boolean;
  sortOrder: number;
  status: ConfigStatus;
  settingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigGroupListResponse {
  items: ConfigGroupItem[];
}

export interface CreateConfigGroupRequest {
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
  status: ConfigStatus;
}

export interface CreateConfigGroupResponse {
  id: number;
}

export interface UpdateConfigGroupRequest {
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
  status: ConfigStatus;
}

export interface UpdateConfigGroupStatusRequest {
  status: ConfigStatus;
}

export interface SystemSettingItem {
  id: number;
  key: string;
  title: string;
  description?: string;
  groupId: number;
  groupCode: string;
  groupName: string;
  groupStatus: ConfigStatus;
  isSystem: boolean;
  objectType: SettingObjectType;
  valueType: SettingValueType;
  value: unknown;
  sortOrder: number;
  status: ConfigStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettingListQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  groupId?: number;
  objectType?: SettingObjectType;
}

export interface SystemSettingListResponse {
  items: SystemSettingItem[];
  total: number;
}

export interface CreateSystemSettingRequest {
  key: string;
  title: string;
  description?: string;
  groupId: number;
  objectType: SettingObjectType;
  valueType: SettingValueType;
  value: unknown;
  sortOrder: number;
  status: ConfigStatus;
}

export interface CreateSystemSettingResponse {
  id: number;
}

export interface UpdateSystemSettingRequest {
  title: string;
  description?: string;
  groupId: number;
  objectType: SettingObjectType;
  valueType: SettingValueType;
  sortOrder: number;
  status: ConfigStatus;
}

export interface UpdateSystemSettingStatusRequest {
  status: ConfigStatus;
}

export interface UpdateSystemSettingValueRequest {
  value: unknown;
}
