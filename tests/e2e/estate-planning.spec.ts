import { test, expect } from '@playwright/test';
test('owner prepares taxes, reviews a will and records a life policy', async ({
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
  await page.getByRole('button', { name: /ตรวจพินัยกรรมที่มีอยู่/ }).click();
  await page.getByLabel('ประเภทพินัยกรรม').selectOption('ordinary');
  await page.getByLabel('ชื่อผู้ทำพินัยกรรม', { exact: true }).fill('ผู้ทำทดสอบ');
  await page.getByRole('button', { name: 'ถัดไป' }).click();
  await page.getByLabel('ชื่อผู้เขียนหรือผู้พิมพ์').fill('ผู้เขียนทดสอบ');
  await page.getByRole('button', { name: 'ถัดไป' }).click();
  await page.getByRole('button', { name: 'บันทึกและตรวจทาน' }).click();
  await expect(page.getByRole('heading', { name: 'มีประเด็นที่ควรตรวจเพิ่มเติม' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'ผลตรวจพินัยกรรม' })).toBeVisible();
  await expect(page.getByText('ผู้ทำทดสอบ · แบบธรรมดา')).toBeVisible();
  await page.getByRole('button', { name: 'ดูผลตรวจทาน' }).click();
  await page.getByRole('button', { name: 'ดูหรือแก้ไขคำตอบ' }).click();
  await expect(page.getByLabel('ชื่อผู้ทำพินัยกรรม', { exact: true })).toHaveValue('ผู้ทำทดสอบ');
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
  await expect(page.locator('tbody')).toContainText('••••ST-1');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app/instructions');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
