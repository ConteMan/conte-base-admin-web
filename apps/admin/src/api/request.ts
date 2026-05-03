import { useAccessStore } from '@vben/stores';

import { message } from 'ant-design-vue';

interface RequestConfig {
  data?: unknown;
  headers?: HeadersInit;
  method?: string;
  params?: object;
}

interface SuccessEnvelope<T> {
  data: T;
  success: boolean;
}

interface ErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
  success: false;
}

function buildURL(baseURL: string, url: string, params?: RequestConfig['params']) {
  const normalizedBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  const requestURL = new URL(`${normalizedBase}${normalizedPath}`, window.location.origin);

  if (params) {
    for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
      if (value === undefined) continue;
      if (value === null) continue;
      requestURL.searchParams.set(key, String(value));
    }
  }

  return requestURL.toString();
}

function getLocale() {
  return localStorage.getItem('conte-base-admin-locale') || 'zh-CN';
}

function getAuthHeader() {
  try {
    const accessStore = useAccessStore();
    return accessStore.accessToken
      ? { Authorization: `Bearer ${accessStore.accessToken}` }
      : {};
  } catch {
    return {};
  }
}

async function parseJSON(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

function unwrapResponse<T>(payload: ErrorEnvelope | SuccessEnvelope<T>): T {
  if ((payload as SuccessEnvelope<T>).success) {
    return (payload as SuccessEnvelope<T>).data;
  }

  throw new Error(
    (payload as ErrorEnvelope).error?.message ||
      (payload as ErrorEnvelope).message ||
      '请求失败',
  );
}

async function request<T>(url: string, config: RequestConfig = {}) {
  const method = config.method || 'GET';
  const headers = new Headers(config.headers);

  headers.set('Accept-Language', getLocale());
  headers.set('Accept', 'application/json');
  Object.entries(getAuthHeader()).forEach(([key, value]) => headers.set(key, value));

  let body: BodyInit | undefined;
  if (config.data !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(config.data);
  }

  const response = await fetch(buildURL(apiURL, url, config.params), {
    body,
    headers,
    method,
  });

  const payload = (await parseJSON(response)) as ErrorEnvelope | SuccessEnvelope<T>;
  if (!response.ok) {
    const errorMessage =
      (payload as ErrorEnvelope).error?.message ||
      (payload as ErrorEnvelope).message ||
      `请求失败(${response.status})`;
    message.error(errorMessage);
    throw new Error(errorMessage);
  }

  return unwrapResponse<T>(payload);
}

const apiURL = import.meta.env.VITE_GLOB_API_URL || '/api';

export const requestClient = {
  delete<T>(url: string, config?: RequestConfig) {
    return request<T>(url, { ...config, method: 'DELETE' });
  },
  get<T>(url: string, config?: RequestConfig) {
    return request<T>(url, { ...config, method: 'GET' });
  },
  post<T>(url: string, data?: unknown, config?: RequestConfig) {
    return request<T>(url, { ...config, data, method: 'POST' });
  },
  put<T>(url: string, data?: unknown, config?: RequestConfig) {
    return request<T>(url, { ...config, data, method: 'PUT' });
  },
  request<T>(url: string, config?: RequestConfig) {
    return request<T>(url, config);
  },
};

export const baseRequestClient = requestClient;
