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
  ticket: string;
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
  const result = await requestClient.post<BackendLoginResult>('/auth/login', data);
  if (!result.requires_totp) {
    throw new Error('ConteBase 当前要求后台登录必须经过 TOTP 校验');
  }

  const challenge: AuthApi.LoginMFAChallengeResult = {
    mfaRequired: true,
    mfaTicket: result.ticket,
    mfaType: 'totp',
    ticketExpiresIn: 300,
  };
  return challenge;
}

export async function verifyTotpApi(
  data: AuthApi.VerifyTotpParams,
): Promise<AuthApi.VerifyTotpResult> {
  const result = await requestClient.post<BackendVerifyResult>('/auth/totp/verify', {
    code: data.totpCode,
    ticket: data.mfaTicket,
  });
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
  _data: AuthApi.ChangePasswordParams,
): Promise<{ ok: true }> {
  unsupportedAdminAccountAction('修改密码');
}

export async function getTotpStatusApi() {
  return {
    totpEnabled: true,
  };
}

export async function setupTotpApi(data?: {
  accountName?: string;
  issuer?: string;
}): Promise<{
  otpauthUrl: string;
  secretMasked: string;
  setupExpiresIn: number;
}> {
  void data;
  unsupportedAdminAccountAction('TOTP 配置');
}

export async function enableTotpApi(
  _data?: { totpCode: string },
): Promise<{ ok: true }> {
  unsupportedAdminAccountAction('启用 TOTP');
}

export async function disableTotpApi(
  _data?: { password: string; totpCode: string },
): Promise<{ ok: true }> {
  unsupportedAdminAccountAction('停用 TOTP');
}

export async function resetTotpApi(
  _data?: { targetAdminId: number | string },
): Promise<{ ok: true }> {
  unsupportedAdminAccountAction('重置 TOTP');
}

export async function getAccessCodesApi() {
  const result = await requestClient.get<{ items: string[] }>('/meta/permissions');
  return result.items || [];
}
