import { test, expect } from '@playwright/test';

test('family submits a simulated request and evidence for owner review', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ทดลองใช้งานระบบ' }).click();
  await page.getByRole('button', { name: 'ทดลองมุมมองครอบครัว' }).click();
  await expect(page.getByRole('heading', { name: 'พื้นที่ครอบครัว' })).toBeVisible();
  await page.getByLabel('อีเมลเจ้าของข้อมูล').fill('somchai@example.test');
  await page.getByRole('button', { name: 'ส่งคำขอเข้าถึง' }).click();
  await expect(page.getByText('หลักฐานจำลองเท่านั้น', { exact: false })).toBeVisible();
  await page.getByLabel('เพิ่มหลักฐานตัวอย่าง').setInputFiles({ name: 'sample.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nexample\n%%EOF') });
  await page.getByRole('button', { name: 'อัปโหลดหลักฐานตัวอย่าง' }).click();
  await expect(page.getByRole('link', { name: 'sample.pdf' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: 'sample.pdf' })).toBeVisible();
  await page.getByRole('button', { name: 'สลับเป็นเจ้าของข้อมูลเพื่อพิจารณาคำขอ' }).click();
  await expect(page.getByRole('link', { name: 'sample.pdf' })).toBeVisible();
  await page.getByRole('button', { name: 'ตรวจสอบคำขอ' }).click();
  const dialog = page.getByRole('dialog', { name: 'จำลองการตรวจสอบคำขอ' });
  await expect(dialog).toContainText('ยังไม่มีเจ้าหน้าที่หรือการยืนยันตัวตนจริง');
  await dialog.locator('select[name="status"]').selectOption('manual_review');
  await dialog.getByRole('button', { name: 'ยืนยันผลการตรวจสอบ' }).click();
  await expect(page.getByText('ตรวจสอบโดยเจ้าหน้าที่', { exact: true })).toBeVisible();
});
