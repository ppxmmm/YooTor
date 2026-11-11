import { test, expect, type Page } from '@playwright/test';

async function demo(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'ทดลองใช้งานระบบ' }).click();
  await expect(page).toHaveURL(/\/app/);
}

test('two recipients, allocation history, draft creation and persistence', async ({ page }) => {
  await demo(page);
  await page.goto('/app/contacts');
  for (const name of ['ลูกตัวอย่าง ก', 'ลูกตัวอย่าง ข']) {
    await page.getByRole('button', { name: 'เพิ่มผู้ติดต่อ', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('ชื่อและนามสกุล').fill(name);
    await dialog.getByLabel('ความสัมพันธ์', { exact: true }).fill('บุตร');
    await dialog.getByRole('button', { name: 'บันทึกข้อมูล' }).click();
    await expect(dialog).toHaveCount(0);
  }
  await page.goto('/app/assets');
  await page.getByRole('button', { name: 'เพิ่มทรัพย์สิน', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('ชื่อทรัพย์สิน').fill('บ้านตัวอย่างสำหรับร่าง');
  await dialog.getByLabel('เลขอ้างอิง / ที่ตั้ง').fill('โฉนดตัวอย่าง 123');
  await dialog.getByRole('button', { name: 'บันทึกข้อมูล' }).click();
  await expect(dialog).toHaveCount(0);
  const row = page.locator('article').filter({ has: page.getByRole('heading', { name: 'บ้านตัวอย่างสำหรับร่าง' }) });
  await expect(row).toContainText('ยังไม่ได้เลือกผู้รับ');
  await row.getByRole('button', { name: 'จัดสรร บ้านตัวอย่างสำหรับร่าง' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('ลูกตัวอย่าง ก', { exact: true }).check();
  await dialog.getByLabel('สัดส่วนของ ลูกตัวอย่าง ก (%)').fill('60');
  await dialog.getByLabel('ลูกตัวอย่าง ข', { exact: true }).check();
  await dialog.getByLabel('สัดส่วนของ ลูกตัวอย่าง ข (%)').fill('40');
  await dialog.getByRole('button', { name: 'บันทึกข้อมูล' }).click();
  await expect(row).toContainText('ระบุผู้รับและสัดส่วนครบ');
  await expect(row).toContainText('ลูกตัวอย่าง ก: 60%');
  await page.getByText(/ประวัติการเปลี่ยนแปลงทรัพย์สินและผู้รับ/).click();
  await expect(page.getByText('สัดส่วนผู้รับ (%): ยังไม่ระบุ → ลูกตัวอย่าง ก 60%, ลูกตัวอย่าง ข 40%')).toBeVisible();
  await page.reload();
  await expect(row).toContainText('ลูกตัวอย่าง ข: 40%');
  await page.goto('/app/instructions');
  await page.getByRole('button', { name: /เตรียมฉบับร่างพินัยกรรม/ }).click();
  await page.getByLabel('บ้านตัวอย่างสำหรับร่าง').check();
  await page.getByLabel('ชื่อและนามสกุลผู้ทำพินัยกรรม').fill('เจ้าของตัวอย่าง');
  await page.getByLabel('วันที่จัดทำ').fill('2026-11-11');
  await page.getByLabel('สถานที่จัดทำ').fill('กรุงเทพ');
  await page.getByLabel('ผู้ที่ประสงค์ให้เป็นผู้จัดการมรดก').fill('ผู้จัดการตัวอย่าง');
  await page.getByRole('button', { name: 'สร้างข้อความฉบับร่าง' }).click();
  await expect(page.getByLabel('ทบทวนและแก้ไขฉบับร่าง')).toHaveValue(/ลูกตัวอย่าง ก สัดส่วน 60% และ ลูกตัวอย่าง ข สัดส่วน 40%/);
  await page.getByRole('button', { name: 'บันทึกฉบับร่าง', exact: true }).click();
  await expect(page.getByText('บันทึกในรายการฉบับร่างและความประสงค์ด้านล่างแล้ว')).toBeVisible();
  await page.reload();
  await expect(page.locator('tbody')).toContainText('บ้านตัวอย่างสำหรับร่าง');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app/assets');
  await expect(page.getByRole('heading', { name: 'แผนส่งต่อทรัพย์สิน' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '/private/tmp/yootor-allocation-mobile.png', fullPage: true });
});

test('legacy insurance conversion preserves original notes', async ({ page }) => {
  await demo(page);
  await page.goto('/app/assets');
  await page.getByRole('button', { name: 'เพิ่มทรัพย์สิน', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('ชื่อทรัพย์สิน').fill('กรมธรรม์เก่าตัวอย่าง');
  await dialog.locator('select[name="category"]').selectOption('insurance');
  await dialog.getByLabel('หมายเหตุ').fill('ผู้เอาประกัน: เจ้าของตัวอย่าง\nผู้รับประโยชน์: ลูกตัวอย่าง');
  await dialog.getByRole('button', { name: 'บันทึกข้อมูล' }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'แก้ไข กรมธรรม์เก่าตัวอย่าง' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'เพิ่มรายละเอียดกรมธรรม์' }).click();
  await expect(dialog.getByLabel('ผู้เอาประกัน', { exact: true })).toHaveValue('เจ้าของตัวอย่าง');
  await dialog.getByRole('button', { name: 'บันทึกข้อมูล' }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'แก้ไข กรมธรรม์เก่าตัวอย่าง' }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('หมายเหตุ')).toHaveValue('ผู้เอาประกัน: เจ้าของตัวอย่าง\nผู้รับประโยชน์: ลูกตัวอย่าง');
  await expect(dialog.getByLabel('ผู้เอาประกัน', { exact: true })).toHaveValue('เจ้าของตัวอย่าง');
});
