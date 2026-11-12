import { expect, test } from '@playwright/test';

test('workspace navigation remains responsive while state refresh is delayed', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ทดลองใช้งานระบบ' }).click();
  await expect(page.getByRole('button', { name: 'ทดลองมุมมองครอบครัว' })).toBeVisible();
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/api/state', async (route) => {
    await waiting;
    await route.continue();
  });
  await page.getByRole('link', { name: 'ทรัพย์สินของฉัน' }).click();
  await expect(page).toHaveURL(/\/app\/assets$/);
  await expect(page.getByRole('heading', { name: 'ทรัพย์สินของฉัน' })).toBeVisible({ timeout: 1000 });
  await page.goBack();
  await expect(page).toHaveURL(/\/app$/);
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'ทรัพย์สินของฉัน' })).toBeVisible({ timeout: 1000 });
  release();
  await page.unrouteAll({ behavior: 'wait' });
});

test('navigation reflects a valid session and logout removes access', async ({ page }) => {
  await page.goto('/app/assets');
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/');
  await page.getByRole('button', { name: 'ทดลองใช้งานระบบ' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('button', { name: 'ทดลองมุมมองครอบครัว' })).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('link', { name: /เข้าสู่พื้นที่ของคุณ/ }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'ทดลองใช้งานระบบ' })).toHaveCount(0);
  await page.goto('/login');
  await expect(page).toHaveURL(/\/app$/);
  await page.goto('/register');
  await expect(page).toHaveURL(/\/app$/);
  await page.goto('/app/assets');
  await expect(page.getByRole('heading', { name: 'ทรัพย์สินของฉัน' })).toBeVisible();
  const unknown = await page.goto('/app/does-not-exist');
  expect(unknown?.status()).toBe(404);
  await page.goto('/app');
  await page.getByRole('button', { name: 'ออกจากระบบ' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('link', { name: 'เข้าสู่ระบบ', exact: true })).toBeVisible();
  await page.goto('/app/assets');
  await expect(page).toHaveURL(/\/login$/);
  expect((await page.request.get('/api/state')).status()).toBe(401);
});

test('an invalid session does not redirect the login page to the workspace', async ({ page, context, baseURL }) => {
  const url = new URL(baseURL!);
  await context.addCookies([{ name: 'saan_session', value: 'invalid', domain: url.hostname, path: '/' }]);
  await page.goto('/login');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'ยินดีต้อนรับกลับมา' })).toBeVisible();
  await page.goto('/app');
  await expect(page).toHaveURL(/\/login$/);
});

test('family navigation never shows owner menus while state is loading', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ทดลองใช้งานระบบ' }).click();
  await page.getByRole('button', { name: 'ทดลองมุมมองครอบครัว' }).click();
  await expect(page.getByText('พื้นที่ของครอบครัว', { exact: true })).toBeVisible();
  await page.route('**/api/state', async route => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    await route.continue();
  });
  for (const path of ['/app/tax', '/app/checklist', '/app/assistant']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel('กำลังโหลดข้อมูล')).toBeVisible();
    await expect(page.getByText('พื้นที่ของครอบครัว', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'ทรัพย์สินของฉัน' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'บุคคลที่ไว้วางใจ' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'คลังเอกสาร' })).toHaveCount(0);
    await expect(page.getByLabel('กำลังโหลดข้อมูล')).toBeHidden();
  }
  await page.unroute('**/api/state');
  await page.goto('/app/assets');
  await expect(page).toHaveURL(/\/app\/family$/);
  await expect(page.getByRole('link', { name: 'ทรัพย์สินของฉัน' })).toHaveCount(0);
  await page.getByRole('button', { name: 'สลับเป็นเจ้าของข้อมูลเพื่อพิจารณาคำขอ' }).click();
  await expect(page.getByRole('link', { name: 'ทรัพย์สินของฉัน' })).toBeVisible();
});
