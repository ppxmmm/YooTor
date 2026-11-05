import { randomUUID } from 'node:crypto';
// Official/first-party sources checked 2026-11-05. These are conditional
// preparation steps, not a determination of heirs, authority or tax liability.
export function checklist(userId?: string) {
  const templates = [
    {
      title: 'แจ้งการเสียชีวิตและขอมรณบัตร',
      requiredDocuments: [
        'บัตรประชาชนผู้แจ้ง',
        'หนังสือรับรองการตาย (ถ้ามี)',
        'ทะเบียนบ้านและข้อมูลผู้เสียชีวิต',
      ],
      agency: 'สำนักทะเบียนอำเภอ / สำนักงานเขต',
      conditions:
        'โดยทั่วไปต้องแจ้งภายใน 24 ชั่วโมง กรณีตายนอกบ้าน ต่างประเทศ หรือเหตุผิดธรรมชาติมีขั้นตอนเพิ่มเติม ให้ตรวจสอบกับนายทะเบียนหรือตำรวจทันที',
      source: 'https://www.bora.dopa.go.th/callcenter1548/guidebook',
      nextAction:
        'ติดต่อนายทะเบียนในพื้นที่เกิดเหตุ เพื่อยืนยันผู้แจ้ง เอกสาร และกำหนดเวลาที่ใช้กับกรณีนี้',
    },
    {
      title: 'ตรวจสอบรายการทะเบียนบ้านหลังแจ้งตาย',
      requiredDocuments: ['มรณบัตร', 'ทะเบียนบ้าน', 'บัตรประชาชนผู้ติดต่อ'],
      agency: 'สำนักทะเบียนอำเภอ / สำนักงานเขต',
      conditions:
        'นายทะเบียนดำเนินการจำหน่ายรายการคนตายตามขั้นตอนการทะเบียน การเสียชีวิตไม่ได้ทำให้บ้านเปลี่ยนเจ้าของหรือให้สิทธิ์เข้าถึงข้อมูลส่วนตัวโดยอัตโนมัติ',
      source: 'https://stat.bora.dopa.go.th/callcenter1548/A121_voice.htm',
      nextAction: 'ตรวจสอบรายการและสอบถามการขอเอกสารรับรองกับสำนักทะเบียน',
    },
    {
      title: 'ประเมินว่าต้องร้องขอตั้งผู้จัดการมรดกหรือไม่',
      requiredDocuments: [
        'มรณบัตร',
        'เอกสารแสดงความสัมพันธ์ทายาท',
        'พินัยกรรม (ถ้ามี)',
        'รายการทรัพย์มรดก',
      ],
      agency: 'ศาลที่มีเขตอำนาจ / สำนักงานอัยการคุ้มครองสิทธิฯ',
      conditions:
        'ไม่ใช่ทุกกรณีต้องใช้ขั้นตอนเดียวกัน เขตอำนาจ ผู้มีสิทธิร้อง เอกสาร และความยินยอมขึ้นกับข้อเท็จจริง หากมีข้อพิพาทหรือผู้เยาว์ควรปรึกษาทนาย',
      source: 'https://www3.ago.go.th/center/lawplan/',
      nextAction:
        'รวบรวมบัญชีเครือญาติและเอกสาร แล้วขอคำแนะนำจากสำนักงานอัยการหรือทนายก่อนยื่นคำร้อง',
    },
    {
      title: 'ติดต่อธนาคารเกี่ยวกับบัญชีของผู้เสียชีวิต',
      requiredDocuments: [
        'มรณบัตร',
        'บัตรประชาชนผู้มีสิทธิติดต่อ',
        'สมุดบัญชีหรือข้อมูลบัญชีที่มี',
        'คำสั่งศาลและหนังสือรับรองคดีถึงที่สุด (หากธนาคารกำหนด)',
      ],
      agency: 'ธนาคารเจ้าของบัญชี',
      conditions:
        'เอกสารและวิธีจัดการแตกต่างตามธนาคาร ประเภทบัญชี และสิทธิของผู้ติดต่อ ไม่ควรใช้รหัสหรือบัตรของผู้เสียชีวิตทำรายการแทนการดำเนินการตามสิทธิ',
      source:
        'https://www.kasikornbank.com/th/kwealth/Pages/a1038-t4-evg-wealth-management-in-everybody-loves-me-when-im-dead-kgth.aspx',
      nextAction:
        'ติดต่อสาขาหรือช่องทางทางการ ขอรายการเอกสารเฉพาะกรณี และบันทึกชื่อเจ้าหน้าที่/วันที่ติดต่อ',
    },
    {
      title: 'ตรวจสอบสิทธิและแจ้งเรียกร้องประกันชีวิต',
      requiredDocuments: [
        'กรมธรรม์หรือเลขกรมธรรม์',
        'มรณบัตร',
        'หลักฐานยืนยันผู้รับประโยชน์',
        'เอกสารเพิ่มเติมตามเหตุการเสียชีวิต',
      ],
      agency: 'บริษัทประกันชีวิต / สำนักงาน คปภ.',
      conditions:
        'ผู้รับประโยชน์ ความคุ้มครอง ข้อยกเว้น และกำหนดส่งหลักฐานเป็นไปตามกรมธรรม์ ต้องยืนยันกับบริษัท ไม่รับรองว่าจะได้รับเงินหรือกำหนดเวลาตายตัว',
      source:
        'https://oiceservice.oic.or.th/document/Law/file/10388/10388_c468957628766ade647c6e370d253f83.pdf',
      nextAction:
        'ติดต่อบริษัทประกันโดยเร็ว เพื่อขอแบบคำร้องและยืนยันเอกสาร/กำหนดเวลาตามกรมธรรม์',
    },
    {
      title: 'ตรวจสอบหน้าที่ภาษีของผู้รับและกองมรดก',
      requiredDocuments: [
        'รายการทรัพย์สินที่ได้รับและหลักฐานมูลค่า',
        'ความสัมพันธ์กับเจ้ามรดก',
        'วันที่ได้รับมรดก',
        'รายการรายได้และเอกสารภาษีที่เกี่ยวข้อง',
      ],
      agency: 'กรมสรรพากร / ผู้เชี่ยวชาญภาษี',
      conditions:
        'ภาษีการรับมรดกกับภาษีเงินได้ของกองมรดกเป็นคนละเรื่อง การยกเว้น มูลค่า และกำหนดเวลาขึ้นกับข้อเท็จจริง ให้ผู้เชี่ยวชาญตรวจสอบก่อนยื่น ไม่ใช่ทุกครอบครัวมีภาษีการรับมรดก',
      source: 'https://www.rd.go.th/56657.html',
      nextAction:
        'เตรียมรายการแยกตามผู้รับ แล้วสอบถามสรรพากรถึงแบบและกำหนดเวลาที่ใช้กับกรณีนี้',
    },
  ];
  return templates.map((row) => ({
    ...row,
    id: randomUUID(),
    ...(userId ? { userId } : {}),
    status: 'not_started',
    notes: '',
    reviewedAt: '2026-11-05',
    templateVersion: '2026-11-05',
  }));
}
export function samplePdf() {
  const content =
    'BT /F1 18 Tf 50 750 Td (YooTor - SAMPLE DOCUMENT) Tj 0 -32 Td /F1 12 Tf (Synthetic data only. Not legally valid.) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((o) => String(o).padStart(10, '0') + ' 00000 n \n')
    .join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}
