export interface AuditLogItem {
  action: string;
  actionLabel: string;
  clientIp: string;
  deviceInfo: string;
  eventTime: string;
  extra?: null | Record<string, any> | string;
  id: string;
  logCategory: string;
  operatorId: number;
  operatorName: string;
  requestId?: string;
  targetId: string;
  targetName: string;
  targetType: string;
}

export interface AuditLogListQuery {
  action?: string;
  endAt?: string;
  keyword?: string;
  logCategory?: string;
  operatorId?: number;
  page: number;
  pageSize: number;
  startAt?: string;
  targetId?: string;
}

export interface AuditLogListResponse {
  items: AuditLogItem[];
  total: number;
}
