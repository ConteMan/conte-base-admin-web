import { requestClient } from '#/api/request';

import type { AuditLogListQuery, AuditLogListResponse } from './types';

export async function getAuditLogList(params: AuditLogListQuery) {
  return requestClient.get<AuditLogListResponse>('/audit-logs', {
    params,
  });
}

export type {
  AuditLogItem,
  AuditLogListQuery,
  AuditLogListResponse,
} from './types';
