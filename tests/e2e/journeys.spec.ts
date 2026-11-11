import { test, expect, type Page } from '@playwright/test';

async function demo(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'ทดลองใช้งานระบบ' }).click();
  await expect(page).toHaveURL(/\/app/);
  await expect(
    page.getByRole('button', { name: 'ทดลองมุมมองครอบครัว' }),
  ).toBeVisible();
}
async function saved(page: Page) {
  await expect(page.getByRole('status')).toContainText(
    'บันทึกข้อมูลเรียบร้อยแล้ว',
  );
}

test('owner creates, edits, searches and deletes a persisted synthetic asset', async ({
  page,
}) => {
  await demo(page);
  await page.screenshot({
    path: '/private/tmp/yootor-desktop.png',
    fullPage: true,
  });
  await page.goto('/app/assets');
  await page
    .getByRole('button', { name: 'เพิ่มทรัพย์สิน', exact: true })
    .click();
  await page
    .getByLabel('ชื่อทรัพย์สิน', { exact: true })
    .fill('ทรัพย์สินทดสอบสังเคราะห์');
  await page.locator('select[name="category"]').selectOption('bank');
  await page.getByLabel('มูลค่าโดยประมาณ (บาท)').fill('12345');
  await page.getByRole('button', { name: 'บันทึกข้อมูล', exact: true }).click();
  await page
    .getByRole('button', {
      name: 'แก้ไข ทรัพย์สินทดสอบสังเคราะห์',
      exact: true,
    })
    .click();
  await page
    .getByLabel('ชื่อทรัพย์สิน', { exact: true })
    .fill('ทรัพย์สินสังเคราะห์แก้ไข');
  await page.getByRole('button', { name: 'บันทึกข้อมูล', exact: true }).click();
  await saved(page);
  await page.reload();
  await page.getByLabel('ค้นหารายการ').fill('ทรัพย์สินสังเคราะห์แก้ไข');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('12,345');
  page.once('dialog', (dialog) => dialog.accept());
  await page
    .getByRole('button', { name: 'ลบ ทรัพย์สินสังเคราะห์แก้ไข', exact: true })
    .click();
  await expect(page.getByText('ยังไม่มีรายการ', { exact: true })).toBeVisible();
});

test('owner uploads and downloads a PDF, while an anonymous browser is denied', async ({
  page,
  playwright,
}) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  await demo(page);
  await page.goto('/app/documents');
  const seeded = page.locator('article').filter({
    has: page.getByRole('heading', {
      name: 'สำเนาทะเบียนบ้าน (ตัวอย่าง)',
      exact: true,
    }),
  });
  await seeded.getByRole('button', { name: 'ดูเอกสาร', exact: true }).click();
  const preview = page.getByRole('dialog', {
    name: 'สำเนาทะเบียนบ้าน (ตัวอย่าง)',
    exact: true,
  });
  const canvas = preview.getByRole('img', {
    name: 'สำเนาทะเบียนบ้าน (ตัวอย่าง) หน้า 1',
    exact: true,
  });
  await expect(canvas).toBeVisible();
  await expect(preview.getByText('กำลังเตรียมตัวอย่างเอกสาร…')).toHaveCount(0);
  await expect(preview.getByRole('alert')).toHaveCount(0);
  expect(
    await canvas.evaluate((element) => ({
      width: (element as HTMLCanvasElement).width,
      height: (element as HTMLCanvasElement).height,
    })),
  ).toEqual({ width: expect.any(Number), height: expect.any(Number) });
  expect(
    await canvas.evaluate(
      (element) =>
        (element as HTMLCanvasElement).width > 0 &&
        (element as HTMLCanvasElement).height > 0,
    ),
  ).toBe(true);
  await expect(preview.getByText('หน้า 1 / 1', { exact: true })).toBeVisible();
  await preview.screenshot({ path: '/private/tmp/yootor-pdf-preview.png' });
  expect(browserErrors).toEqual([]);
  await preview.getByRole('button', { name: 'ปิด', exact: true }).click();
  await page
    .getByRole('button', { name: 'อัปโหลดเอกสาร', exact: true })
    .click();
  await page
    .getByLabel('ชื่อเอกสาร', { exact: true })
    .fill('เอกสารทดสอบสังเคราะห์');
  // Use the valid seeded one-page PDF, without introducing personal documents.
  const state = await (await page.request.get('/api/state')).json();
  const sample = await page.request.get(
    `/api/documents/${state.documents[0].id}`,
  );
  await page.locator('input[type="file"]').setInputFiles({
    name: 'synthetic.pdf',
    mimeType: 'application/pdf',
    buffer: await sample.body(),
  });
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'อัปโหลดเอกสาร', exact: true })
    .click();
  const card = page.locator('article').filter({
    has: page.getByRole('heading', {
      name: 'เอกสารทดสอบสังเคราะห์',
      exact: true,
    }),
  });
  await expect(card).toBeVisible();
  const href = await card
    .getByRole('link', { name: 'ดาวน์โหลด', exact: true })
    .getAttribute('href');
  const downloadPromise = page.waitForEvent('download');
  await card.getByRole('link', { name: 'ดาวน์โหลด', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('synthetic.pdf');
  expect(await download.failure()).toBeNull();
  const anonymous = await playwright.request.newContext({
    baseURL: 'http://localhost:3000',
  });
  expect((await anonymous.get(href!)).status()).toBe(401);
  await anonymous.dispose();
});

test('owner saves a trusted synthetic contact and edits an instruction', async ({
  page,
}) => {
  await demo(page);
  await page.goto('/app/contacts');
  await page
    .getByRole('button', { name: 'เพิ่มผู้ติดต่อ', exact: true })
    .click();
  await page
    .getByLabel('ชื่อและนามสกุล', { exact: true })
    .fill('ผู้ติดต่อสังเคราะห์');
  await page.getByLabel('ความสัมพันธ์', { exact: true }).fill('ข้อมูลทดสอบ');
  await page
    .getByLabel('อีเมล', { exact: true })
    .fill('synthetic@example.test');
  await page.getByLabel('สถานะผู้ติดต่อ').selectOption('active');
  await page.getByLabel('ทรัพย์สิน', { exact: true }).check();
  await page.getByRole('button', { name: 'บันทึกข้อมูล', exact: true }).click();
  await expect(page.locator('tbody')).toContainText('ผู้ติดต่อสังเคราะห์');
  await page.goto('/app/instructions');
  await page
    .getByRole('button', { name: 'แก้ไข ความตั้งใจถึงครอบครัว', exact: true })
    .click();
  await page
    .getByLabel('ข้อความถึงคนสำคัญ')
    .fill('ข้อความสังเคราะห์สำหรับทดสอบการบันทึก');
  await page.getByRole('button', { name: 'บันทึกข้อมูล', exact: true }).click();
  await saved(page);
  await page.reload();
  await page
    .getByRole('button', { name: 'แก้ไข ความตั้งใจถึงครอบครัว', exact: true })
    .click();
  await expect(page.getByLabel('ข้อความถึงคนสำคัญ')).toHaveValue(
    'ข้อความสังเคราะห์สำหรับทดสอบการบันทึก',
  );
});

test('family requests access, receives only assets, and persists its checklist progress', async ({
  page,
}) => {
  await demo(page);
  await page.getByRole('button', { name: 'ทดลองมุมมองครอบครัว' }).click();
  await expect(
    page.getByRole('button', { name: 'สลับเป็นเจ้าของข้อมูลเพื่อพิจารณาคำขอ' }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/app\/family$/);
  await page.getByLabel('อีเมลเจ้าของข้อมูล').fill('somchai@example.test');
  await page
    .getByRole('button', { name: 'ส่งคำขอเข้าถึง', exact: true })
    .click();
  await saved(page);
  await expect(
    page.getByRole('link', { name: 'ดาวน์โหลด', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'สลับเป็นเจ้าของข้อมูลเพื่อพิจารณาคำขอ' })
    .click();
  await page.getByRole('button', { name: 'ตรวจสอบคำขอ', exact: true }).click();
  await page.getByLabel('ผลการตรวจสอบ').selectOption('approved');
  await page.locator('input[name="permissions"][value="documents"]').uncheck();
  await page
    .locator('input[name="permissions"][value="instructions"]')
    .uncheck();
  await page
    .getByRole('button', { name: 'ยืนยันผลการตรวจสอบ', exact: true })
    .click();
  await saved(page);
  await page.getByRole('button', { name: 'ทดลองมุมมองครอบครัว' }).click();
  await expect(
    page.getByRole('heading', { name: 'ข้อมูลที่ได้รับอนุญาต' }),
  ).toBeVisible();
  await expect(
    page.getByText('บ้านพักอาศัย กรุงเทพฯ', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'ดาวน์โหลด', exact: true }),
  ).toHaveCount(0);
  const state = await (await page.request.get('/api/state')).json();
  expect(state.assets.length).toBeGreaterThan(0);
  expect(state.documents).toEqual([]);
  expect(state.instructions).toEqual([]);
  await page.goto('/app/checklist');
  const task = page.locator('details.wp-task').first();
  await task.locator('summary').click();
  await task
    .getByRole('combobox', { name: 'สถานะ', exact: true })
    .selectOption('completed');
  await task.getByLabel('บันทึกเพิ่มเติม').fill('ข้อมูลทดสอบ: ดำเนินการแล้ว');
  await task.getByRole('button', { name: 'บันทึกความคืบหน้า' }).click();
  await saved(page);
  await page.reload();
  await task.locator('summary').click();
  await expect(
    task.getByRole('combobox', { name: 'สถานะ', exact: true }),
  ).toHaveValue('completed');
  await expect(task.getByLabel('บันทึกเพิ่มเติม')).toHaveValue(
    'ข้อมูลทดสอบ: ดำเนินการแล้ว',
  );
});

test('assistant answers with a source and tax questionnaire persists on this browser', async ({
  page,
}) => {
  await demo(page);
  await page.goto('/app/assistant');
  await page
    .getByLabel('ข้อความถึงผู้ช่วย')
    .fill('ต้องเตรียมข้อมูลบัญชีธนาคารอย่างไร');
  await page.getByRole('button', { name: 'ส่งข้อความ', exact: true }).click();
  const answer = page.locator('.wp-message.assistant');
  await expect(answer).toContainText('โหมด:');
  await expect(answer.getByRole('link')).toHaveAttribute('href', /^https:\/\//);
  await page.goto('/app/tax');
  await page
    .getByRole('combobox', { name: 'เลือกสถานการณ์', exact: true })
    .selectOption('inherited');
  await page.getByLabel('ทรัพย์สินที่เกี่ยวข้อง').selectOption('financial');
  await page.getByLabel('รวบรวมรายการทรัพย์สินและหลักฐานมูลค่า').check();
  await page.reload();
  await expect(
    page.getByRole('combobox', { name: 'เลือกสถานการณ์', exact: true }),
  ).toHaveValue('inherited');
  await expect(page.getByLabel('ทรัพย์สินที่เกี่ยวข้อง')).toHaveValue(
    'financial',
  );
  await expect(
    page.getByLabel('รวบรวมรายการทรัพย์สินและหลักฐานมูลค่า'),
  ).toBeChecked();
});

test('new owner registers, saves profile and uses the mobile navigation without overflow', async ({
  page,
}) => {
  await page.goto('/register');
  await page
    .getByLabel('ชื่อและนามสกุล', { exact: true })
    .fill('เจ้าของสังเคราะห์');
  await page
    .getByLabel('อีเมล', { exact: true })
    .fill(`synthetic-${Date.now()}@example.test`);
  await page
    .getByLabel('รหัสผ่าน', { exact: true })
    .fill('Synthetic-test-password-2026');
  await page.getByRole('button', { name: 'ถัดไป', exact: true }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'สร้างบัญชีและเริ่มวางแผน' }).click();
  await expect(page).toHaveURL(/\/app\/?$/);
  await page.goto('/app/settings');
  await page
    .getByLabel('ชื่อและนามสกุล', { exact: true })
    .fill('เจ้าของสังเคราะห์แก้ไข');
  await page.getByRole('button', { name: 'บันทึกการเปลี่ยนแปลง' }).click();
  await saved(page);
  await page.reload();
  await expect(page.getByLabel('ชื่อและนามสกุล', { exact: true })).toHaveValue(
    'เจ้าของสังเคราะห์แก้ไข',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app');
  await page.getByRole('button', { name: 'เปิดเมนู', exact: true }).click();
  await page
    .getByRole('link', { name: 'ทรัพย์สินของฉัน', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'ทรัพย์สินของฉัน', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: '/private/tmp/yootor-mobile.png',
    fullPage: true,
  });
});

test('mock account autofill populates auth forms and only signs in after confirmation', async ({
  page,
}) => {
  await page.goto('/login');
  await page
    .getByRole('button', { name: 'กรอกข้อมูลตัวอย่าง', exact: true })
    .click();
  await expect(page.getByLabel('อีเมล', { exact: true })).toHaveValue(
    'somchai@example.test',
  );
  await expect(page.getByLabel('รหัสผ่าน', { exact: true })).toHaveValue(
    'YooTor-demo-2026',
  );
  await expect(page).toHaveURL(/\/login$/);
  const auth = page.waitForRequest(
    (request) =>
      request.url().endsWith('/api/auth') && request.method() === 'POST',
  );
  await page
    .getByRole('button', { name: 'เข้าสู่ระบบตัวอย่าง', exact: true })
    .click();
  expect((await auth).postDataJSON()).toEqual({
    action: 'demo',
    role: 'OWNER',
  });
  await expect(page).toHaveURL(/\/app\/?$/);
  await expect(
    page.getByRole('button', { name: 'ทดลองมุมมองครอบครัว', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'ออกจากระบบ' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/register');
  await page
    .getByRole('button', { name: 'กรอกข้อมูลตัวอย่าง', exact: true })
    .click();
  await expect(page.getByLabel('ชื่อและนามสกุล', { exact: true })).toHaveValue(
    'สมชาย ใจดี',
  );
  const firstEmail = await page
    .getByLabel('อีเมล', { exact: true })
    .inputValue();
  expect(firstEmail).toMatch(/^somchai-demo-.*@example\.test$/);
  await page
    .getByRole('button', { name: 'กรอกข้อมูลตัวอย่าง', exact: true })
    .click();
  expect(await page.getByLabel('อีเมล', { exact: true }).inputValue()).not.toBe(
    firstEmail,
  );
  await page.getByRole('button', { name: 'ถัดไป', exact: true }).click();
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  await expect(
    page.getByRole('button', { name: 'สร้างบัญชีและเริ่มวางแผน', exact: true }),
  ).toBeVisible();
});
