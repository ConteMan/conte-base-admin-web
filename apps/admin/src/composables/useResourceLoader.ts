const requestVersions = new Map<string, number>();

export async function loadCachedResource<T>(options: {
  cache: Map<string, T>;
  fetcher: () => Promise<T>;
  force?: boolean;
  key: string;
  pending: Map<string, Promise<T>>;
}): Promise<T> {
  const { cache, fetcher, force = false, key, pending } = options;

  if (!force && cache.has(key)) {
    return cache.get(key) as T;
  }

  if (!force && pending.has(key)) {
    return pending.get(key) as Promise<T>;
  }

  const version = (requestVersions.get(key) ?? 0) + 1;
  requestVersions.set(key, version);

  const request = fetcher()
    .then((value) => {
      if (requestVersions.get(key) === version) {
        cache.set(key, value);
      }
      return value;
    })
    .finally(() => {
      if (pending.get(key) === request) {
        pending.delete(key);
      }
    });

  pending.set(key, request);
  return request;
}
