import { describe, it, expect, vi } from 'vitest';
import { createService } from '../src/lib/server';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
describe('household security', () => {
  it('isolates households and requires approval before family access, then revokes immediately', async () => {
    const service = createService(await mkdtemp(join(tmpdir(), 'saan-test-')));
    const owner = await service.auth({ action: 'demo', role: 'OWNER' });
    const other = await service.auth({ action: 'demo', role: 'OWNER' });
    const family = await service.auth(
      { action: 'demo', role: 'FAMILY' },
      owner.household,
    );
    expect((await service.state(family.token)).assets).toHaveLength(0);
    const request = await service.mutate(family.token, 'requests', 'POST', {
      permissions: ['assets'],
    });
    await expect(
      service.mutate(other.token, 'requests', 'PATCH', {
        id: request.id,
        status: 'approved',
      }),
    ).rejects.toThrow();
    await service.mutate(owner.token, 'requests', 'PATCH', {
      id: request.id,
      status: 'approved',
    });
    expect((await service.state(family.token)).assets).toHaveLength(5);
    const contact = (await service.state(owner.token)).contacts[0];
    await service.mutate(owner.token, 'contacts', 'PATCH', {
      id: contact.id,
      status: 'revoked',
    });
    expect((await service.state(family.token)).assets).toHaveLength(0);
    await service.mutate(owner.token, 'contacts', 'PATCH', {
      id: contact.id,
      status: 'active',
    });
    expect((await service.state(family.token)).assets).toHaveLength(5);
    await service.mutate(owner.token, 'requests', 'PATCH', {
      id: request.id,
      status: 'revoked',
    });
    expect((await service.state(family.token)).assets).toHaveLength(0);
  });
  it('hashes credentials and rejects wrong passwords and unauthenticated reads', async () => {
    const service = createService(await mkdtemp(join(tmpdir(), 'saan-test-')));
    await service.auth({
      action: 'register',
      name: 'Test',
      email: 'test@example.com',
      password: 'long-password',
      consent: true,
    });
    await expect(
      service.auth({
        action: 'login',
        email: 'test@example.com',
        password: 'incorrect',
      }),
    ).rejects.toThrow();
    await expect(service.state('invalid')).rejects.toThrow();
    expect(
      (
        await service.auth({
          action: 'login',
          email: 'test@example.com',
          password: 'long-password',
        })
      ).token,
    ).toBeTruthy();
  });
});
describe('persistence and document authorization', () => {
  it('persists encrypted records and denies family downloads before approval', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'saan-docs-'));
    const service = createService(directory);
    const owner = await service.auth({ action: 'demo' });
    const family = await service.auth(
      { action: 'demo', role: 'FAMILY' },
      owner.household,
    );
    const state = await service.state(owner.token);
    await expect(
      service.download(family.token, state.documents[0].id),
    ).rejects.toThrow();
    expect(
      (await service.download(owner.token, state.documents[0].id)).bytes.length,
    ).toBeGreaterThan(0);
    const reloaded = createService(directory);
    expect((await reloaded.state(owner.token)).assets).toHaveLength(5);
    const { readFile } = await import('node:fs/promises');
    const disk = await readFile(join(directory, 'vault.enc'), 'utf8');
    expect(disk).not.toContain('somchai@example.test');
    await expect(
      service.mutate(family.token, 'assets', 'POST', {
        name: 'Unauthorized',
        category: 'bank',
      }),
    ).rejects.toThrow();
  });
  it('supports owner CRUD and prevents cross-household modification', async () => {
    const service = createService(await mkdtemp(join(tmpdir(), 'saan-crud-')));
    const first = await service.auth({ action: 'demo' }),
      second = await service.auth({ action: 'demo' });
    const created = await service.mutate(first.token, 'assets', 'POST', {
      name: 'New asset',
      category: 'bank',
      value: 100,
    });
    await expect(
      service.mutate(second.token, 'assets', 'PATCH', {
        id: created.id,
        name: 'Stolen',
      }),
    ).rejects.toThrow();
    await service.mutate(first.token, 'assets', 'PATCH', {
      id: created.id,
      value: 200,
    });
    expect(
      (await service.state(first.token)).assets.find((a) => a.id === created.id)
        ?.value,
    ).toBe(200);
    await service.mutate(first.token, 'assets', 'DELETE', { id: created.id });
    expect(
      (await service.state(first.token)).assets.some(
        (a) => a.id === created.id,
      ),
    ).toBe(false);
  });
});
describe('HTTP boundaries', () => {
  it('rejects cross-origin mutation before processing the handler', async () => {
    const { NextRequest } = await import('next/server');
    const { endpoint } = await import('../src/lib/http');
    let called = false;
    const response = await endpoint(
      new NextRequest('http://localhost:3000/api/assets', {
        method: 'POST',
        headers: { origin: 'https://attacker.example' },
      }),
      async () => {
        called = true;
        return { ok: true };
      },
    );
    expect(response.status).toBe(403);
    expect(called).toBe(false);
  });
});
describe('family administrative checklist', () => {
  it('provides independent six-step progress before sharing approval and persists edits', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'yootor-checklist-'));
    const service = createService(directory);
    const owner = await service.auth({ action: 'demo' });
    const family = await service.auth(
      { action: 'demo', role: 'FAMILY' },
      owner.household,
    );
    const ownerState = await service.state(owner.token),
      familyState = await service.state(family.token);
    expect(familyState.assets).toHaveLength(0);
    expect(familyState.tasks).toHaveLength(6);
    expect(ownerState.tasks).toHaveLength(6);
    await service.mutate(family.token, 'tasks', 'PATCH', {
      id: familyState.tasks[0].id,
      status: 'completed',
      notes: 'ติดต่อสำนักงานเขตแล้ว',
    });
    expect(
      (await createService(directory).state(family.token)).tasks[0].status,
    ).toBe('completed');
    expect((await service.state(owner.token)).tasks[0].status).toBe(
      'not_started',
    );
    await expect(
      service.mutate(family.token, 'tasks', 'PATCH', {
        id: ownerState.tasks[0].id,
        status: 'completed',
      }),
    ).rejects.toThrow();
    await expect(
      service.mutate(owner.token, 'tasks', 'PATCH', {
        id: familyState.tasks[0].id,
        status: 'completed',
      }),
    ).rejects.toThrow();
  });
  it('starts a real owner with six preparation tasks and audits valid PDF downloads', async () => {
    const service = createService(
      await mkdtemp(join(tmpdir(), 'yootor-owner-')),
    );
    const owner = await service.auth({
      action: 'register',
      name: 'Owner',
      email: 'owner@example.test',
      password: 'long-password',
      consent: true,
    });
    expect((await service.state(owner.token)).tasks).toHaveLength(6);
    const demo = await service.auth({ action: 'demo' });
    const state = await service.state(demo.token);
    const doc = await service.download(demo.token, state.documents[0].id);
    expect(doc.mime).toBe('application/pdf');
    expect(doc.bytes.subarray(0, 5).toString()).toBe('%PDF-');
    expect(doc.bytes.toString()).toContain('startxref');
    expect((await service.state(demo.token)).activities[0].message).toContain(
      'ดาวน์โหลด',
    );
  });
  it('fails closed for real production family registration without identity delivery', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    try {
      const service = createService(
        await mkdtemp(join(tmpdir(), 'yootor-prod-')),
      );
      await expect(
        service.auth({
          action: 'register',
          role: 'FAMILY',
          name: 'Family',
          email: 'family@example.test',
          password: 'long-password',
          consent: true,
        }),
      ).rejects.toThrow('ยืนยัน');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
describe('local development request origin', () => {
  it('accepts same-host browser requests when Next binds its internal URL to all interfaces', async () => {
    const { NextRequest } = await import('next/server');
    const { endpoint } = await import('../src/lib/http');
    const response = await endpoint(
      new NextRequest('http://0.0.0.0:3000/api/assets', {
        method: 'POST',
        headers: { origin: 'http://localhost:3000', host: 'localhost:3000' },
      }),
      async () => ({ ok: true }),
    );
    expect(response.status).toBe(200);
  });
});
describe('demo request isolation regression', () => {
  it('keeps a second demo family request within its own household despite shared synthetic emails', async () => {
    const service = createService(
      await mkdtemp(join(tmpdir(), 'yootor-demo-scope-')),
    );
    const first = await service.auth({ action: 'demo' });
    const second = await service.auth({ action: 'demo' });
    const family = await service.auth(
      { action: 'demo', role: 'FAMILY' },
      second.household,
    );
    const request = await service.mutate(family.token, 'requests', 'POST', {
      ownerEmail: 'somchai@example.test',
      permissions: ['assets'],
    });
    expect((await service.state(first.token)).requests).toHaveLength(0);
    expect(
      (await service.state(second.token)).requests.map((r) => r.id),
    ).toContain(request.id);
    await service.mutate(second.token, 'requests', 'PATCH', {
      id: request.id,
      status: 'approved',
    });
    expect((await service.state(family.token)).assets[0].id).toBe(
      (await service.state(second.token)).assets[0].id,
    );
  });
  it('normalizes contact email before matching invitations', async () => {
    const service = createService(
      await mkdtemp(join(tmpdir(), 'yootor-email-case-')),
    );
    const owner = await service.auth({
      action: 'register',
      name: 'Owner',
      email: 'owner@example.test',
      password: 'long-password',
      consent: true,
    });
    await service.mutate(owner.token, 'contacts', 'POST', {
      name: 'Family',
      email: 'MALI@EXAMPLE.TEST',
      status: 'active',
      permissions: ['assets'],
    });
    const family = await service.auth({
      action: 'register',
      role: 'FAMILY',
      name: 'Family',
      email: 'mali@example.test',
      password: 'long-password',
      consent: true,
    });
    expect(family.household).toBe(owner.household);
  });
});
describe('bounded demo and storage', () => {
  it('expires demo households after 24h and creates a fresh isolated household', async () => {
    const service = createService(await mkdtemp(join(tmpdir(), 'yootor-ttl-')));
    const now = Date.now();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(now);
    try {
      const initial = await service.auth({ action: 'demo' });
      clock.mockReturnValue(now + 86400001);
      await expect(service.state(initial.token)).rejects.toThrow();
      const fresh = await service.auth({ action: 'demo' }, initial.household);
      expect(fresh.household).not.toBe(initial.household);
    } finally {
      clock.mockRestore();
    }
  });
  it('bounds active sessions and access requests', async () => {
    const service = createService(
      await mkdtemp(join(tmpdir(), 'yootor-limits-')),
    );
    const first = await service.auth({ action: 'demo' });
    let latest = first;
    for (let i = 0; i < 10; i++)
      latest = await service.auth({ action: 'demo' }, first.household);
    await expect(service.state(first.token)).rejects.toThrow();
    expect((await service.state(latest.token)).assets).toHaveLength(5);
    const family = await service.auth(
      { action: 'demo', role: 'FAMILY' },
      first.household,
    );
    for (let i = 0; i < 10; i++)
      await service.mutate(family.token, 'requests', 'POST', {});
    await expect(
      service.mutate(family.token, 'requests', 'POST', {}),
    ).rejects.toThrow('ขีดจำกัด');
  });
  it('rejects header-only spoof files and bounds household document counts', async () => {
    const service = createService(
      await mkdtemp(join(tmpdir(), 'yootor-files-')),
    );
    const owner = await service.auth({ action: 'demo' });
    await expect(
      service.upload(
        owner.token,
        {
          name: 'fake.pdf',
          mime: 'application/pdf',
          bytes: Buffer.from('%PDF-1.4 incomplete'),
        },
        'Fake',
        'general',
      ),
    ).rejects.toThrow();
    const state = await service.state(owner.token);
    const pdf = await service.download(owner.token, state.documents[0].id);
    for (let i = 0; i < 27; i++)
      await service.upload(
        owner.token,
        { name: 'sample.pdf', mime: 'application/pdf', bytes: pdf.bytes },
        'Sample',
        'general',
      );
    await expect(
      service.upload(
        owner.token,
        { name: 'sample.pdf', mime: 'application/pdf', bytes: pdf.bytes },
        'Sample',
        'general',
      ),
    ).rejects.toThrow('30');
  });
  it('disables local-file persistence in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DATABASE_URL', '');
    try {
      const service = createService(
        await mkdtemp(join(tmpdir(), 'yootor-prod-db-')),
      );
      await expect(service.auth({ action: 'demo' })).rejects.toThrow(
        'PostgreSQL',
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
describe('family-first demonstration', () => {
  it('creates its own owner reviewer without looking up another synthetic household', async () => {
    const service = createService(
      await mkdtemp(join(tmpdir(), 'yootor-family-first-')),
    );
    const family = await service.auth({ action: 'demo', role: 'FAMILY' });
    const request = await service.mutate(family.token, 'requests', 'POST', {
      ownerEmail: 'somchai@example.test',
      permissions: ['assets'],
    });
    const owner = await service.auth(
      { action: 'demo', role: 'OWNER' },
      family.household,
    );
    expect((await service.state(owner.token)).requests[0].id).toBe(request.id);
  });
});
describe('onboarding preferences and profile identity', () => {
  it('persists explicit onboarding enums and updates the signed-in greeting name', async () => {
    const service = createService(
      await mkdtemp(join(tmpdir(), 'yootor-profile-')),
    );
    const owner = await service.auth({
      action: 'register',
      name: 'Original',
      email: 'profile@example.test',
      password: 'long-password',
      consent: true,
      ownsAssets: 'later',
      nominate: 'yes',
      goal: 'จัดระเบียบทรัพย์สินและเอกสาร',
    });
    const initial = await service.state(owner.token);
    expect(initial.profile.ownsAssets).toBe('later');
    expect(initial.profile.nominate).toBe('yes');
    expect(initial.profile.goal).toBe('จัดระเบียบทรัพย์สินและเอกสาร');
    await service.mutate(owner.token, 'profile', 'PATCH', {
      name: 'Updated',
      ownsAssets: 'yes',
      nominate: 'later',
      goal: 'ทำความเข้าใจขั้นตอนต่าง ๆ',
    });
    const updated = await service.state(owner.token);
    expect(updated.user.name).toBe('Updated');
    expect(updated.profile.goal).toBe('ทำความเข้าใจขั้นตอนต่าง ๆ');
    await expect(
      service.mutate(owner.token, 'profile', 'PATCH', { goal: 'unrecognized' }),
    ).rejects.toThrow();
  });
});
describe('bounded JSON requests', () => {
  it('rejects declared and actual oversized JSON before parsing', async () => {
    const { NextRequest } = await import('next/server');
    const { readJson } = await import('../src/lib/http');
    await expect(
      readJson(
        new NextRequest('http://localhost:3000/api/assets', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'content-length': '999999',
          },
          body: '{}',
        }),
      ),
    ).rejects.toThrow('ขนาด');
    await expect(
      readJson(
        new NextRequest('http://localhost:3000/api/assets', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ notes: 'x'.repeat(70000) }),
        }),
      ),
    ).rejects.toThrow('ขนาด');
  });
  it('accepts bounded JSON and rejects unsupported media types', async () => {
    const { NextRequest } = await import('next/server');
    const { readJson } = await import('../src/lib/http');
    expect(
      await readJson(
        new NextRequest('http://localhost:3000/api/assets', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{"name":"asset"}',
        }),
      ),
    ).toEqual({ name: 'asset' });
    await expect(
      readJson(
        new NextRequest('http://localhost:3000/api/assets', {
          method: 'POST',
          headers: { 'content-type': 'text/plain' },
          body: '{}',
        }),
      ),
    ).rejects.toThrow();
  });
});
