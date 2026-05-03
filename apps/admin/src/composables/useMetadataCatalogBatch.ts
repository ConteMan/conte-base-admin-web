import { getMetaCatalogs } from '#/api';

import type { MetaCatalogItem } from '#/api';

interface PendingCatalogRequest {
  resolve: (item: MetaCatalogItem | null) => void;
  reject: (reason: unknown) => void;
}

interface BatchGroup {
  includeI18n: boolean;
  names: Set<string>;
  pending: Map<string, PendingCatalogRequest[]>;
  scheduled: boolean;
}

const catalogCache = new Map<string, MetaCatalogItem>();
const batchGroups = new Map<string, BatchGroup>();

function getBatchKey(includeI18n: boolean) {
  return includeI18n ? 'include-i18n' : 'exclude-i18n';
}

function getCatalogCacheKey(name: string, includeI18n: boolean) {
  return `${getBatchKey(includeI18n)}:${name}`;
}

function getOrCreateBatchGroup(includeI18n: boolean) {
  const key = getBatchKey(includeI18n);
  let group = batchGroups.get(key);
  if (!group) {
    group = {
      includeI18n,
      names: new Set(),
      pending: new Map(),
      scheduled: false,
    };
    batchGroups.set(key, group);
  }
  return group;
}

function resolvePending(group: BatchGroup, name: string, item: MetaCatalogItem | null) {
  const requests = group.pending.get(name);
  if (!requests) {
    return;
  }

  group.pending.delete(name);
  requests.forEach((request) => request.resolve(item));
}

async function flushBatch(groupKey: string) {
  const group = batchGroups.get(groupKey);
  if (!group) {
    return;
  }

  group.scheduled = false;
  const names = Array.from(group.names);
  group.names.clear();
  if (names.length === 0) {
    return;
  }

  try {
    const response = await getMetaCatalogs(names, group.includeI18n);
    const catalogMap = new Map(response.items.map((item) => [item.name, item]));

    response.items.forEach((item) => {
      catalogCache.set(getCatalogCacheKey(item.name, group.includeI18n), item);
    });

    names.forEach((name) => {
      resolvePending(group, name, catalogMap.get(name) ?? null);
    });
  } catch (error) {
    names.forEach((name) => {
      const requests = group.pending.get(name);
      if (!requests) {
        return;
      }
      group.pending.delete(name);
      requests.forEach((request) => request.reject(error));
    });
  }

  if (group.names.size > 0 && !group.scheduled) {
    group.scheduled = true;
    void Promise.resolve().then(() => flushBatch(groupKey));
  }
}

export function requestMetaCatalog(
  name: string,
  includeI18n = true,
): Promise<MetaCatalogItem | null> {
  const normalizedName = name.trim();
  if (!normalizedName) {
    return Promise.resolve(null);
  }

  const cached = catalogCache.get(getCatalogCacheKey(normalizedName, includeI18n));
  if (cached) {
    return Promise.resolve(cached);
  }

  const group = getOrCreateBatchGroup(includeI18n);
  group.names.add(normalizedName);

  return new Promise<MetaCatalogItem | null>((resolve, reject) => {
    const requests = group.pending.get(normalizedName) ?? [];
    requests.push({ resolve, reject });
    group.pending.set(normalizedName, requests);

    if (!group.scheduled) {
      group.scheduled = true;
      void Promise.resolve().then(() => flushBatch(getBatchKey(includeI18n)));
    }
  });
}
