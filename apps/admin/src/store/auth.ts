import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import {
  getAccessCodesApi,
  getUserInfoApi,
  loginApi,
  logoutApi,
  verifyTotpApi,
} from '#/api';
import { $t } from '#/locales';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);
  const isLoggingOut = ref(false);

  async function completeLogin(
    loginResult: {
      accessToken: string;
      refreshToken: string;
      roles?: string[];
    },
    onSuccess?: () => Promise<void> | void,
  ) {
    const { accessToken, refreshToken, roles = [] } = loginResult;

    if (!accessToken) {
      throw new Error('登录响应缺少 accessToken');
    }

    // 存储 Access Token
    accessStore.setAccessToken(accessToken);

    // 存储 Refresh Token 用于无感续期
    accessStore.setRefreshToken(refreshToken || '');

    // 优先使用登录接口返回的角色，再由 /auth/me 返回值覆盖
    userStore.setUserRoles(roles);

    // 获取用户信息并存储到 userStore 中
    const userInfo = await fetchUserInfo(roles);

    // 加载权限码用于按钮级权限控制
    try {
      const accessCodes = await getAccessCodesApi();
      accessStore.setAccessCodes(accessCodes || []);
    } catch {
      accessStore.setAccessCodes([]);
    }

    if (accessStore.loginExpired) {
      accessStore.setLoginExpired(false);
    } else {
      onSuccess
        ? await onSuccess?.()
        : await router.push(userInfo.homePath || preferences.app.defaultHomePath);
    }

    if (userInfo?.realName) {
      notification.success({
        description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
        duration: 3,
        message: $t('authentication.loginSuccess'),
      });
    }

    return userInfo;
  }

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    // 异步处理用户登录操作并获取 accessToken
    let userInfo: null | UserInfo = null;
    let mfaChallenge: null | {
      mfaRequired: true;
      mfaTicket: string;
      mfaType: 'totp';
      ticketExpiresIn: number;
    } = null;

    try {
      loginLoading.value = true;
      const loginResult = await loginApi(params as Parameters<typeof loginApi>[0]);

      if (loginResult?.mfaRequired) {
        mfaChallenge = loginResult;
      } else {
        userInfo = await completeLogin(loginResult, onSuccess);
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      mfaChallenge,
      userInfo,
    };
  }

  async function verifyTotpLogin(
    params: {
      mfaTicket: string;
      totpCode: string;
    },
    onSuccess?: () => Promise<void> | void,
  ) {
    let userInfo: null | UserInfo = null;

    try {
      loginLoading.value = true;
      const loginResult = await verifyTotpApi(params);
      userInfo = await completeLogin(loginResult, onSuccess);
    } finally {
      loginLoading.value = false;
    }

    return { userInfo };
  }

  /**
   * 管理员登出
   * 调用后端接口吊销 Refresh Token，清除本地状态并跳转登录页
   */
  async function logout(redirect: boolean = true) {
    if (isLoggingOut.value) {
      return;
    }
    isLoggingOut.value = true;
    try {
      await logoutApi();
    } catch {
      // 即使后端登出失败也继续清除本地状态
    }

    // 构建带重定向的参数
    const redirectUrl = redirect
      ? `${LOGIN_PATH}?redirect=${encodeURIComponent(router.currentRoute.value.fullPath)}`
      : LOGIN_PATH;

    // 清空状态必须在彻底离开当前单页环境或硬刷新前，不能同步清空，否则当前渲染组件将由于拿不到数据爆空指针白屏
    // 直接采用最安全的 window.location.href 触发硬跳转卸载 Vue 实例，并顺带清除内存中的所有闭包与 Pinia 状态
    resetAllStores();
    accessStore.setLoginExpired(false);
    
    // 强制触发一次原生重定向离开系统，浏览器自身会进行内存清理与重新装载
    window.location.href = redirectUrl;
    
    // 如果后续代码执行，这把锁理论上不会有复位价值了，因为已经跳转销毁。
    // 为了容错，在极短的延迟后解锁（比如针对并不执行 href 的特殊单测场景）。
    setTimeout(() => {
      isLoggingOut.value = false;
    }, 1000);
  }

  /**
   * 获取当前管理员用户信息
   */
  async function fetchUserInfo(fallbackRoles: string[] = []) {
    let userInfo: null | UserInfo = null;
    userInfo = await getUserInfoApi(fallbackRoles);
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  /** 重置状态 */
  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
    verifyTotpLogin,
  };
});
