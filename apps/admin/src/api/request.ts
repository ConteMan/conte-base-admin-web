import { useAccessStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { $t } from '#/locales';

interface RequestConfig {
  data?: unknown;
  headers?: HeadersInit;
  method?: string;
  params?: object;
  showErrorMessage?: boolean;
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

class HttpRequestError extends Error {
  code?: string;
  status: number;

  constructor(
    messageText: string,
    options: {
      code?: string;
      status: number;
    },
  ) {
    super(messageText);
    this.name = 'HttpRequestError';
    this.code = options.code;
    this.status = options.status;
  }
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

function getAccessToken() {
  try {
    const accessStore = useAccessStore();
    return accessStore.accessToken;
  } catch {
    return undefined;
  }
}

function getAuthHeader(accessToken?: null | string) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
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

function resolveErrorMessage(payload: ErrorEnvelope, status: number) {
  switch (payload.error?.code) {
    case 'ADMIN.AUTH.INVALID_CREDENTIALS': {
      return $t('authentication.invalidCredentials');
    }
    case 'ADMIN.AUTH.INVALID_TICKET': {
      return $t('authentication.invalidTicket');
    }
    case 'ADMIN.AUTH.INVALID_TOTP': {
      return $t('authentication.invalidTotp');
    }
    default: {
      return payload.error?.message || payload.message || `请求失败(${status})`;
    }
  }
}

function isUnauthorizedRequestError(error: unknown) {
  return error instanceof HttpRequestError && error.status === 401;
}

async function request<T>(url: string, config: RequestConfig = {}) {
  const method = config.method || 'GET';
  const headers = new Headers(config.headers);
  const accessToken = getAccessToken();

  headers.set('Accept-Language', getLocale());
  headers.set('Accept', 'application/json');
  Object.entries(getAuthHeader(accessToken)).forEach(([key, value]) =>
    headers.set(key, value),
  );

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

  const payload = (await parseJSON(response)) as
    | ErrorEnvelope
    | SuccessEnvelope<T>;
  if (!response.ok) {
    const errorPayload = payload as ErrorEnvelope;
    const errorMessage = resolveErrorMessage(errorPayload, response.status);
    const errorCode = errorPayload.error?.code;
    const isUnauthorized = response.status === 401;

    if (config.showErrorMessage !== false) {
      message.error(errorMessage);
    }
    if (isUnauthorized && accessToken) {
      const accessStore = useAccessStore();
      accessStore.setLoginExpired(true);
    }

    throw new HttpRequestError(errorMessage, {
      code: errorCode,
      status: response.status,
    });
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
export { HttpRequestError, isUnauthorizedRequestError };
