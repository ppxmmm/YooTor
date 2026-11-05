import { describe, it, expect, vi, afterEach } from 'vitest';
import { createAssistant } from '../src/lib/assistant';
import { createService } from '../src/lib/server';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
afterEach(() => vi.unstubAllEnvs());
async function fixture() {
  vi.stubEnv('AI_GATEWAY_URL', '');
  vi.stubEnv('AI_GATEWAY_KEY', '');
  const service = createService(
    await mkdtemp(join(tmpdir(), 'yootor-assistant-')),
  );
  const owner = await service.auth({ action: 'demo' });
  return { service, owner, assistant: createAssistant(service) };
}
describe('guided assistant', () => {
  it('gives numbered banking steps, document preparation and a first-party source', async () => {
    const { assistant, owner } = await fixture();
    const result = await assistant.answer(owner.token, {
      message: 'คนในครอบครัวเสียชีวิต ต้องจัดการบัญชีธนาคารอย่างไร',
    });
    expect(result.mode).toBe('guided');
    expect(result.message).toContain('1.');
    expect(result.message).toContain('2.');
    expect(result.message).toContain('มรณบัตร');
    expect(result.message).toContain('โหมดสาธิต');
    expect(result.sources.some((s) => s.url.includes('kasikornbank.com'))).toBe(
      true,
    );
  });
  it('distinguishes estate income tax from inheritance tax without deciding liability', async () => {
    const { assistant, owner } = await fixture();
    const result = await assistant.answer(owner.token, {
      message: 'ต้องเสียภาษีมรดกหรือไม่',
    });
    expect(result.message).toContain('ภาษีเงินได้');
    expect(result.message).toContain('ยังสรุปไม่ได้');
    expect(result.sources.map((s) => s.url)).toContain(
      'https://www.rd.go.th/548.html',
    );
    expect(result.sources.map((s) => s.url)).toContain(
      'https://www.rd.go.th/56657.html',
    );
  });
  it('summarizes only authorized counts and types with no leaked household names', async () => {
    const { assistant, service, owner } = await fixture();
    const family = await service.auth(
      { action: 'demo', role: 'FAMILY' },
      owner.household,
    );
    const result = await assistant.answer(family.token, {
      message: 'ควรเริ่มจากอะไร',
      includeContext: true,
    });
    expect(result.context).toEqual({
      assetCount: 0,
      documentCount: 0,
      assetTypes: [],
    });
    expect(result.message).toContain('ทรัพย์สิน 0 รายการ');
    expect(result.message).not.toContain('Toyota');
    expect(result.message).not.toContain('กสิกร');
    expect(JSON.stringify(result)).not.toContain('6500000');
  });
  it('rejects unauthenticated requests', async () => {
    const { assistant } = await fixture();
    await expect(
      assistant.answer('invalid', { message: 'เริ่มจากอะไร' }),
    ).rejects.toThrow();
  });
});
describe('optional provider boundary', () => {
  it('sends only opted-in permission-scoped counts and types', async () => {
    const { assistant, service, owner } = await fixture();
    const family = await service.auth(
      { action: 'demo', role: 'FAMILY' },
      owner.household,
    );
    vi.stubEnv('AI_GATEWAY_URL', 'https://gateway.example.test/assistant');
    vi.stubEnv('AI_GATEWAY_KEY', 'test-key');
    const fetchMock = vi.fn(async () =>
      Response.json({ message: 'ข้อมูลทั่วไป โปรดตรวจสอบกับเจ้าหน้าที่' }),
    );
    vi.stubGlobal('fetch', fetchMock);
    try {
      const result = await assistant.answer(family.token, {
        message: 'ช่วยเตรียมข้อมูล',
        includeContext: true,
      });
      const body = JSON.parse(
        (fetchMock.mock.calls[0] as unknown as [URL, RequestInit])[1]
          .body as string,
      );
      expect(body.context).toEqual({
        assetCount: 0,
        documentCount: 0,
        assetTypes: [],
      });
      expect(JSON.stringify(body)).not.toContain('Toyota');
      expect(result.mode).toBe('provider');
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('rejects oversized provider output instead of returning it to the user', async () => {
    const { assistant, owner } = await fixture();
    vi.stubEnv('AI_GATEWAY_URL', 'https://gateway.example.test/assistant');
    vi.stubEnv('AI_GATEWAY_KEY', 'test-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ message: 'x'.repeat(12001) })),
    );
    try {
      await expect(
        assistant.answer(owner.token, { message: 'เริ่มต้น' }),
      ).rejects.toThrow('รูปแบบคำตอบ');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
