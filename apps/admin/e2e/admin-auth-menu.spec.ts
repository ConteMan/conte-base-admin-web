import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`missing required environment variable: ${name}`);
  }
  return value;
}

const adminUsername = requiredEnv('CONTE_BASE_E2E_ADMIN_USERNAME');
const adminPassword = requiredEnv('CONTE_BASE_E2E_ADMIN_PASSWORD');
const adminTotpSecret = requiredEnv('CONTE_BASE_E2E_ADMIN_TOTP_SECRET');

function base32Decode(input: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanInput = input.replaceAll('=', '').replaceAll(/\s+/g, '').toUpperCase();
  let bits = '';

  for (const char of cleanInput) {
    const value = alphabet.indexOf(char);
    if (value < 0) {
      throw new Error(`invalid base32 character: ${char}`);
    }
    bits += value.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }
  return Buffer.from(bytes);
}

async function currentTotpCode(secret: string) {
  const { createHmac } = await import('node:crypto');
  const counter = Math.floor(Date.now() / 1000 / 30);
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(counter / 0x1_0000_0000), 0);
  buffer.writeUInt32BE(counter & 0xffff_ffff, 4);

  const digest = createHmac('sha1', base32Decode(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binary % 1_000_000).padStart(6, '0');
}

async function submitPasswordLogin(page: Page, password = adminPassword) {
  await page.goto('/auth/login');
  await page.getByPlaceholder('请输入用户名').fill(adminUsername);
  await page.getByPlaceholder('密码').fill(password);
  await page.locator('button').filter({ hasText: '登录' }).click();
}

test('密码错误时在页面显示错误提示', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await submitPasswordLogin(page, `${adminPassword}-wrong`);

  await expect(page.getByText('用户名或密码错误')).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('TOTP 登录后加载后台菜单', async ({ page }) => {
  await submitPasswordLogin(page);
  await expect(page.getByText('二次验证')).toBeVisible();

  const code = await currentTotpCode(adminTotpSecret);
  const pinInputs = page.locator('input');
  await expect(pinInputs.first()).toBeVisible();

  const inputCount = await pinInputs.count();
  if (inputCount >= 6) {
    for (let index = 0; index < 6; index += 1) {
      await pinInputs.nth(index).fill(code[index]);
    }
  } else {
    await pinInputs.first().fill(code);
  }
  await page.locator('button').filter({ hasText: '验证并登录' }).click();

  await expect(page).toHaveURL(
    /\/(account\/settings|system|content|dashboard|workspace)/,
  );
  const sideMenu = page.getByRole('menu').first();
  await expect(sideMenu.getByText('内容管理')).toBeVisible();
  await expect(sideMenu.getByText('系统管理')).toBeVisible();
  await sideMenu.getByText('系统管理').click();
  await expect(sideMenu.getByText('后台用户')).toBeVisible();
  await expect(sideMenu.getByText('菜单管理')).toBeVisible();
  await expect(sideMenu.getByText('枚举管理')).toBeVisible();
});
