import { requestClient } from '#/api/request';

export namespace AuthApi {
  export interface LoginParams {
    password: string;
    username: string;
  }

  export interface LoginSuccessResult {
    accessToken: string;
    mfaRequired: false;
    refreshToken: string;
    roles: string[];
  }

  export interface LoginMFAChallengeResult {
    mfaRequired: true;
    mfaTicket: string;
    mfaType: 'totp';
    ticketExpiresIn: number;
  }

  export type LoginResult = LoginMFAChallengeResult | LoginSuccessResult;

  export interface VerifyTotpParams {
    mfaTicket: string;
    totpCode: string;
  }

  export type VerifyTotpResult = LoginSuccessResult;

  export interface ChangePasswordParams {
    newPassword: string;
    oldPassword: string;
  }
}

interface BackendLoginResult {
  requires_totp: boolean;
  ticket?: string;
  access_token?: string;
  user?: {
    roles?: string[];
  };
}

interface BackendVerifyResult {
  access_token: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    roles: string[];
    locale: string;
  };
}

function unsupportedAdminAccountAction(actionName: string): never {
  throw new Error(`${actionName} 尚未接入后端能力`);
}

export async function loginApi(data: AuthApi.LoginParams): Promise<AuthApi.LoginResult> {
  const result = await requestClient.post<BackendLoginResult>('/auth/login', data, {
    showErrorMessage: false,
  });
  if (!result.requires_totp) {
    if (!result.access_token) {
      throw new Error('登录响应缺少 access_token');
    }
    return {
      accessToken: result.access_token,
      mfaRequired: false,
      refreshToken: '',
      roles: result.user?.roles || [],
    } satisfies AuthApi.LoginSuccessResult;
  }

  const challenge: AuthApi.LoginMFAChallengeResult = {
    mfaRequired: true,
    mfaTicket: result.ticket || '',
    mfaType: 'totp',
    ticketExpiresIn: 300,
  };
  if (!challenge.mfaTicket) {
    throw new Error('登录响应缺少 mfa ticket');
  }
  return challenge;
}

export async function verifyTotpApi(
  data: AuthApi.VerifyTotpParams,
): Promise<AuthApi.VerifyTotpResult> {
  const result = await requestClient.post<BackendVerifyResult>(
    '/auth/totp/verify',
    {
      code: data.totpCode,
      ticket: data.mfaTicket,
    },
    {
      showErrorMessage: false,
    },
  );
  return {
    accessToken: result.access_token,
    mfaRequired: false,
    refreshToken: '',
    roles: result.user.roles || [],
  } satisfies AuthApi.VerifyTotpResult;
}

export async function refreshTokenApi() {
  return {
    accessToken: '',
  };
}

export async function logoutApi() {
  return requestClient.post('/auth/logout');
}

export async function changePasswordApi(
  data: AuthApi.ChangePasswordParams,
): Promise<{ ok: true }> {
  return requestClient.put<{ ok: true }>('/auth/change-password', data);
}

export async function getTotpStatusApi() {
  return requestClient.get<{ totpEnabled: boolean }>('/auth/totp/status');
}

export async function setupTotpApi(data?: {
  accountName?: string;
  issuer?: string;
}): Promise<{
  otpauthUrl: string;
  secretMasked: string;
  setupExpiresIn: number;
}> {
  return requestClient.post<{
    otpauthUrl: string;
    secretMasked: string;
    setupExpiresIn: number;
  }>('/auth/totp/setup', {
    accountName: data?.accountName,
    issuer: data?.issuer,
  });
}

export async function enableTotpApi(
  data?: { totpCode: string },
): Promise<{ ok: true }> {
  return requestClient.post<{ ok: true }>('/auth/totp/enable', data);
}

export async function disableTotpApi(
  data?: { password: string; totpCode: string },
): Promise<{ ok: true }> {
  return requestClient.post<{ ok: true }>('/auth/totp/disable', data);
}

export async function resetTotpApi(
  data?: { targetAdminId: number | string },
): Promise<{ ok: true }> {
  if (!data?.targetAdminId) {
    unsupportedAdminAccountAction('重置 TOTP');
  }
  return requestClient.post<{ ok: true }>(
    `/admins/${data.targetAdminId}/reset-totp`,
  );
}

export async function getAccessCodesApi() {
  const result = await requestClient.get<{ items: string[] }>('/meta/permissions');
  return result.items || [];
}
