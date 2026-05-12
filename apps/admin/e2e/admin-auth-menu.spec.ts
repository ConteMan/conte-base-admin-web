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
const adminTotpSecret = process.env.CONTE_BASE_E2E_ADMIN_TOTP_SECRET?.trim() || '';

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

async function loginAsAdmin(page: Page) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await submitPasswordLogin(page);

    const nextStep = await Promise.race([
      page
        .waitForURL(/\/(account\/settings|system|content|dashboard|workspace)/, {
          timeout: 5_000,
        })
        .then(() => 'authenticated' as const),
      page
        .getByText('二次验证')
        .waitFor({ state: 'visible', timeout: 5_000 })
        .then(() => 'totp' as const),
    ]);

    if (nextStep === 'authenticated') {
      return;
    }

    if (!adminTotpSecret) {
      throw new Error(
        '当前测试账号已启用 2FA，但未提供 CONTE_BASE_E2E_ADMIN_TOTP_SECRET。',
      );
    }

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

    try {
      await expect(page).toHaveURL(
        /\/(account\/settings|system|content|dashboard|workspace)/,
        { timeout: 5_000 },
      );
      return;
    } catch (error) {
      if (attempt === 1) {
        throw error;
      }
    }
  }
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

test('登录后加载后台菜单', async ({ page }) => {
  await loginAsAdmin(page);

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

test('账号设置页保留系统菜单上下文', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/account/settings');

  await expect(page).toHaveURL(/\/account\/settings/);
  const sideMenu = page.getByRole('menu').first();
  await expect(sideMenu.getByText('系统管理')).toBeVisible();
  await expect(sideMenu.getByText('内容管理')).toBeVisible();
  await expect(
    page.locator('[id="__vben_main_content"]').getByText('账号设置'),
  ).toBeVisible();
});

test('枚举管理页可查看只读枚举详情', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/system/enum-registry');

  await expect(page).toHaveURL(/\/system\/enum-registry/);
  await expect(page.getByText('即将推出')).toHaveCount(0);
  await page.getByPlaceholder('请输入枚举名称，例如 admin_status').fill('audit_log_action');
  await page.getByRole('button', { name: '搜 索' }).click();
  await expect(page.getByText('audit_log_action')).toBeVisible();
  await page.getByRole('button', { name: '详情' }).click();

  await expect(page.getByText('枚举目录详情 - audit_log_action')).toBeVisible();
  await expect(page.getByText('admin.delete')).toBeVisible();
  await expect(page.getByRole('button', { name: '新增' })).toHaveCount(0);
});

test('菜单管理创建删除后审计日志显示正确操作类型', async ({ page }) => {
  const title = `E2E菜单-${Date.now()}`;
  const saveButton = page.getByRole('button', { name: /保\s*存/ });
  const searchButton = page.getByRole('button', { name: /搜\s*索/ });

  await loginAsAdmin(page);
  await page.goto('/system/menu');

  await page.getByRole('button', { name: '新增菜单' }).click();
  await page.getByPlaceholder('例如：菜单管理').fill(title);
  await saveButton.click();
  await expect(page.getByText('菜单创建成功')).toBeVisible();
  await expect(page.getByText(title)).toBeVisible();

  const titleRow = page.locator('tr').filter({ hasText: title }).first();
  const rowIndex = await titleRow.evaluate((node) => {
    const parent = node.parentElement;
    return parent ? Array.from(parent.children).indexOf(node) : -1;
  });
  await page.getByRole('button', { name: '删除' }).nth(rowIndex).click();
  await page.getByRole('button', { name: /删\s*除/ }).last().click();
  await expect(page.getByText('菜单删除成功')).toBeVisible();

  await page.goto('/system/audit-log');
  await page.getByRole('textbox', { name: '关键字' }).fill(title);
  await searchButton.click();

  await expect(page.getByText(title)).toBeVisible();
  await expect(page.getByText('创建菜单').first()).toBeVisible();
  await page.getByRole('button', { name: /重\s*置/ }).click();
  await expect(page.getByText('删除菜单').first()).toBeVisible();
});
