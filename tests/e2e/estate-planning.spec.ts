import { test, expect } from '@playwright/test';
test('owner prepares taxes, saves a will and records a life policy', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ทดลองใช้งานระบบ' }).click();
  await expect(page).toHaveURL(/\/app/);
  await page.goto('/app/tax');
  await expect(
    page.getByRole('heading', { name: 'จัดการภาษีของเจ้ามรดก' }),
  ).toBeVisible();
  const tax = page.getByLabel(
    'รวบรวมเงินเดือน ค่าเช่า ดอกเบี้ย และรายได้อื่นตลอดปีที่เสียชีวิต',
  );
  await tax.check();
  await page.reload();
  await expect(tax).toBeChecked();
  await page.goto('/app/instructions');
  await page.getByLabel('ชื่อและนามสกุลผู้ทำพินัยกรรม').fill('ผู้ทำทดสอบ');
  await page.getByLabel('วันที่จัดทำ').fill('2026-11-05');
  await page.getByLabel('สถานที่จัดทำ').fill('กรุงเทพฯ');
  await page
    .getByLabel('ผู้ที่ประสงค์ให้เป็นผู้จัดการมรดก')
    .fill('ผู้จัดการทดสอบ');
  await page
    .getByLabel('ทรัพย์สิน ผู้รับ และสัดส่วนที่ต้องการยกให้')
    .fill('บ้านเลขที่ 1 ให้บุตรสาวทั้งหมด');
  await page.getByRole('button', { name: 'สร้างฉบับร่างพินัยกรรม' }).click();
  await expect(page.getByLabel('ทบทวนและแก้ไขฉบับร่าง')).toHaveValue(
    /บ้านเลขที่ 1/,
  );
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'ดาวน์โหลดฉบับร่าง (.txt)' }).click();
  expect((await downloadEvent).suggestedFilename()).toBe(
    'YooTor-will-draft.txt',
  );
  await page
    .getByRole('button', { name: 'บันทึกพินัยกรรมฉบับร่าง', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText(
    'บันทึกข้อมูลเรียบร้อยแล้ว',
  );
  await page.reload();
  await expect(page.locator('tbody')).toContainText('พินัยกรรมฉบับร่าง');
  await page.goto('/app/assets');
  await page
    .getByText('รวบรวมกรมธรรม์ประกันชีวิต — เพิ่มข้อมูลกรมธรรม์')
    .click();
  await page.getByLabel('บริษัทประกัน', { exact: true }).fill('บริษัททดสอบ');
  await page.getByLabel('เลขกรมธรรม์', { exact: true }).fill('POLICY-TEST-1');
  await page
    .getByLabel('ผู้เอาประกัน', { exact: true })
    .fill('ผู้เอาประกันทดสอบ');
  await page.getByLabel('ผู้รับประโยชน์ตามกรมธรรม์').fill('ผู้รับทดสอบ');
  await page.getByLabel('ทุนประกัน (บาท)').fill('100000');
  await page.getByLabel('ช่องทางติดต่อบริษัท / ตัวแทน').fill('บริษัททดสอบ');
  await page
    .getByLabel('ที่เก็บเอกสารกรมธรรม์', { exact: true })
    .fill('คลังเอกสาร');
  await page
    .getByRole('button', { name: 'บันทึกกรมธรรม์', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText(
    'บันทึกข้อมูลเรียบร้อยแล้ว',
  );
  await page.reload();
  await expect(page.locator('tbody')).toContainText('POLICY-TEST-1');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app/instructions');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
