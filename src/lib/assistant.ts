import { z } from 'zod';
import { ApiError, type createService } from './server';
type Source = { title: string; url: string; reviewedAt: string };
type Context = {
  assetCount: number;
  documentCount: number;
  assetTypes: string[];
};
type Category =
  'bank' | 'insurance' | 'tax' | 'property' | 'administrator' | 'general';
const source = (title: string, url: string): Source => ({
  title,
  url,
  reviewedAt: '2026-11-05',
});
const registration = source(
  'กรมการปกครอง: คู่มือการแจ้งตาย',
  'https://www.bora.dopa.go.th/callcenter1548/guidebook',
);
const inheritance = source(
  'กรมสรรพากร: ภาษีการรับมรดก',
  'https://www.rd.go.th/56657.html',
);
const guides: Record<Category, { steps: string[]; sources: Source[] }> = {
  bank: {
    steps: [
      'เตรียมมรณบัตร หลักฐานยืนยันตัวผู้ติดต่อ และข้อมูลบัญชีที่มี โดยไม่ต้องบอกรหัสผ่าน PIN หรือ OTP แก่ผู้ช่วย',
      'ติดต่อสาขาหรือช่องทางทางการของธนาคาร ขอรายการเอกสารและผู้มีสิทธิดำเนินการเฉพาะกรณี อาจต้องใช้คำสั่งศาลตั้งผู้จัดการมรดก หนังสือรับรองคดีถึงที่สุด หรือเอกสารอื่นตามประเภทบัญชี',
      'เก็บบันทึกการติดต่อและตรวจเอกสารกับธนาคารก่อนยื่น ไม่ใช้รหัสหรือบัตรของผู้เสียชีวิตทำรายการแทนขั้นตอนตามสิทธิ และไม่ถือว่าคำขอในแอปทำให้ถอนหรือโอนเงินได้',
    ],
    sources: [
      source(
        'ธนาคารกสิกรไทย: การจัดการบัญชีและทรัพย์สินของผู้เสียชีวิต',
        'https://www.kasikornbank.com/th/kwealth/Pages/a1038-t4-evg-wealth-management-in-everybody-loves-me-when-im-dead-kgth.aspx',
      ),
    ],
  },
  insurance: {
    steps: [
      'รวบรวมกรมธรรม์หรือเลขกรมธรรม์ มรณบัตร และหลักฐานผู้รับประโยชน์ที่มี',
      'ติดต่อบริษัทประกันเพื่อยืนยันผู้มีสิทธิ แบบคำร้อง หลักฐานเพิ่มเติม และกำหนดเวลาของกรมธรรม์นั้นโดยเร็ว',
      'ตรวจข้อยกเว้นและเหตุการเสียชีวิตกับบริษัท ไม่สรุปว่าจะได้รับเงิน จำนวนเท่าใด หรือภายในกี่วัน หากมีข้อสงสัยขอคำแนะนำจากสำนักงาน คปภ.',
    ],
    sources: [
      source(
        'สำนักงาน คปภ.: ตัวอย่างเงื่อนไขการเรียกร้องผลประโยชน์กรณีเสียชีวิต',
        'https://oiceservice.oic.or.th/document/Law/file/10388/10388_c468957628766ade647c6e370d253f83.pdf',
      ),
    ],
  },
  tax: {
    steps: [
      'แยกภาษีการรับมรดกของผู้รับแต่ละคน ออกจากภาษีเงินได้ของผู้เสียชีวิตหรือกองมรดกที่ยังไม่ได้แบ่ง',
      'รวบรวมประเภทและมูลค่าทรัพย์สิน วันที่ได้รับ ความสัมพันธ์กับเจ้ามรดก รวมถึงรายได้และแบบภาษีที่เกี่ยวข้อง โดยแยกตามผู้รับ',
      'นำข้อมูลไปสอบถามกรมสรรพากรหรือที่ปรึกษาภาษีเรื่องข้อยกเว้น วิธีประเมิน แบบและกำหนดเวลาที่ใช้กับกรณีของคุณ ยังสรุปไม่ได้ว่าคุณมีหน้าที่เสียภาษีหรือไม่จากข้อความหรือยอดทรัพย์สินในแอป และคำตอบนี้ไม่คำนวณภาษีให้',
    ],
    sources: [
      inheritance,
      source(
        'กรมสรรพากร: ผู้มีหน้าที่เสียภาษีเงินได้บุคคลธรรมดา',
        'https://www.rd.go.th/548.html',
      ),
    ],
  },
  property: {
    steps: [
      'รวบรวมโฉนดหรือเอกสารสิทธิ มรณบัตร หลักฐานยืนยันตัวบุคคล และพินัยกรรมหรือคำสั่งศาลที่มี',
      'สอบถามสำนักงานที่ดินที่รับผิดชอบทรัพย์สิน ให้ตรวจกรรมสิทธิ์ ภาระผูกพัน ผู้มีสิทธิยื่น และเอกสารเฉพาะกรณีมีหรือไม่มีผู้จัดการมรดก',
      'ยืนยันขั้นตอน ค่าใช้จ่าย และการนัดหมายกับเจ้าหน้าที่ก่อนยื่น ระยะเวลาและการประกาศอาจต่างกันตามข้อเท็จจริง การเพิ่มข้อมูลในแอปไม่ได้เปลี่ยนกรรมสิทธิ์',
    ],
    sources: [
      source(
        'กรมที่ดิน: คู่มือโอนมรดกกรณีมีผู้จัดการมรดก',
        'https://www.dol.go.th/dol-services/public-service-manual/citizen-guide/citizen-manual-824520267341676544/',
      ),
    ],
  },
  administrator: {
    steps: [
      'รวบรวมมรณบัตร รายการทรัพย์สิน เอกสารความสัมพันธ์ของทายาท และพินัยกรรมถ้ามี',
      'ขอคำแนะนำจากสำนักงานอัยการคุ้มครองสิทธิฯ หรือทนาย ว่าต้องร้องขอตั้งผู้จัดการมรดกหรือไม่ ใครมีสิทธิร้องและศาลใดมีเขตอำนาจ',
      'ยืนยันรายการเอกสารและขั้นตอนกับหน่วยงานก่อนยื่น โดยเฉพาะเมื่อมีผู้เยาว์ ข้อพิพาท หรือเอกสารไม่ครบ การเป็นผู้ติดต่อในแอปไม่ทำให้เป็นผู้จัดการมรดกตามกฎหมาย',
    ],
    sources: [
      source(
        'สำนักงานอัยการ: เอกสารเบื้องต้นขอตั้งผู้จัดการมรดก',
        'https://www3.ago.go.th/center/lawplan/',
      ),
      registration,
    ],
  },
  general: {
    steps: [
      'เริ่มทำรายการทรัพย์สินและเอกสารที่มี พร้อมบันทึกว่าต้องติดต่อธนาคาร บริษัทประกัน หรือหน่วยงานใด',
      'หากกำลังดูแลหลังการเสียชีวิต ให้สอบถามสำนักทะเบียนเรื่องการแจ้งตายและมรณบัตรทันที กรณีตายในบ้าน นอกบ้าน หรือต่างประเทศอาจมีขั้นตอนต่างกัน',
      'ใช้เช็กลิสต์บันทึกเอกสารที่ขาดและการติดต่อ เลือกผู้ติดต่อที่ไว้วางใจ และอนุมัติขอบเขตข้อมูลด้วยตนเอง แอปไม่เปิดข้อมูลอัตโนมัติหรือยืนยันสิทธิทายาท',
    ],
    sources: [registration, inheritance],
  },
};
function category(message: string): Category {
  if (/ภาษี|สรรพากร|tax/i.test(message)) return 'tax';
  if (/ธนาคาร|บัญชี|เงินฝาก|ถอนเงิน|bank/i.test(message)) return 'bank';
  if (/ประกัน|กรมธรรม์|insurance/i.test(message)) return 'insurance';
  if (/ผู้จัดการมรดก|ศาล|administrator/i.test(message)) return 'administrator';
  if (/ที่ดิน|บ้าน|โฉนด|คอนโด|property/i.test(message)) return 'property';
  return 'general';
}
const disclaimer =
  'โหมดสาธิต: คำแนะนำจากชุดข้อมูลที่เตรียมไว้ ไม่ใช่ AI ที่วิเคราะห์ข้อเท็จจริงของคุณ เป็นข้อมูลทั่วไป ไม่ใช่คำปรึกษากฎหมายหรือภาษีเฉพาะกรณี โปรดยืนยันเงื่อนไขล่าสุดกับหน่วยงานหรือผู้เชี่ยวชาญ';
const inputSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  includeContext: z.boolean().default(false),
});
async function gatewayResult(response: Response) {
  if (!response.ok)
    throw new ApiError(502, 'ผู้ให้บริการผู้ช่วยไม่พร้อมใช้งาน');
  const reader = response.body?.getReader();
  if (!reader) throw new ApiError(502, 'ผู้ให้บริการไม่ส่งคำตอบ');
  let total = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 65536) {
      await reader.cancel();
      throw new ApiError(502, 'คำตอบจากผู้ให้บริการยาวเกินกำหนด');
    }
    chunks.push(value);
  }
  try {
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      bytes.set(c, offset);
      offset += c.byteLength;
    }
    return z
      .object({ message: z.string().trim().min(1).max(12000) })
      .parse(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    throw new ApiError(502, 'รูปแบบคำตอบจากผู้ให้บริการไม่ถูกต้อง');
  }
}
export function createAssistant(
  service: Pick<ReturnType<typeof createService>, 'state'>,
) {
  return {
    async answer(token: string, input: unknown) {
      const { message, includeContext } = inputSchema.parse(input);
      const state = await service.state(token);
      const context: Context | undefined = includeContext
        ? {
            assetCount: state.assets.length,
            documentCount: state.documents.length,
            assetTypes: [
              ...new Set(state.assets.map((a) => String(a.category))),
            ].sort(),
          }
        : undefined;
      const guide = guides[category(message)];
      const readiness = context
        ? `\n\nข้อมูลที่คุณได้รับสิทธิ์ขณะนี้: ทรัพย์สิน ${context.assetCount} รายการ และเอกสาร ${context.documentCount} รายการ จำนวนนี้ไม่ยืนยันความครบถ้วนหรือสิทธิตามกฎหมาย`
        : '';
      if (process.env.AI_GATEWAY_URL && process.env.AI_GATEWAY_KEY) {
        const url = new URL(process.env.AI_GATEWAY_URL);
        if (url.protocol !== 'https:')
          throw new ApiError(503, 'ผู้ให้บริการต้องเชื่อมต่อผ่าน HTTPS');
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.AI_GATEWAY_KEY}`,
            },
            body: JSON.stringify({
              message,
              context,
              language: 'th',
              system:
                'ให้ข้อมูลทั่วไปเกี่ยวกับการเตรียมมรดกในไทยเท่านั้น ไม่วินิจฉัยสิทธิหรือภาระภาษี ไม่ขอรหัสผ่าน PIN หรือ OTP ระบุเงื่อนไขและแนะนำยืนยันกับหน่วยงานทางการ บริบทเป็นเพียงจำนวนและประเภทข้อมูลที่ผู้ใช้ได้รับอนุญาตเท่านั้น ห้ามอนุมานข้อมูลที่ไม่ได้รับ',
            }),
            signal: AbortSignal.timeout(15000),
          });
          const result = await gatewayResult(response);
          return {
            message:
              result.message +
              '\n\nคำตอบจากผู้ให้บริการ AI อาจคลาดเคลื่อน โปรดยืนยันกับหน่วยงานหรือผู้เชี่ยวชาญ' +
              readiness,
            mode: 'provider' as const,
            sources: guide.sources,
            ...(context ? { context } : {}),
          };
        } catch (error) {
          if (error instanceof ApiError) throw error;
          throw new ApiError(
            502,
            'เชื่อมต่อผู้ให้บริการผู้ช่วยไม่สำเร็จ กรุณาลองใหม่',
          );
        }
      }
      return {
        message:
          disclaimer +
          '\n\n' +
          guide.steps.map((step, i) => `${i + 1}. ${step}`).join('\n\n') +
          readiness,
        mode: 'guided' as const,
        sources: guide.sources,
        ...(context ? { context } : {}),
      };
    },
  };
}
